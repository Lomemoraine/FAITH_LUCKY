import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AccessError } from "../auth/session";
import { PaymentError } from "./contracts";

export function paymentErrorResponse(error: unknown) {
  if (error instanceof AccessError || error instanceof PaymentError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  if (error instanceof ZodError || error instanceof SyntaxError) return NextResponse.json({ success: false, error: "Invalid payment request." }, { status: 400 });
  return NextResponse.json({ success: false, error: "Payment service is temporarily unavailable. Keep your order number and retry checking its status." }, { status: 503 });
}
