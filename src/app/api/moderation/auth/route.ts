import { NextResponse } from "next/server";
import { z } from "zod";
import { isEmailAllowlisted, verifyCurrentModerator } from "@/lib/moderation/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  return NextResponse.json(await verifyCurrentModerator(), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const parsed = z.object({ email: z.string().email().optional(), password: z.string().min(1).max(256).optional() })
      .safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: "Enter a valid staff email and credentials." }, { status: 400 });
    const { password } = parsed.data;
    const email = (parsed.data.email || process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    if (!email || !isEmailAllowlisted(email)) {
      return NextResponse.json({ success: false, error: "Staff credentials are not authorized." }, { status: 401 });
    }
    const supabase = createServerSupabaseClient();
    if (password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error || !(await verifyCurrentModerator()).isModerator) {
        if (!error) await supabase.auth.signOut();
        return NextResponse.json({ success: false, error: "Invalid staff credentials." }, { status: 401 });
      }
      const response = NextResponse.json({ success: true, message: "Signed in." });
      response.cookies.delete("tfl_moderator_session");
      return response;
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const { error } = await supabase.auth.signInWithOtp({ email, options: {
      shouldCreateUser: false,
      emailRedirectTo: `${siteUrl}/auth/callback`,
    } });
    if (error) return NextResponse.json({ success: false, error: "Unable to send the sign-in link. Please try again." }, { status: 503 });
    return NextResponse.json({ success: true, message: "Check your staff email for a sign-in link." });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to authenticate." }, { status: 400 });
  }
}

export async function DELETE() {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();
  const response = NextResponse.json({ success: !error }, { status: error ? 503 : 200 });
  response.cookies.delete("tfl_moderator_session");
  return response;
}
