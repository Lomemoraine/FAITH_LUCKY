import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveProfile } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readOwnedPayment } from "@/lib/mpesa/payments";
import { PaymentError } from "@/lib/mpesa/contracts";
import { paymentErrorResponse } from "@/lib/mpesa/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(request: Request) {
  try {
    const profile = await requireActiveProfile();
    const attempt = z.uuid().parse(new URL(request.url).searchParams.get("attempt"));
    const { data, error } = await createAdminSupabaseClient().from("orders").select("id")
      .eq("buyer_id", profile.id).eq("idempotency_key", attempt).maybeSingle();
    if (error) throw new PaymentError("Unable to recover this checkout.");
    if (!data) throw new PaymentError("Checkout not found. Retry with the same details.", 404);
    return NextResponse.json(await readOwnedPayment(data.id, profile.id), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}
