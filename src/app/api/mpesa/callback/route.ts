import { NextResponse } from "next/server";
import { z } from "zod";
import { receivePaymentCallback } from "@/lib/mpesa/payments";
import { paymentErrorResponse } from "@/lib/mpesa/http";

export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const orderId = z.uuid().parse(url.searchParams.get("orderId"));
    const token = z.string().regex(/^[a-f0-9]{64}$/).parse(url.searchParams.get("token"));
    const text = await request.text();
    if (text.length > 16384) return NextResponse.json({ error: "Callback too large." }, { status: 413 });
    await receivePaymentCallback(orderId, token, JSON.parse(text));
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (error) { return paymentErrorResponse(error); }
}
