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
    const mimeType = file.type || "audio/webm";
    const ext = mimeType.includes("mp4") || mimeType.includes("m4a") ? "m4a" : "webm";
    const fileName = `${userId}/${Date.now()}.${ext}`;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const isRealSupabase =
      Boolean(supabaseUrl) &&
      !supabaseUrl.includes("placeholder") &&
      !supabaseUrl.includes("your-project.supabase.co");

    // 1. Try uploading to Supabase Storage if configured
    if (isRealSupabase) {
      try {
        const admin = createAdminSupabaseClient();
        const { error: uploadError } = await admin.storage
          .from("voice_notes")
          .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicUrlData } = admin.storage.from("voice_notes").getPublicUrl(fileName);
          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              audioUrl: publicUrlData.publicUrl,
              duration: duration > 0 ? duration : null,
            });
          }
        } else {
          console.warn("[Upload] Supabase bucket upload failed, using resilient fallback:", uploadError.message);
        }
      } catch (storageErr) {
        console.warn("[Upload] Supabase storage exception, using resilient fallback:", storageErr);
      }
    }

    // 2. Resilient Fallback: Encode as Data URL so voice notes are ALWAYS playable across all clients
    const base64Audio = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Audio}`;

    return NextResponse.json({
      success: true,
      audioUrl: dataUrl,
      duration: duration > 0 ? duration : null,
    });
  } catch (err) {
    console.error("[Upload] Audio route exception:", err);
    return NextResponse.json({ success: false, error: "Internal server error during audio upload." }, { status: 500 });
  }
}
