import assert from "node:assert/strict";
import { normalizePhone, parseCallback, paymentPassword, PaymentError } from "../src/lib/mpesa/contracts";
import { getMpesaConfig, initiateStk, queryStk } from "../src/lib/mpesa/daraja";

async function main() {
  assert.equal(normalizePhone("0712 345 678"), "254712345678");
  assert.equal(normalizePhone("+254112345678"), "254112345678");
  for (const phone of ["", "12345", "25479999999999", "phone", "++254712345678"]) {
    assert.throws(() => normalizePhone(phone));
  }
  assert.equal(Buffer.from(paymentPassword("174379", "test-pass", "20260912120000"), "base64").toString(), "174379test-pass20260912120000");
  const payload = { Body: { stkCallback: { MerchantRequestID: "merchant-1", CheckoutRequestID: "checkout-1", ResultCode: 0,
    CallbackMetadata: { Item: [{ Name: "Amount", Value: 500 }, { Name: "MpesaReceiptNumber", Value: "TEST123456" }, { Name: "PhoneNumber", Value: 254712345678 }] } } } };
  assert.equal(parseCallback(payload).amount, 500);
  assert.throws(() => parseCallback({ Body: { stkCallback: { ...payload.Body.stkCallback, ResultCode: null } } }));
  assert.throws(() => parseCallback({ Body: { stkCallback: { ...payload.Body.stkCallback, CallbackMetadata: { Item: [] } } } }));
  assert.throws(() => parseCallback({ Body: { stkCallback: { ...payload.Body.stkCallback, CallbackMetadata: { Item: [...payload.Body.stkCallback.CallbackMetadata.Item, { Name: "Amount", Value: 1 }] } } } }));
  const config = getMpesaConfig({ MPESA_ENVIRONMENT: "sandbox", MPESA_CONSUMER_KEY: "test-key", MPESA_CONSUMER_SECRET: "test-secret",
    MPESA_SHORTCODE: "174379", MPESA_PARTY_B: "174379", MPESA_TRANSACTION_TYPE: "CustomerPayBillOnline", MPESA_PASSKEY: "test-pass",
    MPESA_CALLBACK_BASE_URL: "https://example.test" });
  assert.equal(config.origin, "https://sandbox.safaricom.co.ke");
  assert.throws(() => getMpesaConfig({}), /configured/);
  let calls = 0;
  const fakeFetch: typeof fetch = async (url, options) => {
    calls++;
    if (String(url).includes("oauth")) return Response.json({ access_token: "test-access-token" });
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer test-access-token");
    const body = JSON.parse(String(options?.body));
    assert.equal(body.Amount, 500);
    assert.equal(body.PartyA, "254712345678");
    return Response.json({ ResponseCode: "0", MerchantRequestID: "merchant-1", CheckoutRequestID: "checkout-1" });
  };
  const response = await initiateStk({ amount: 500, phone: "254712345678", reference: "TFL123", callbackUrl: "https://example.test/api/mpesa/callback?token=test" }, config, fakeFetch);
  assert.equal(response.checkoutRequestId, "checkout-1");
  assert.equal(calls, 2);
  const pendingFetch: typeof fetch = async (url) => String(url).includes("oauth")
    ? Response.json({ access_token: "test-token" }) : Response.json({ ResponseCode: "0" });
  assert.equal((await queryStk("checkout-1", config, pendingFetch)).resultCode, null, "An accepted query without ResultCode is not paid");
  let timeoutCalls = 0;
  const timeoutFetch: typeof fetch = async (url) => {
    timeoutCalls++;
    if (String(url).includes("oauth")) return Response.json({ access_token: "test-token" });
    throw new Error("Simulated timeout");
  };
  await assert.rejects(() => initiateStk({ amount: 500, phone: "254712345678", reference: "TFL123", callbackUrl: "https://example.test/api/mpesa/callback" }, config, timeoutFetch),
    (error: unknown) => error instanceof PaymentError && !error.definitive);
  assert.equal(timeoutCalls, 2, "An uncertain STK request must not be retried automatically");
  const rejectionFetch: typeof fetch = async (url) => String(url).includes("oauth")
    ? Response.json({ access_token: "test-token" }) : Response.json({ ResponseCode: "1" });
  await assert.rejects(() => initiateStk({ amount: 500, phone: "254712345678", reference: "TFL123", callbackUrl: "https://example.test/api/mpesa/callback" }, config, rejectionFetch),
    (error: unknown) => error instanceof PaymentError && error.definitive);
  console.log("PASS: phone validation, password encoding, callback validation, provider request and pending-query handling");
  console.log("Mock provider tests only. No payment or network requests made.");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
