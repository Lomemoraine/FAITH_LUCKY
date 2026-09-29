import { NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveProfile } from "@/lib/auth/session";
import { readOwnedPayment } from "@/lib/mpesa/payments";
import { paymentErrorResponse } from "@/lib/mpesa/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const profile = await requireActiveProfile();
    const id = z.uuid().parse(params.id);
    return NextResponse.json(await readOwnedPayment(id, profile.id), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return paymentErrorResponse(error); }
}
