import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { generateAnonymousHandle, getRandomAvatarId, AVATAR_OPTIONS } from "@/lib/identity/pseudonym";
import { AccessError, requireActiveProfile } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/ratelimit/limiter";

const fields = "public_id,anonymous_handle,avatar_id,status";
function publicProfile(profile: { public_id: string; anonymous_handle: string; avatar_id: string }) {
  return { public_id: profile.public_id, anonymous_handle: profile.anonymous_handle, avatar_id: profile.avatar_id };
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.auth.getUser();
    let user = data.user;
    if (!user) {
      const limit = await checkRateLimit(request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown", "create_account");
      if (!limit.allowed) return NextResponse.json({ success: false, error: limit.message }, { status: 429 });
      const { data: signedIn, error } = await supabase.auth.signInAnonymously();
      if (error || !signedIn.user) throw new AccessError("Anonymous sign-in is unavailable. Please try again shortly.", 503);
      user = signedIn.user;
    }
    const admin = createAdminSupabaseClient();
    const { data: existing, error: readError } = await admin.from("profiles").select(fields).eq("id", user.id).maybeSingle();
    if (readError) throw readError;
    if (existing) {
      if (existing.status !== "active") throw new AccessError("This profile is not active.", 403);
      return NextResponse.json({ success: true, profile: publicProfile(existing) });
    }
    // Retry handle collisions without replacing an existing identity.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: profile, error } = await admin.from("profiles").insert({
        id: user.id, anonymous_handle: generateAnonymousHandle(), avatar_id: getRandomAvatarId(), status: "active",
      }).select(fields).single();
      if (!error && profile) return NextResponse.json({ success: true, profile: publicProfile(profile) });
      if (error?.code !== "23505") throw error;
      const { data: raced } = await admin.from("profiles").select(fields).eq("id", user.id).maybeSingle();
      if (raced?.status === "active") return NextResponse.json({ success: true, profile: publicProfile(raced) });
    }
    throw new AccessError("Unable to create a profile. Please retry.", 503);
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof AccessError ? error.message : "Unable to save your anonymous profile." },
      { status: error instanceof AccessError ? error.status : 503 });
  }
}

export async function GET() {
  try {
    const profile = await requireActiveProfile();
    return NextResponse.json({ authenticated: true, profile: publicProfile(profile) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof AccessError && error.status === 401) return NextResponse.json({ authenticated: false });
    return NextResponse.json({ authenticated: false, error: "Unable to load an active profile." },
      { status: error instanceof AccessError ? error.status : 503 });
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireActiveProfile();
    const parsed = z.object({
      anonymous_handle: z.string().trim().transform((value) => value.replace(/^@+/, "")).pipe(z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/)),
      avatar_id: z.string().refine((value) => AVATAR_OPTIONS.some((avatar) => avatar.id === value)).optional(),
    }).safeParse(await request.json());
    if (!parsed.success) throw new AccessError("Choose a valid avatar and a 3–30 character handle using letters, numbers, dashes or underscores.", 400);
    const { data, error } = await createAdminSupabaseClient().from("profiles")
      .update(parsed.data).eq("id", profile.id).eq("status", "active").select(fields).single();
    if (error?.code === "23505") throw new AccessError("That handle is already taken.", 409);
    if (error || !data) throw new AccessError("Your profile could not be saved. Please retry.", 503);
    const response = NextResponse.json({ success: true, profile: publicProfile(data) });
    response.cookies.delete("tfl_anon_profile");
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof AccessError ? error.message : "Unable to update profile." },
      { status: error instanceof AccessError ? error.status : 400 });
  }
}
