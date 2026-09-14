import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { verifyCurrentModerator } from "@/lib/moderation/service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && (await verifyCurrentModerator()).isModerator) {
      return NextResponse.redirect(new URL("/admin", url.origin));
    }
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/admin?auth_error=invalid_link", url.origin));
}
