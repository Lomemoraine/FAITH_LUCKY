import { NextResponse } from "next/server";
import { createOrGetCounselingSession } from "@/lib/counseling/service";
import { verifyVoucherAccess } from "@/lib/store/service";
import { AccessError, requireActiveProfile } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const profile = await requireActiveProfile();
    const body = z.object({
      counselorId: z.string().min(1).max(100), voucherCode: z.string().trim().min(1).max(80),
      primaryConcern: z.string().max(1000).optional(), intakeMood: z.string().max(100).optional(),
      clientPhone: z.string().max(30).optional(),
    }).safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ success: false, error: "Counselor ID is required." }, { status: 400 });
    }
    const { counselorId, voucherCode, primaryConcern, intakeMood, clientPhone } = body.data;

    // Server-side paywall: a valid Care Pass voucher is REQUIRED to talk to a
    // counselor. The browser gate is only UX — this is what actually enforces
    // it, so stale builds or direct API calls cannot bypass the purchase step.
    const hasAccess = await verifyVoucherAccess(voucherCode, profile.id);
    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid Care Pass is required to start a counseling session. Please purchase a Care Gift or session pass in the store.",
        },
        { status: 402 }
      );
    }

    const clientId = profile.id;
    const { data: voucher, error } = await createAdminSupabaseClient().from("vouchers")
      .select("id").eq("code", voucherCode.trim().toUpperCase()).eq("redeemed_by", clientId).single();
    if (error || !voucher) throw new AccessError("Unable to verify Care Pass ownership.", 402);

    const session = await createOrGetCounselingSession({
      clientId,
      counselorId,
      voucherId: voucher.id,
      primaryConcern,
      intakeMood,
      clientPhone,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (err) {
    if (err instanceof AccessError) return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    console.error("[Counseling Sessions API] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to initialize counseling session." }, { status: 500 });
  }
}
