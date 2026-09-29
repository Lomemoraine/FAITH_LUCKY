import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { reconcilePayment } from "@/lib/mpesa/payments";

export const maxDuration = 60;
export const dynamic = "force-dynamic";
// Configure a scheduler to call this with Authorization: Bearer <CRON_SECRET>.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization") || "";
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!secret || secret.length < 32 || /replace|placeholder/i.test(secret) || !timingSafeEqual(digest(auth), digest(`Bearer ${secret}`))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await createAdminSupabaseClient().from("orders").select("id")
    .not("checkout_request_id", "is", null)
    .or("payment_status.eq.pending,and(payment_status.eq.completed,sms_state.eq.pending,sms_attempts.lt.5)")
    .or(`next_check_at.is.null,next_check_at.lte.${new Date().toISOString()}`)
    .or(`sms_next_attempt_at.is.null,sms_next_attempt_at.lte.${new Date().toISOString()}`)
    .or(`sms_lease_until.is.null,sms_lease_until.lte.${new Date().toISOString()}`)
    .order("next_check_at", { ascending: true, nullsFirst: true }).limit(2);
  if (error) return NextResponse.json({ error: "Reconciliation unavailable." }, { status: 503 });
  const results = await Promise.allSettled((data || []).map((row) => reconcilePayment(row.id)));
  return NextResponse.json({ checked: results.length, errors: results.filter((result) => result.status === "rejected").length });
}
