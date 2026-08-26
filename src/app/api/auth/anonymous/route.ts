import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateAnonymousHandle, getRandomAvatarId } from "@/lib/identity/pseudonym";

export async function POST() {
  try {
    const supabase = createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();

    // If user already exists and has a profile, return existing profile
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

    // Create anonymous auth user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
    if (authError || !authData.user) {
      console.error("[Auth] Anonymous sign-in failed:", authError?.message);
      return NextResponse.json({ success: false, error: "Failed to create anonymous session." }, { status: 500 });
    }

    const userId = authData.user.id;
    const handle = generateAnonymousHandle();
    const avatarId = getRandomAvatarId();

    const admin = createAdminSupabaseClient();
    const { data: profileData, error: profileError } = await admin
      .from("profiles")
      .insert({
        id: userId,
        anonymous_handle: handle,
        avatar_id: avatarId,
        status: "active",
      })
      .select("public_id, anonymous_handle, avatar_id")
      .single();

    if (profileError) {
      console.error("[Auth] Profile insert error:", profileError.message);
      return NextResponse.json({ success: false, error: "Failed to initialize anonymous profile." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: profileData,
    });
  } catch (err) {
    console.error("[Auth] Anonymous route exception:", err);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function GET() {
  try {
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
    const supabase = createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = userData.user.id;
    const body = await req.json();
    const rawHandle = (body.anonymous_handle || "").trim().replace(/^@+/, "");
    const avatarId = body.avatar_id ? String(body.avatar_id).trim() : undefined;

    // Validate handle format
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

    // Check if handle is already taken by another user
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .ilike("anonymous_handle", rawHandle)
      .neq("id", userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: `The handle @${rawHandle} is already in use. Please choose another unique name.` },
        { status: 409 }
      );
    }

    const updatePayload: { anonymous_handle: string; avatar_id?: string; updated_at: string } = {
      anonymous_handle: rawHandle,
      updated_at: new Date().toISOString(),
    };

    if (avatarId) {
      updatePayload.avatar_id = avatarId;
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .select("public_id, anonymous_handle, avatar_id")
      .single();

    if (updateError) {
      console.error("[Auth] Handle update error:", updateError.message);
      return NextResponse.json({ success: false, error: "Failed to update profile." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (err) {
    console.error("[Auth] Handle update exception:", err);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
