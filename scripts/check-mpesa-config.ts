import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

// This diagnostic requests an OAuth token only. It never sends an STK Push,
// initiates payment, writes a database record, or prints credentials/tokens.
const names = [
  "MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_SHORTCODE",
  "MPESA_PARTY_B", "MPESA_TRANSACTION_TYPE", "MPESA_PASSKEY", "MPESA_CALLBACK_BASE_URL",
] as const;

function configured(value: string | undefined): value is string {
  return Boolean(value?.trim() && !/placeholder|your[_ -]|replace[_ -]|example\.com/i.test(value));
}

async function main() {
  console.log("M-Pesa configuration check (credential values omitted)");
  let missing = false;
  for (const name of names) {
    const present = configured(process.env[name]);
    console.log(`${name}: ${present ? "configured" : "missing/placeholder"}`);
    missing ||= !present;
  }
  const environment = process.env.MPESA_ENVIRONMENT || "sandbox";
  if (environment !== "sandbox" && environment !== "production") {
    throw new Error("MPESA_ENVIRONMENT must be sandbox or production.");
  }
  console.log(`Environment: ${environment}`);
  if (missing) {
    console.log("Fill the missing settings before testing OAuth.");
    process.exitCode = 1;
    return;
  }
  if (!/^\d{5,7}$/.test(process.env.MPESA_SHORTCODE!) || !/^\d{5,7}$/.test(process.env.MPESA_PARTY_B!)) {
    throw new Error("Shortcode and Party B must be numeric merchant identifiers.");
  }
  if (!["CustomerPayBillOnline", "CustomerBuyGoodsOnline"].includes(process.env.MPESA_TRANSACTION_TYPE!)) {
    throw new Error("Unknown M-Pesa transaction type.");
  }
  const callback = new URL(process.env.MPESA_CALLBACK_BASE_URL!);
  if (callback.protocol !== "https:" || callback.username || callback.password || callback.search || callback.hash || callback.pathname !== "/") {
    throw new Error("MPESA_CALLBACK_BASE_URL must be an HTTPS origin without credentials, a path, or query parameters.");
  }
  const origin = environment === "sandbox" ? "https://sandbox.safaricom.co.ke" : "https://api.safaricom.co.ke";
  const credentials = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString("base64");
  const response = await fetch(`${origin}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${credentials}` }, signal: AbortSignal.timeout(20000), redirect: "error",
  });
  console.log(`Daraja OAuth: HTTP ${response.status}`);
  const data = await response.json() as { access_token?: unknown; expires_in?: unknown };
  if (!response.ok || typeof data.access_token !== "string" || data.access_token.length === 0) {
    console.log("FAIL: Daraja did not return an access token. Verify the key/secret belong to this environment's app.");
    process.exitCode = 1;
    return;
  }
  console.log("PASS: Daraja accepted the consumer key and secret. Token deliberately not displayed.");
  console.log("Passkey/shortcode acceptance still requires a separate STK sandbox test.");
  try {
    const probe = await fetch(new URL("/api/mpesa/callback", callback), {
      method: "GET", redirect: "manual", signal: AbortSignal.timeout(15000),
    });
    console.log(`Callback GET probe: HTTP ${probe.status}`);
    if (probe.status === 404) console.log("PENDING: callback handler is not deployed at this address yet.");
    else if (probe.status === 401 || probe.status === 403 || (probe.status >= 300 && probe.status < 400)) {
      console.log("CHECK: deployment authentication or redirects may block Safaricom callbacks.");
    } else console.log("Reachability checked only. This does not verify callback processing.");
  } catch {
    console.log("Callback probe unavailable: check DNS, TLS and network connectivity.");
  }
  console.log("No payment initiated. No money moved.");
}

main().catch(() => {
  console.error("M-Pesa check could not finish. Check configuration formatting, network/TLS access and Daraja availability. No secrets were printed.");
  process.exitCode = 1;
});
