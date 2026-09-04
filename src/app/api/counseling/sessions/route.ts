import { NextResponse } from "next/server";
import { createOrGetCounselingSession } from "@/lib/counseling/service";
import { verifyVoucherAccess } from "@/lib/store/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { counselorId, voucherId, voucherCode, primaryConcern, intakeMood, clientPhone } = body;

    if (!counselorId) {
      return NextResponse.json({ success: false, error: "Counselor ID is required." }, { status: 400 });
    }

    // Server-side paywall: a valid Care Pass voucher is REQUIRED to talk to a
    // counselor. The browser gate is only UX — this is what actually enforces
    // it, so stale builds or direct API calls cannot bypass the purchase step.
    const hasAccess = await verifyVoucherAccess(voucherCode);
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

    const supabase = createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const clientId = userData?.user?.id || `anon-${Date.now()}`;

    const session = await createOrGetCounselingSession({
      clientId,
      counselorId,
      voucherId,
      primaryConcern,
      intakeMood,
      clientPhone,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (err) {
    console.error("[Counseling Sessions API] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to initialize counseling session." }, { status: 500 });
  }
}
