import { NextResponse } from "next/server";
import { isEmailAllowlisted, verifyCurrentModerator } from "@/lib/moderation/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const status = await verifyCurrentModerator();
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || !isEmailAllowlisted(email)) {
      return NextResponse.json({ success: false, error: "Email is not authorized for moderation access." }, { status: 403 });
    }

    const supabase = createServerSupabaseClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/moderation`,
      },
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Magic link sent to your moderator email." });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to send magic link." }, { status: 500 });
  }
}
