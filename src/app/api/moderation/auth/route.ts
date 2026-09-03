import { NextResponse } from "next/server";
import { isEmailAllowlisted, verifyAdminPassword, verifyCurrentModerator } from "@/lib/moderation/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const status = await verifyCurrentModerator();
  return NextResponse.json(status);
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Password / Passcode Direct Login
    if (password) {
      if (verifyAdminPassword(password)) {
        const response = NextResponse.json({
          success: true,
          devMode: true,
          email: "admin@talkfreelylifestyle.org",
          message: "Authenticated successfully with admin credentials.",
        });

        response.cookies.set("tfl_moderator_session", "admin@talkfreelylifestyle.org", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;
      } else {
        return NextResponse.json(
          { success: false, error: "Invalid admin password/passcode." },
          { status: 401 }
        );
      }
    }

    // 2. Email Login
    const cleanEmail = (email || "").trim().toLowerCase();

    if (!cleanEmail || !isEmailAllowlisted(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Email is not authorized for staff admin access." },
        { status: 403 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isPlaceholderSupabase =
      !supabaseUrl ||
      supabaseUrl.includes("placeholder") ||
      supabaseUrl.includes("your-project.supabase.co");

    // In local development or placeholder Supabase, log in directly via secure cookie
    if (isPlaceholderSupabase || process.env.NODE_ENV !== "production") {
      const response = NextResponse.json({
        success: true,
        devMode: true,
        email: cleanEmail,
        message: "Authenticated successfully (Staff Session Active).",
      });

      response.cookies.set("tfl_moderator_session", cleanEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    const supabase = createServerSupabaseClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const { error } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        emailRedirectTo: `${siteUrl}/admin`,
      },
    });

    if (error) {
      console.error("[Moderation Auth] Supabase OTP error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Magic link sent to your moderator email." });
  } catch (err) {
    console.error("[Moderation Auth] Request error:", err);
    return NextResponse.json({ success: false, error: "Failed to authenticate." }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: "Signed out." });
  response.cookies.delete("tfl_moderator_session");
  return response;
}
