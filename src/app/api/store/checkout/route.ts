import { NextResponse } from "next/server";
import { requireActiveProfile } from "@/lib/auth/session";
import { startPayment } from "@/lib/mpesa/payments";
import { paymentErrorResponse } from "@/lib/mpesa/http";

export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const profile = await requireActiveProfile();
    const result = await startPayment(await request.json(), profile.id);
    return NextResponse.json(result, { status: result.order.paymentStatus === "pending" ? 202 : 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}
