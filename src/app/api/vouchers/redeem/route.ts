import { NextResponse } from "next/server";
import { validateAndRedeemVoucher } from "@/lib/store/service";
import { AccessError, requireActiveProfile } from "@/lib/auth/session";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const profile = await requireActiveProfile();
    const body = z.object({ code: z.string().trim().min(1).max(80) }).safeParse(await req.json());

    if (!body.success) {
      return NextResponse.json({ success: false, error: "Voucher code is required." }, { status: 400 });
    }

    const result = await validateAndRedeemVoucher(body.data.code, profile.id);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      voucher: result.voucher,
    });
  } catch (err) {
    if (err instanceof AccessError) return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    console.error("[Voucher Redeem API] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to redeem voucher." }, { status: 500 });
  }
}
