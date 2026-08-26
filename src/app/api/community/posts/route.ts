import { NextResponse } from "next/server";
import { fetchCommunityFeed, createPostAction, deletePostAction } from "@/lib/community/service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId") || "all";
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const result = await fetchCommunityFeed({ roomId, cursor, limit });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[API/Posts] GET Error:", err);
    return NextResponse.json({ posts: [], error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await createPostAction({
      roomId: body.roomId,
      content: body.content,
      audioUrl: body.audioUrl,
      audioDuration: body.audioDuration,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[API/Posts] POST Error:", err);
    return NextResponse.json({ success: false, error: "Failed to create post" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("id");
    if (!postId) {
      return NextResponse.json({ success: false, error: "Post ID required" }, { status: 400 });
    }

    const result = await deletePostAction(postId);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to delete post" }, { status: 500 });
  }
}
