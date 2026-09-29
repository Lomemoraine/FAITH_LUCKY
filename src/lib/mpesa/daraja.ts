import { z } from "zod";
import { PaymentError, paymentPassword, resultCodeSchema } from "./contracts";

export function getMpesaConfig(env: Record<string, string | undefined> = process.env) {
  const required = (key: string) => {
    const value = env[key]?.trim();
    if (!value || /placeholder|your[_ -]|replace[_ -]/i.test(value)) throw new PaymentError("M-Pesa is not configured yet.");
    return value;
  };
  const environment = env.MPESA_ENVIRONMENT || "sandbox";
  if (environment !== "sandbox" && environment !== "production") throw new PaymentError("Invalid M-Pesa environment.");
  const shortcode = required("MPESA_SHORTCODE");
  const partyB = required("MPESA_PARTY_B");
  const transactionType = required("MPESA_TRANSACTION_TYPE");
  const callback = new URL(required("MPESA_CALLBACK_BASE_URL"));
  if (callback.protocol !== "https:" || callback.username || callback.password || callback.search || callback.hash || callback.pathname !== "/") {
    throw new PaymentError("M-Pesa needs a public HTTPS callback origin.");
  }
  if (!/^\d{5,7}$/.test(shortcode) || !/^\d{5,7}$/.test(partyB) || !["CustomerPayBillOnline", "CustomerBuyGoodsOnline"].includes(transactionType)) {
    throw new PaymentError("Invalid M-Pesa merchant configuration.");
  }
  if (environment === "production" && shortcode === "174379") throw new PaymentError("Sandbox merchant details cannot be used for production.");
  return { environment, origin: environment === "sandbox" ? "https://sandbox.safaricom.co.ke" : "https://api.safaricom.co.ke",
    key: required("MPESA_CONSUMER_KEY"), secret: required("MPESA_CONSUMER_SECRET"), passkey: required("MPESA_PASSKEY"),
    shortcode, partyB, transactionType, callbackOrigin: callback.origin };
}
export type MpesaConfig = ReturnType<typeof getMpesaConfig>;

async function accessToken(config: MpesaConfig, transport: typeof fetch): Promise<string> {
  try {
    const response = await transport(`${config.origin}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${Buffer.from(`${config.key}:${config.secret}`).toString("base64")}` },
      signal: AbortSignal.timeout(10000), cache: "no-store", redirect: "error",
    });
    const data = await response.json();
    if (!response.ok || !data.access_token || typeof data.access_token !== "string") throw new Error("OAuth rejected");
    return data.access_token;
  } catch { throw new PaymentError("Unable to authenticate with M-Pesa. Please try again later.", 503, true); }
}

function credentials(config: MpesaConfig) {
  // Explicit Nairobi time, independent of the server's time zone.
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const timestamp = ["year", "month", "day", "hour", "minute", "second"].map((type) => parts.find((p) => p.type === type)!.value).join("");
  return { BusinessShortCode: config.shortcode, Timestamp: timestamp, Password: paymentPassword(config.shortcode, config.passkey, timestamp) };
}

export async function initiateStk(params: { amount: number; phone: string; reference: string; callbackUrl: string },
  config = getMpesaConfig(), transport: typeof fetch = fetch) {
  const token = await accessToken(config, transport);
  try {
    const response = await transport(`${config.origin}/mpesa/stkpush/v1/processrequest`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...credentials(config), TransactionType: config.transactionType, Amount: params.amount,
        PartyA: params.phone, PartyB: config.partyB, PhoneNumber: params.phone, CallBackURL: params.callbackUrl,
        AccountReference: params.reference.slice(0, 12), TransactionDesc: "TFL Care Pass" }),
      signal: AbortSignal.timeout(15000), redirect: "error", cache: "no-store",
    });
    if (!response.ok) throw new PaymentError("M-Pesa could not accept the payment request.", 503, response.status >= 400 && response.status < 500);
    const data = await response.json();
    if (data.ResponseCode !== "0" && data.ResponseCode !== 0) throw new PaymentError("M-Pesa rejected the payment request.", 400, true);
    return { merchantRequestId: z.string().min(1).max(150).parse(data.MerchantRequestID),
      checkoutRequestId: z.string().min(1).max(150).parse(data.CheckoutRequestID) };
  } catch (error) {
    if (error instanceof PaymentError) throw error;
    throw new PaymentError("The payment request outcome is uncertain. Check this order before trying another payment.");
  }
}

export async function queryStk(checkoutRequestId: string, config = getMpesaConfig(), transport: typeof fetch = fetch) {
  const token = await accessToken(config, transport);
  try {
    const response = await transport(`${config.origin}/mpesa/stkpushquery/v1/query`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...credentials(config), CheckoutRequestID: checkoutRequestId }),
      signal: AbortSignal.timeout(10000), redirect: "error", cache: "no-store",
    });
    if (!response.ok) throw new Error("Query unavailable");
    const data = await response.json();
    const code = resultCodeSchema.safeParse(data.ResponseCode === "0" || data.ResponseCode === 0 ? data.ResultCode : undefined);
    return { resultCode: code.success ? code.data : null, checkoutRequestId: data.CheckoutRequestID as unknown,
      merchantRequestId: data.MerchantRequestID as unknown };
  } catch { throw new PaymentError("Payment confirmation is temporarily unavailable. Your order remains pending."); }
}
