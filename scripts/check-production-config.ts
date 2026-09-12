import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

// Read-only checks. Never print credentials, URLs, table rows, or session data.
loadEnvConfig(process.cwd(), true);
const names = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "MODERATOR_EMAILS", "RATE_LIMIT_HMAC_SECRET", "HTTPSMS_API_KEY", "HTTPSMS_FROM_NUMBER", "DUTY_COUNSELOR_PHONE"];
function configured(value?: string) {
  return Boolean(value && !/placeholder|your-project|your-supabase|your-random|your-httpsms/i.test(value));
}
async function main() {
  console.log("Configuration status (values omitted):");
  for (const name of names) console.log(`${name}: ${configured(process.env[name]) ? "configured" : "missing/placeholder"}`);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!configured(url) || !configured(key)) {
    console.log("Supabase checks skipped: configure a real project URL and public key.");
    process.exitCode = 1;
    return;
  }
  try {
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key! }, signal: AbortSignal.timeout(15000) });
    console.log(`Supabase Auth settings: HTTP ${response.status}`);
    const settings = await response.json();
    if (response.ok) {
      const anonymousEnabled = settings.external?.anonymous_users;
      console.log(`Anonymous sign-in enabled: ${typeof anonymousEnabled === "boolean" ? anonymousEnabled : "unknown (field not returned)"}`);
    }
    else console.log(`Auth error code: ${settings.code || settings.error_code || "not provided"}`);
  } catch {
    console.log("Supabase Auth settings: network/TLS/timeout failure");
  }
  if (configured(serviceKey)) {
    const admin = createClient(url!, serviceKey!, { auth: { persistSession: false, autoRefreshToken: false } });
    for (const table of ["profiles", "rooms", "posts", "replies", "staff_roles", "rate_limit_buckets", "products", "vouchers", "orders", "counselors", "counseling_sessions", "counseling_messages"]) {
      const { error, status } = await admin.from(table).select("*", { head: true, count: "exact" });
      console.log(`${table}: HTTP ${status}, ${error ? `error code ${error.code || "not returned"}` : "accessible"}`);
    }
    const { error: counselorSchemaError, status: counselorSchemaStatus } = await admin.from("counselors")
      .select("id,is_licensed,show_license_number,auth_user_id").limit(0);
    console.log(`Counseling migration columns: HTTP ${counselorSchemaStatus}, ${counselorSchemaError ? `error code ${counselorSchemaError.code || "not returned"}; check migration 20260912000001` : "present"}`);
    const { error: paymentSchemaError, status: paymentSchemaStatus } = await admin.from("orders")
      .select("id,buyer_id,idempotency_key,checkout_request_id,payment_verified_at,sms_state").limit(0);
    console.log(`Payment migration columns: HTTP ${paymentSchemaStatus}, ${paymentSchemaError ? `error code ${paymentSchemaError.code || "not returned"}; check migration 20260912000002` : "present"}`);
  }
}
main().catch(() => { console.error("Configuration check failed; no secrets have been printed."); process.exitCode = 1; });
