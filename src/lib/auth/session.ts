import { createServerSupabaseClient } from "../supabase/server";

export class AccessError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export async function requireActiveProfile() {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new AccessError("Please start an anonymous session first.", 401);
  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("id,public_id,anonymous_handle,avatar_id,status").eq("id", data.user.id).maybeSingle();
  if (profileError) throw new AccessError("Unable to verify your profile. Please try again.", 503);
  if (!profile || profile.status !== "active") throw new AccessError("An active profile is required.", 403);
  return profile;
}
