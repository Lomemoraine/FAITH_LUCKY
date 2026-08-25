import { NextResponse } from "next/server";
import { validateAndRedeemVoucher } from "@/lib/store/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ success: false, error: "Voucher code is required." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();

    const result = await validateAndRedeemVoucher(code, userData?.user?.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      voucher: result.voucher,
    });
  } catch (err) {
    console.error("[Voucher Redeem API] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to redeem voucher." }, { status: 500 });
  }
}
