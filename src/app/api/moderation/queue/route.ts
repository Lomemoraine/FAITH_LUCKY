import { NextResponse } from "next/server";
import { fetchModerationQueue } from "@/lib/moderation/service";

export async function GET() {
  try {
    const result = await fetchModerationQueue();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ cases: [], error: "Failed to fetch moderation queue" }, { status: 500 });
  }
}
