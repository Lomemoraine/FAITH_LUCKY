import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { AccessError, requireActiveProfile } from "@/lib/auth/session";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const audioFormats: Record<string, string> = {
  "audio/webm": "webm", "audio/mp4": "m4a", "audio/x-m4a": "m4a",
  "audio/mpeg": "mp3", "audio/ogg": "ogg", "audio/wav": "wav",
};

export async function POST(req: Request) {
  try {
    const profile = await requireActiveProfile();
    const form = await req.formData();
    const file = form.get("audio");
    if (!(file instanceof File) || file.size === 0 || file.size > 5 * 1024 * 1024) {
      throw new AccessError("Choose a non-empty audio recording smaller than 5 MB.", 400);
    }
    // MediaRecorder adds codec parameters; the storage bucket expects the base MIME type.
    const mime = file.type.split(";")[0].trim().toLowerCase();
    if (!audioFormats[mime]) throw new AccessError("This audio format is not supported. Please record again.", 400);
    const durationValue = form.get("duration");
    const duration = durationValue === null ? null : Number(durationValue);
    if (duration !== null && (!Number.isInteger(duration) || duration < 1 || duration > 120)) {
      throw new AccessError("Voice stories must be between 1 and 120 seconds.", 400);
    }
    const path = `${profile.id}/${randomUUID()}.${audioFormats[mime]}`;
    const admin = createAdminSupabaseClient();
    const { error } = await admin.storage.from("voice_notes")
      .upload(path, Buffer.from(await file.arrayBuffer()), { contentType: mime, upsert: false });
    if (error) throw new AccessError("Your recording could not be saved to audio storage. Keep this window open and retry after storage is available.", 503);
    const { data } = admin.storage.from("voice_notes").getPublicUrl(path);
    return NextResponse.json({ success: true, audioUrl: data.publicUrl, duration });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof AccessError ? error.message : "Unable to upload the recording. Please retry." },
      { status: error instanceof AccessError ? error.status : 400 });
  }
}
