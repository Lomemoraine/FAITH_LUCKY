import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateAnonymousHandle, getRandomAvatarId } from "@/lib/identity/pseudonym";

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isRealSupabase =
      Boolean(supabaseUrl) &&
      !supabaseUrl.includes("placeholder") &&
      !supabaseUrl.includes("your-project.supabase.co");

    // 1. If real Supabase is configured, try Supabase anonymous auth
    if (isRealSupabase) {
      try {
        const supabase = createServerSupabaseClient();
        const { data: userData } = await supabase.auth.getUser();

        if (userData?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("public_id, anonymous_handle, avatar_id, status")
            .eq("id", userData.user.id)
            .maybeSingle();

          if (profile) {
            return NextResponse.json({
              success: true,
              profile: {
                public_id: profile.public_id,
                anonymous_handle: profile.anonymous_handle,
                avatar_id: profile.avatar_id,
              },
            });
          }
        }

        const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
        if (!authError && authData.user) {
          const userId = authData.user.id;
          const handle = generateAnonymousHandle();
          const avatarId = getRandomAvatarId();

          const admin = createAdminSupabaseClient();
          const { data: profileData } = await admin
            .from("profiles")
            .insert({
              id: userId,
              anonymous_handle: handle,
              avatar_id: avatarId,
              status: "active",
            })
            .select("public_id, anonymous_handle, avatar_id")
            .single();

          if (profileData) {
            const response = NextResponse.json({
              success: true,
              profile: profileData,
            });

            response.cookies.set(
              "tfl_anon_profile",
              JSON.stringify({
                id: userId,
                public_id: profileData.public_id,
                anonymous_handle: profileData.anonymous_handle,
                avatar_id: profileData.avatar_id,
              }),
              { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 }
            );

            return response;
          }
        }
      } catch (sbErr) {
        console.warn("[Auth] Supabase anonymous auth warning, using resilient cookie profile:", sbErr);
      }
    }

    // 2. Resilient Fallback: Create anonymous device-bound profile session
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const existingCookie = cookieStore.get("tfl_anon_profile")?.value;

    if (existingCookie) {
      try {
        const parsed = JSON.parse(existingCookie);
        if (parsed.anonymous_handle && parsed.public_id) {
          return NextResponse.json({
            success: true,
            profile: {
              public_id: parsed.public_id,
              anonymous_handle: parsed.anonymous_handle,
              avatar_id: parsed.avatar_id || "lotus",
            },
          });
        }
      } catch {
        // Continue to fresh profile
      }
    }

    const uniqueId = `anon_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
    const publicId = `usr_${Math.random().toString(36).substring(2, 10)}`;
    const handle = generateAnonymousHandle();
    const avatarId = getRandomAvatarId();

    const newProfile = {
      id: uniqueId,
      public_id: publicId,
      anonymous_handle: handle,
      avatar_id: avatarId,
    };

    const response = NextResponse.json({
      success: true,
      profile: {
        public_id: newProfile.public_id,
        anonymous_handle: newProfile.anonymous_handle,
        avatar_id: newProfile.avatar_id,
      },
    });

    response.cookies.set("tfl_anon_profile", JSON.stringify(newProfile), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (err) {
    console.error("[Auth] Anonymous route exception:", err);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const existingCookie = cookieStore.get("tfl_anon_profile")?.value;

    if (existingCookie) {
      try {
        const parsed = JSON.parse(existingCookie);
        if (parsed.anonymous_handle && parsed.public_id) {
          return NextResponse.json({
            authenticated: true,
            profile: {
              public_id: parsed.public_id,
              anonymous_handle: parsed.anonymous_handle,
              avatar_id: parsed.avatar_id || "lotus",
            },
          });
        }
      } catch {
        // Fall through
      }
    }

    const supabase = createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      return NextResponse.json({ authenticated: false });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("public_id, anonymous_handle, avatar_id, status")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!profile || profile.status === "suspended") {
      return NextResponse.json({ authenticated: true, isSuspended: profile?.status === "suspended" });
    }

    return NextResponse.json({
      authenticated: true,
      profile: {
        public_id: profile.public_id,
        anonymous_handle: profile.anonymous_handle,
        avatar_id: profile.avatar_id,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const rawHandle = (body.anonymous_handle || "").trim().replace(/^@+/, "");
    const avatarId = body.avatar_id ? String(body.avatar_id).trim() : undefined;

    if (!rawHandle || rawHandle.length < 3 || rawHandle.length > 30) {
      return NextResponse.json(
        { success: false, error: "Handle must be between 3 and 30 characters." },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(rawHandle)) {
      return NextResponse.json(
        { success: false, error: "Handle can only contain letters, numbers, underscores, and dashes." },
        { status: 400 }
      );
    }

    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const existingCookie = cookieStore.get("tfl_anon_profile")?.value;

    let currentProfile = {
      id: `anon_${Date.now().toString(36)}`,
      public_id: `usr_${Date.now().toString(36)}`,
      anonymous_handle: rawHandle,
      avatar_id: avatarId || "lotus",
    };

    if (existingCookie) {
      try {
        const parsed = JSON.parse(existingCookie);
        currentProfile = {
          ...parsed,
          anonymous_handle: rawHandle,
          avatar_id: avatarId || parsed.avatar_id || "lotus",
        };
      } catch {
        // Use fresh profile
      }
    }

    const response = NextResponse.json({
      success: true,
      profile: {
        public_id: currentProfile.public_id,
        anonymous_handle: currentProfile.anonymous_handle,
        avatar_id: currentProfile.avatar_id,
      },
    });

    response.cookies.set("tfl_anon_profile", JSON.stringify(currentProfile), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (err) {
    console.error("[Auth] Handle update exception:", err);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
