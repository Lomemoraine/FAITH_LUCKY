import { NextRequest, NextResponse } from "next/server";
import { sendSMS, sendVoucherSMS } from "@/lib/httpsms";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

interface HttpSmsWebhookPayload {
  id?: string;
  owner?: string;
  userId?: string;
  content: string;
  from: string; // sender phone number
  to: string;   // our phone number
  timestamp?: string;
  type?: string;
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as HttpSmsWebhookPayload;
    const content = payload?.content?.trim() || "";
    const senderPhone = payload?.from?.trim() || "";

    if (!content || !senderPhone) {
      return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
    }

    const upperContent = content.toUpperCase();
    const supabase = createAdminSupabaseClient();

    // 1. HELP / CRISIS HOTLINE AUTO-RESPONSE
    if (
      upperContent === "HELP" ||
      upperContent === "CRISIS" ||
      upperContent === "MSAADA" ||
      upperContent.includes("HELP ME")
    ) {
      await sendSMS({
        to: senderPhone,
        content:
          "TFL SafeSpace Crisis Support: You are not alone. Free 24/7 Helplines in Kenya: Befrienders: 0722 178 177 | Red Cross: 1199 | LVCT: 1190. Connect online anonymously: " +
          (process.env.NEXT_PUBLIC_SITE_URL || "https://safespace.talkfreelylifestyle.org"),
      });

      return NextResponse.json({ received: true, action: "helpline_dispatched" });
    }

    // 2. VOUCHER LOOKUP (e.g. "VOUCHER PASS-1234" or "CAREPASS")
    if (upperContent.startsWith("VOUCHER") || upperContent.startsWith("PASS")) {
      const parts = content.split(/\s+/);
      const code = parts.length > 1 ? parts[1].trim() : null;

      if (!code) {
        await sendSMS({
          to: senderPhone,
          content: "TFL SafeSpace: To check your voucher, reply with 'VOUCHER <YOUR-CODE>' (e.g. VOUCHER TFL-8921).",
        });
        return NextResponse.json({ received: true, action: "voucher_syntax_help" });
      }

      if (supabase) {
        const { data: order } = await supabase
          .from("orders")
          .select("voucher_code, status, amount_kes")
          .ilike("voucher_code", code)
          .maybeSingle();

        if (order) {
          await sendSMS({
            to: senderPhone,
            content: `TFL SafeSpace: Voucher code ${order.voucher_code} is valid! Status: ${order.status.toUpperCase()}. Redeem online at ${process.env.NEXT_PUBLIC_SITE_URL}/counseling`,
          });
        } else {
          await sendSMS({
            to: senderPhone,
            content: `TFL SafeSpace: Voucher code ${code} was not found. Please check your code or contact support.`,
          });
        }
      }

      return NextResponse.json({ received: true, action: "voucher_checked" });
    }

    // 3. M-PESA INCOMING SMS PARSER (Payment confirmation receipt interception)
    // Matches Safaricom formats: e.g. "QK81XX9999 Confirmed. Ksh500.00 received from 254712345678..." or "Ksh. 500"
    const mpesaMatch = content.match(/([A-Z0-9]{8,12})\s+Confirmed\.?\s*(?:Ksh|Kshs|KES)?\.?\s*([0-9,]+(?:\.[0-9]{1,2})?)\s+received\s+from\s+([0-9+]+)/i);
    if (mpesaMatch && supabase) {
      const receiptCode = mpesaMatch[1];
      const amount = parseFloat(mpesaMatch[2].replace(/,/g, ""));
      const rawSender = mpesaMatch[3];

      // Format sender phone
      const customerPhone = rawSender.startsWith("+") ? rawSender : `+${rawSender}`;

      // Check if there is a pending order for this customer or amount
      const { data: pendingOrder } = await supabase
        .from("orders")
        .select("id, voucher_code, customer_name, amount_kes")
        .eq("status", "pending")
        .eq("amount_kes", amount)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingOrder) {
        await supabase
          .from("orders")
          .update({
            status: "paid",
            mpesa_receipt_number: receiptCode,
          })
          .eq("id", pendingOrder.id);

        // Text the customer their voucher code
        if (pendingOrder.voucher_code) {
          await sendVoucherSMS({
            customerPhone,
            voucherCode: pendingOrder.voucher_code,
          });
        }
      }

      return NextResponse.json({ received: true, action: "mpesa_processed", receipt: receiptCode });
    }

    // Fallback default response
    return NextResponse.json({ received: true, action: "none" });
  } catch (error) {
    console.error("[SMS Webhook Error]:", error);
    return NextResponse.json({ error: "Internal processing error" }, { status: 500 });
  }
}
