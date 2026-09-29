import { loadEnvConfig } from "@next/env";
import { createClient } from "@supabase/supabase-js";

loadEnvConfig(process.cwd(), true);

// Read-only recovery inventory: no audio content, credentials or URLs are printed.
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase configuration is missing.");
  const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: posts, error } = await admin.from("posts")
    .select("id,author_id,created_at").eq("content", "Shared a voice story").is("audio_url", null);
  if (error) throw new Error(`Cannot inspect posts (code ${error.code}).`);
  console.log(`Voice-story posts without audio attachments: ${posts?.length || 0}`);
  for (const post of posts || []) {
    const files: Array<{ name: string; createdAt: string; minutesFromPost: number | null }> = [];
    let offset = 0;
    let storageError: string | undefined;
    while (true) {
      const { data, error } = await admin.storage.from("voice_notes").list(post.author_id, { limit: 100, offset });
      if (error) { storageError = "Unable to list the author's voice_notes folder."; break; }
      for (const file of data || []) {
        if (!file.id) continue;
        const delta = Math.abs(Date.parse(file.created_at || "") - Date.parse(post.created_at));
        files.push({ name: file.name, createdAt: file.created_at || "unknown", minutesFromPost: Number.isFinite(delta) ? Math.round(delta / 60000) : null });
      }
      if (!data || data.length < 100) break;
      offset += 100;
    }
    files.sort((a, b) => (a.minutesFromPost ?? Infinity) - (b.minutesFromPost ?? Infinity));
    console.log(JSON.stringify({ postId: post.id, postCreatedAt: post.created_at,
      storageError, storedFilesForAuthor: files.length, nearestFiles: files.slice(0, 5) }, null, 2));
  }
  console.log("No records changed. A nearby timestamp alone does not prove an audio file belongs to a post.");
}
main().catch((error) => {
  console.error(error instanceof Error && /^(Cannot inspect|Supabase configuration)/.test(error.message)
    ? error.message : "Audio inventory failed. Check database/storage access.");
  process.exitCode = 1;
});
