import { NextResponse } from "next/server";
import { sendCounselingMessage } from "@/lib/counseling/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, senderRole, content } = body;

    if (!sessionId || !content || !content.trim()) {
      return NextResponse.json({ success: false, error: "Session ID and message content are required." }, { status: 400 });
    }

    const message = await sendCounselingMessage({
      sessionId,
      senderRole: senderRole || "client",
      content: content.trim(),
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (err) {
    console.error("[Counseling Messages API] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to send message." }, { status: 500 });
  }
}
