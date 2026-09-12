import { z } from "zod";

export class PaymentError extends Error {
  constructor(message: string, public status = 503, public definitive = false) { super(message); }
}

export function normalizePhone(value: string): string {
  let phone = value.trim().replace(/[\s-]/g, "");
  if (phone.startsWith("+")) phone = phone.slice(1);
  if (phone.startsWith("0")) phone = `254${phone.slice(1)}`;
  else if (/^[17]\d{8}$/.test(phone)) phone = `254${phone}`;
  if (!/^254[17]\d{8}$/.test(phone)) throw new PaymentError("Enter a valid Kenyan M-Pesa phone number.", 400, true);
  return phone;
}

export function paymentPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(shortcode + passkey + timestamp).toString("base64");
}

export const resultCodeSchema = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/).transform(Number)]).pipe(z.number().int().nonnegative());
const callbackSchema = z.object({ Body: z.object({ stkCallback: z.object({
  MerchantRequestID: z.string().min(1).max(150), CheckoutRequestID: z.string().min(1).max(150),
  ResultCode: resultCodeSchema,
  CallbackMetadata: z.object({ Item: z.array(z.object({ Name: z.string().max(80), Value: z.unknown().optional() })).max(20) }).optional(),
}) }) });

export function parseCallback(payload: unknown) {
  const data = callbackSchema.parse(payload).Body.stkCallback;
  const values = new Map<string, unknown>();
  for (const item of data.CallbackMetadata?.Item || []) {
    if (values.has(item.Name)) throw new PaymentError("Duplicate callback metadata.", 400);
    values.set(item.Name, item.Value);
  }
  let amount: number | null = null;
  let phone: string | null = null;
  let receipt: string | null = null;
  if (data.ResultCode === 0) {
    amount = z.union([z.number(), z.string().regex(/^\d+(\.\d+)?$/).transform(Number)]).pipe(z.number().int().positive()).parse(values.get("Amount"));
    receipt = z.string().regex(/^[A-Z0-9]{8,20}$/).parse(values.get("MpesaReceiptNumber"));
    phone = normalizePhone(z.union([z.string(), z.number().int()]).transform(String).parse(values.get("PhoneNumber")));
  }
  return { merchantRequestId: data.MerchantRequestID, checkoutRequestId: data.CheckoutRequestID,
    resultCode: data.ResultCode, amount, phone, receipt };
}
export type PaymentCallback = ReturnType<typeof parseCallback>;

export const checkoutInput = z.object({ productId: z.string().min(1).max(100),
  phoneNumber: z.string().max(30), shippingAddress: z.string().trim().max(500).optional(), idempotencyKey: z.uuid() });
