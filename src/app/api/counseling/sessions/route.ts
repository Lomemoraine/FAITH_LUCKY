import { NextResponse } from "next/server";
import { createOrGetCounselingSession } from "@/lib/counseling/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { counselorId, voucherId, primaryConcern, intakeMood } = body;

    if (!counselorId) {
      return NextResponse.json({ success: false, error: "Counselor ID is required." }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    const clientId = userData?.user?.id || `anon-${Date.now()}`;

    const session = await createOrGetCounselingSession({
      clientId,
      counselorId,
      voucherId,
      primaryConcern,
      intakeMood,
    });

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (err) {
    console.error("[Counseling Sessions API] Error:", err);
    return NextResponse.json({ success: false, error: "Failed to initialize counseling session." }, { status: 500 });
  }
}
