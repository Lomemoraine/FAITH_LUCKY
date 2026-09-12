import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createAdminSupabaseClient } from "../supabase/admin";
import { sendVoucherSMS } from "../httpsms";
import { checkRateLimit } from "../ratelimit/limiter";
import { CareVoucher, StoreOrder } from "../types";
import { checkoutInput, normalizePhone, parseCallback, PaymentCallback, PaymentError } from "./contracts";
import { getMpesaConfig, initiateStk, queryStk } from "./daraja";

interface PaymentOrder {
  id: string; buyer_id: string; order_number: string; product_id: string; item_name: string;
  amount_kes: number; phone_number: string; shipping_address: string; created_at: string;
  payment_status: StoreOrder["paymentStatus"]; voucher_id: string | null; mpesa_receipt_number: string | null;
  mpesa_environment: string; mpesa_shortcode: string; mpesa_party_b: string; mpesa_transaction_type: string;
  merchant_request_id: string | null; checkout_request_id: string | null; callback_token_hash: string;
  callback_payload: PaymentCallback | null; initiation_state: string; payment_verified_at: string | null;
  payment_result_code: number | null; sms_state: string; sms_attempts: number;
}
export interface PaymentView {
  success: true; order: StoreOrder; voucher?: CareVoucher; message: string; smsStatus: string;
}
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

async function loadOrder(id: string): Promise<PaymentOrder> {
  const { data, error } = await createAdminSupabaseClient().from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new PaymentError("Payment records are unavailable. Please try again later.");
  if (!data) throw new PaymentError("Order not found.", 404);
  return data as PaymentOrder;
}

async function paymentView(payment: PaymentOrder): Promise<PaymentView> {
  let voucher: CareVoucher | undefined;
  if (payment.payment_status === "completed" && payment.payment_verified_at && payment.voucher_id) {
    const { data, error } = await createAdminSupabaseClient().from("vouchers").select("*").eq("id", payment.voucher_id).single();
    if (error || !data) throw new PaymentError("Payment is confirmed, but the Care Pass could not be loaded. Keep your order number and retry.");
    voucher = { id: data.id, code: data.code, therapySessions: data.therapy_sessions, perkDescription: data.perk_description,
      status: data.status, createdAt: data.created_at };
  }
  // Unverified historical demo orders must never be presented as new verified payments.
  const status = payment.payment_status === "completed" && !payment.payment_verified_at ? "pending" : payment.payment_status;
  const message = status === "completed" ? "Payment confirmed. Your Care Pass is ready."
    : status === "failed" ? (payment.payment_result_code === 1032 ? "Payment was cancelled on the phone." : "Payment was not completed. You can start a new attempt.")
    : payment.initiation_state === "unknown" ? "The request outcome is uncertain. Check this order before making another payment."
    : "Waiting for M-Pesa confirmation. If prompted, complete the payment on your phone.";
  return { success: true, message, smsStatus: payment.sms_state, voucher, order: {
    id: payment.id, orderNumber: payment.order_number, productId: payment.product_id, itemName: payment.item_name,
    amountKes: payment.amount_kes, phoneNumber: payment.phone_number, shippingAddress: payment.shipping_address,
    paymentMethod: "mpesa_stk", paymentStatus: status, mpesaReceiptNumber: payment.mpesa_receipt_number || undefined,
    voucherCode: voucher?.code, createdAt: payment.created_at,
  } };
}

async function notifyBuyer(payment: PaymentOrder) {
  if (payment.payment_status !== "completed" || !payment.payment_verified_at || !payment.voucher_id || payment.sms_state === "sent") return;
  const admin = createAdminSupabaseClient();
  const { data: lease, error } = await admin.rpc("claim_mpesa_sms", { p_order_id: payment.id });
  if (error || !lease) return;
  try {
    const { data: voucher, error: readError } = await admin.from("vouchers").select("code").eq("id", payment.voucher_id).single();
    if (readError || !voucher) throw new Error("Voucher unavailable");
    const result = await sendVoucherSMS({ customerPhone: payment.phone_number, voucherCode: voucher.code, productTitle: payment.item_name });
    await admin.from("orders").update({ sms_state: result?.status === "success" ? "sent" : "pending",
      sms_lease_until: null, sms_lease_token: null,
      sms_next_attempt_at: new Date(Date.now() + Math.min(3600000, 60000 * 2 ** payment.sms_attempts)).toISOString(),
    }).eq("id", payment.id).eq("sms_lease_token", lease).throwOnError();
  } catch {
    // Durable lease expires; the same voucher is retried, never re-issued.
    console.warn("[M-Pesa] Voucher notification will require retry", { orderId: payment.id });
  }
}

export async function reconcilePayment(id: string): Promise<PaymentOrder> {
  let payment = await loadOrder(id);
  if (payment.payment_status === "pending" && payment.checkout_request_id) {
    const config = getMpesaConfig();
    if (payment.mpesa_environment !== config.environment || payment.mpesa_shortcode !== config.shortcode || payment.mpesa_party_b !== config.partyB) {
      throw new PaymentError("This order belongs to a different M-Pesa configuration. It needs reconciliation with its original account.");
    }
    const admin = createAdminSupabaseClient();
    const { data: claimed, error } = await admin.rpc("claim_mpesa_check", { p_order_id: id });
    if (error) throw new PaymentError("Payment verification is temporarily unavailable.");
    if (claimed) {
      try {
        const result = await queryStk(payment.checkout_request_id, config);
        if (payment.callback_payload?.resultCode === 0 && result.resultCode !== null && result.resultCode !== 0) {
          // Conflicting provider signals require reconciliation, not a second charge.
          console.warn("[M-Pesa] Conflicting confirmation requires review", { orderId: id });
          return payment;
        }
        if (result.resultCode !== null && result.checkoutRequestId === payment.checkout_request_id && result.merchantRequestId === payment.merchant_request_id) {
          const { error: finishError } = await admin.rpc("finish_mpesa_payment", {
            p_order_id: id, p_checkout_id: payment.checkout_request_id, p_merchant_id: payment.merchant_request_id,
            p_result_code: result.resultCode, p_voucher_code: `CARE-${randomBytes(16).toString("hex").toUpperCase()}-TFL`,
          });
          if (finishError) throw new Error("Fulfillment unavailable");
        }
      } catch {
        // Persisted order/callback remains available for a subsequent leased retry.
        console.warn("[M-Pesa] Confirmation pending retry", { orderId: id });
      }
      payment = await loadOrder(id);
    }
  }
  await notifyBuyer(payment);
  return loadOrder(id);
}

export async function readOwnedPayment(id: string, buyerId: string): Promise<PaymentView> {
  const payment = await loadOrder(id);
  if (payment.buyer_id !== buyerId) throw new PaymentError("Order not found.", 404);
  return paymentView(await reconcilePayment(id));
}

export async function startPayment(input: unknown, buyerId: string): Promise<PaymentView> {
  const parsed = checkoutInput.parse(input);
  const phone = normalizePhone(parsed.phoneNumber);
  const config = getMpesaConfig();
  const rate = await checkRateLimit(buyerId, "payment_checkout");
  if (!rate.allowed) throw new PaymentError(rate.message || "Too many payment attempts. Please wait.", rate.retryAfterSeconds ? 429 : 503);
  const token = randomBytes(32).toString("hex");
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("prepare_mpesa_order", {
    p_buyer_id: buyerId, p_idempotency_key: parsed.idempotencyKey, p_product_id: parsed.productId,
    p_phone: phone, p_shipping: parsed.shippingAddress || "", p_environment: config.environment,
    p_shortcode: config.shortcode, p_party_b: config.partyB, p_transaction_type: config.transactionType, p_token_hash: hash(token),
  });
  if (error || !data) throw new PaymentError(error?.code === "P0001"
    ? "Product, shipping details or checkout attempt is invalid. Check your details and retry."
    : "Payment database setup is unavailable. No payment request was sent.", error?.code === "P0001" ? 409 : 503);
  const order = data.order as PaymentOrder;
  if (!data.isNew) return paymentView(order);
  await admin.from("orders").update({ initiation_state: "sending" }).eq("id", order.id).throwOnError();
  const callback = new URL("/api/mpesa/callback", config.callbackOrigin);
  callback.searchParams.set("orderId", order.id);
  callback.searchParams.set("token", token);
  try {
    const accepted = await initiateStk({ amount: order.amount_kes, phone, reference: order.order_number.replace(/-/g, "").slice(0, 12), callbackUrl: callback.toString() }, config);
    const { error: saveError } = await admin.rpc("record_mpesa_acceptance", {
      p_order_id: order.id, p_checkout_id: accepted.checkoutRequestId, p_merchant_id: accepted.merchantRequestId,
    });
    if (saveError) throw new PaymentError("Payment request sent; confirmation is still pending.");
  } catch (error) {
    const definitive = error instanceof PaymentError && error.definitive;
    // Do not override an early callback or an already verified outcome.
    await admin.from("orders").update({ initiation_state: definitive ? "rejected" : "unknown", payment_status: definitive ? "failed" : "pending" })
      .eq("id", order.id).eq("payment_status", "pending").is("checkout_request_id", null).throwOnError();
  }
  return paymentView(await loadOrder(order.id));
}

export async function receivePaymentCallback(orderId: string, token: string, body: unknown): Promise<void> {
  const payment = await loadOrder(orderId);
  const suppliedHash = hash(token);
  if (!payment.callback_token_hash || !/^[a-f0-9]{64}$/.test(payment.callback_token_hash) ||
    !timingSafeEqual(Buffer.from(suppliedHash, "hex"), Buffer.from(payment.callback_token_hash, "hex"))) {
    throw new PaymentError("Invalid callback authorization.", 401);
  }
  const event = parseCallback(body);
  const { error } = await createAdminSupabaseClient().rpc("record_mpesa_callback", {
    p_order_id: orderId, p_token_hash: suppliedHash, p_event: event,
  });
  if (error) throw new PaymentError("Callback could not be recorded.", error.code === "P0001" ? 400 : 503);
  // Callback is durable before this network call; query failure does not lose it.
  await reconcilePayment(orderId);
}
