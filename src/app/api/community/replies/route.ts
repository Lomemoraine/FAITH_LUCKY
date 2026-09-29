import { NextResponse } from "next/server";
import { AccessError } from "@/lib/auth/session";
import { createReplyAction, deleteReplyAction } from "@/lib/community/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createReplyAction({
      postId: body.postId,
      content: body.content,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AccessError) return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    console.error("[API/Replies] POST Error:", err);
    return NextResponse.json({ success: false, error: "Failed to create reply" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const replyId = searchParams.get("id");
    if (!replyId) {
      return NextResponse.json({ success: false, error: "Reply ID required" }, { status: 400 });
    }

    const result = await deleteReplyAction(replyId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof AccessError) return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    return NextResponse.json({ success: false, error: "Failed to delete reply" }, { status: 500 });
  }
}
