import { NextResponse } from "next/server";
import { performModerationAction } from "@/lib/moderation/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { caseId, action, reason } = body;

    if (!caseId || !action || !reason) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const result = await performModerationAction({
      caseId,
      action,
      reason,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to perform moderation action" }, { status: 500 });
  }
}
