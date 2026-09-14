import { NextResponse } from "next/server";
import { getCounselingMessages, sendCounselingMessage } from "@/lib/counseling/service";
import { AccessError, requireActiveProfile } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { z } from "zod";

export async function GET(req: Request) {
  try {
    const profile = await requireActiveProfile();
    const sessionId = z.string().uuid().safeParse(new URL(req.url).searchParams.get("sessionId"));
    if (!sessionId.success) throw new AccessError("A valid session ID is required.", 400);
    const { data: session, error } = await createAdminSupabaseClient().from("counseling_sessions")
      .select("client_id,status").eq("id", sessionId.data).maybeSingle();
    if (error) throw new AccessError("Session could not be loaded.", 503);
    if (!session || session.client_id !== profile.id) throw new AccessError("Session not found.", 404);
    return NextResponse.json({ success: true, messages: await getCounselingMessages(sessionId.data), status: session.status },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof AccessError ? error.message : "Messages could not be loaded." },
      { status: error instanceof AccessError ? error.status : 503 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await requireActiveProfile();
    const body = z.object({ sessionId: z.string().uuid(), content: z.string().trim().min(1).max(5000) }).safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ success: false, error: "Session ID and message content are required." }, { status: 400 });
    }

    const { sessionId, content } = body.data;
    const admin = createAdminSupabaseClient();
    const { data: session, error } = await admin.from("counseling_sessions")
      .select("client_id,status").eq("id", sessionId).maybeSingle();
    if (error) throw new AccessError("Unable to load the session.", 503);
    if (!session || session.client_id !== profile.id) throw new AccessError("Session not found.", 404);
    if (session.status !== "active") throw new AccessError("This session has ended.", 409);

    const message = await sendCounselingMessage({
      sessionId,
      senderRole: "client",
      content: content.trim(),
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (err) {
    if (err instanceof AccessError) return NextResponse.json({ success: false, error: err.message }, { status: err.status });
    console.error("[Counseling Messages API] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to send message." }, { status: 500 });
  }
}
