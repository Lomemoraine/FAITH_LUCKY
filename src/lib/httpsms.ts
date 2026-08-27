/**
 * TFL SafeSpace - httpSMS Gateway Client
 * Supports both self-hosted Docker and httpSMS Cloud.
 */

interface SendSMSOptions {
  to: string;
  content: string;
  encrypted?: boolean;
}

interface SendSMSResponse {
  status: "success" | "error";
  data?: {
    id: string;
    owner: string;
    userId: string;
    content: string;
    from: string;
    to: string;
    status: string;
    createdAt: string;
  };
  message?: string;
}

/**
 * Sends an outbound SMS using httpSMS (via the connected Android phone)
 */
export async function sendSMS({ to, content }: SendSMSOptions): Promise<SendSMSResponse> {
  const apiBaseUrl = process.env.HTTPSMS_API_URL || "https://api.httpsms.com";
  const apiKey = process.env.HTTPSMS_API_KEY;
  const fromNumber = process.env.HTTPSMS_FROM_NUMBER;

  if (!apiKey || !fromNumber) {
    console.warn("[httpSMS] Missing HTTPSMS_API_KEY or HTTPSMS_FROM_NUMBER. SMS dispatch skipped.");
    return {
      status: "error",
      message: "httpSMS is not configured in environment variables.",
    };
  }

  // Format international number if starting with 07 or 01 (Kenyan numbers)
  let normalizedTo = to.trim();
  if (normalizedTo.startsWith("07") || normalizedTo.startsWith("01")) {
    normalizedTo = "+254" + normalizedTo.substring(1);
  } else if (normalizedTo.startsWith("254")) {
    normalizedTo = "+" + normalizedTo;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/v1/messages/send`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content,
        from: fromNumber,
        to: normalizedTo,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[httpSMS Error ${response.status}]:`, errorText);
      return {
        status: "error",
        message: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      status: "success",
      data: data.data,
    };
  } catch (error) {
    console.error("[httpSMS Exception]:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown SMS network error",
    };
  }
}

/**
 * Dispatches an emergency SMS alert to the on-duty psychologist / crisis responder
 */
export async function sendCrisisEscalationAlert({
  counselorPhone,
  postId,
  roomName,
  severity,
}: {
  counselorPhone?: string;
  postId: string;
  roomName: string;
  severity: "priority" | "critical";
}) {
  const targetPhone = counselorPhone || process.env.DUTY_COUNSELOR_PHONE;
  if (!targetPhone) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://safespace.talkfreelylifestyle.org";
  const message = `[TFL URGENT ALERT] ${severity.toUpperCase()} distress post detected in #${roomName}. Post ID: ${postId.slice(
    0,
    8
  )}. Review immediately at ${siteUrl}/moderation`;

  return sendSMS({
    to: targetPhone,
    content: message,
  });
}

/**
 * Sends Care Pass voucher code to customer upon merchandise purchase or referral
 */
export async function sendVoucherSMS({
  customerPhone,
  voucherCode,
  productTitle,
}: {
  customerPhone: string;
  voucherCode: string;
  productTitle?: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://safespace.talkfreelylifestyle.org";
  const message = `TFL SafeSpace: Thank you for your support${
    productTitle ? ` with ${productTitle}` : ""
  }! Your complimentary Care Pass code is: ${voucherCode}. Redeem your confidential counseling session here: ${siteUrl}/counseling`;

  return sendSMS({
    to: customerPhone,
    content: message,
  });
}

/**
 * Sends confidential appointment / reply reminder to anonymous user
 */
export async function sendAppointmentReminder({
  userPhone,
  counselorName,
  sessionTime,
}: {
  userPhone: string;
  counselorName: string;
  sessionTime: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://safespace.talkfreelylifestyle.org";
  const message = `TFL SafeSpace: Your private counseling session with ${counselorName} is confirmed for ${sessionTime}. Join privately: ${siteUrl}/counseling`;

  return sendSMS({
    to: userPhone,
    content: message,
  });
}
