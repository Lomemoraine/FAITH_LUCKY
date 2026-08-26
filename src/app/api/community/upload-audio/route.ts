import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) {
      return NextResponse.json({ success: false, error: "Anonymous session required to upload audio." }, { status: 401 });
    }

    const userId = userData.user.id;
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;
    const duration = parseInt(String(formData.get("duration") || "0"), 10);

    if (!file) {
      return NextResponse.json({ success: false, error: "No audio file provided." }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Audio recording cannot exceed 5MB." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.type.includes("mp4") || file.type.includes("m4a") ? "m4a" : "webm";
    const fileName = `${userId}/${Date.now()}.${ext}`;

    const admin = createAdminSupabaseClient();
    const { error: uploadError } = await admin.storage
      .from("voice_notes")
      .upload(fileName, buffer, {
        contentType: file.type || "audio/webm",
        upsert: true,
      });

    if (uploadError) {
      console.error("[Upload] Audio upload error:", uploadError.message);
      return NextResponse.json({ success: false, error: "Failed to upload audio recording." }, { status: 500 });
    }

    const { data: publicUrlData } = admin.storage.from("voice_notes").getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      audioUrl: publicUrlData.publicUrl,
      duration: duration > 0 ? duration : null,
    });
  } catch (err) {
    console.error("[Upload] Audio route exception:", err);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
