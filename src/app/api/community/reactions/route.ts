import { NextResponse } from "next/server";
import { toggleEmpathyReaction } from "@/lib/community/service";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const postId = body.postId;
    if (!postId) {
      return NextResponse.json({ success: false, error: "Post ID required" }, { status: 400 });
    }

    const result = await toggleEmpathyReaction(postId);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ success: false, error: "Failed to toggle reaction" }, { status: 500 });
  }
}
