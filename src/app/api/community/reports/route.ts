import { NextResponse } from "next/server";
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
  } catch {
    return NextResponse.json({ success: false, error: "Failed to report content" }, { status: 500 });
  }
}
