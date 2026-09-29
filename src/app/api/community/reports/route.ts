import { NextResponse } from "next/server";
import { AccessError } from "@/lib/auth/session";
import { reportContentAction } from "@/lib/community/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetKind, targetId, reason, context } = body;

    if (!targetKind || !targetId || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const result = await reportContentAction({
      targetKind,
      targetId,
      reason,
      context,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AccessError) return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    return NextResponse.json({ success: false, error: "Failed to report content" }, { status: 500 });
  }
}
