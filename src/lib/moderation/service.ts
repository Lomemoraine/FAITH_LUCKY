import { createServerSupabaseClient } from "../supabase/server";
import { createAdminSupabaseClient } from "../supabase/admin";
import { ModerationActionType, ModerationCase, ModerationSeverity, ModerationStatus } from "../types";

export function isEmailAllowlisted(email: string): boolean {
  const allowlist = (process.env.MODERATOR_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowlist.includes(email.trim().toLowerCase());
}

export async function verifyCurrentModerator(): Promise<{ isModerator: boolean; userId?: string; email?: string }> {
  const supabase = createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { isModerator: false };
  }

  const userId = userData.user.id;
  const email = userData.user.email || "";

  // Verify staff role
  const { data: roleData } = await supabase
    .from("staff_roles")
    .select("role")
    .eq("auth_user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();

  if (roleData && (roleData.role === "moderator" || roleData.role === "admin")) {
    return { isModerator: true, userId, email };
  }

  // If email is allowlisted but role row hasn't been created yet, grant role via admin client
  if (email && isEmailAllowlisted(email)) {
    const admin = createAdminSupabaseClient();
    await admin.from("staff_roles").upsert({
      auth_user_id: userId,
      role: "moderator",
      revoked_at: null,
    });
    return { isModerator: true, userId, email };
  }

  return { isModerator: false };
}

interface RawCaseRow {
  id: string;
  source: "safety_policy" | "user_report";
  severity: ModerationSeverity;
  target_kind: "post" | "reply";
  post_id: string | null;
  reply_id: string | null;
  status: ModerationStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  posts: {
    id: string;
    content: string;
    audio_url: string | null;
    status: string;
    author_id: string;
    profiles: { anonymous_handle: string } | null;
  } | null;
  replies: {
    id: string;
    content: string;
    audio_url: string | null;
    status: string;
    author_id: string;
    profiles: { anonymous_handle: string } | null;
  } | null;
}

export async function fetchModerationQueue(): Promise<{ cases: ModerationCase[] }> {
  const { isModerator } = await verifyCurrentModerator();
  if (!isModerator) {
    return { cases: [] };
  }

  const admin = createAdminSupabaseClient();
  const { data: casesData, error } = await admin
    .from("moderation_cases")
    .select(`
      id,
      source,
      severity,
      target_kind,
      post_id,
      reply_id,
      status,
      assigned_to,
      created_at,
      updated_at,
      resolved_at,
      posts!post_id (
        id,
        content,
        audio_url,
        status,
        author_id,
        profiles!author_id (
          anonymous_handle
        )
      ),
      replies!reply_id (
        id,
        content,
        audio_url,
        status,
        author_id,
        profiles!author_id (
          anonymous_handle
        )
      )
    `)
    .in("status", ["open", "in_review"])
    .order("severity", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Moderation] Queue error:", error.message);
    return { cases: [] };
  }

  const rawCases = (casesData || []) as unknown as RawCaseRow[];

  const cases: ModerationCase[] = rawCases.map((row) => {
    let targetContent = "";
    let targetAuthorHandle = "";
    let targetAuthorId = "";
    let targetAudioUrl: string | null = null;

    if (row.target_kind === "post" && row.posts) {
      targetContent = row.posts.content;
      targetAuthorHandle = row.posts.profiles?.anonymous_handle || "Anonymous";
      targetAuthorId = row.posts.author_id;
      targetAudioUrl = row.posts.audio_url;
    } else if (row.target_kind === "reply" && row.replies) {
      targetContent = row.replies.content;
      targetAuthorHandle = row.replies.profiles?.anonymous_handle || "Anonymous";
      targetAuthorId = row.replies.author_id;
      targetAudioUrl = row.replies.audio_url;
    }

    return {
      id: row.id,
      source: row.source,
      severity: row.severity,
      targetKind: row.target_kind,
      postId: row.post_id,
      replyId: row.reply_id,
      status: row.status,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at,
      targetContent,
      targetAuthorHandle,
      targetAuthorId,
      targetAudioUrl,
    };
  });

  return { cases };
}

export async function performModerationAction(params: {
  caseId: string;
  action: ModerationActionType;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  const { isModerator, userId } = await verifyCurrentModerator();
  if (!isModerator || !userId) {
    return { success: false, error: "Unauthorized moderator action." };
  }

  const admin = createAdminSupabaseClient();

  // Get case details
  const { data: caseRow } = await admin
    .from("moderation_cases")
    .select("id, target_kind, post_id, reply_id")
    .eq("id", params.caseId)
    .single();

  if (!caseRow) {
    return { success: false, error: "Case not found." };
  }

  // 1. Log action in append-only table
  await admin.from("moderation_actions").insert({
    case_id: params.caseId,
    moderator_id: userId,
    action: params.action,
    reason: params.reason,
  });

  // 2. Perform target content or profile mutation
  if (params.action === "hide") {
    if (caseRow.target_kind === "post" && caseRow.post_id) {
      await admin.from("posts").update({ status: "hidden" }).eq("id", caseRow.post_id);
    } else if (caseRow.target_kind === "reply" && caseRow.reply_id) {
      await admin.from("replies").update({ status: "hidden" }).eq("id", caseRow.reply_id);
    }
  } else if (params.action === "restore") {
    if (caseRow.target_kind === "post" && caseRow.post_id) {
      await admin.from("posts").update({ status: "published" }).eq("id", caseRow.post_id);
    } else if (caseRow.target_kind === "reply" && caseRow.reply_id) {
      await admin.from("replies").update({ status: "published" }).eq("id", caseRow.reply_id);
    }
  } else if (params.action === "remove") {
    if (caseRow.target_kind === "post" && caseRow.post_id) {
      await admin.from("posts").delete().eq("id", caseRow.post_id);
    } else if (caseRow.target_kind === "reply" && caseRow.reply_id) {
      await admin.from("replies").delete().eq("id", caseRow.reply_id);
    }
  } else if (params.action === "suspend") {
    let authorId: string | null = null;
    if (caseRow.target_kind === "post" && caseRow.post_id) {
      const { data: p } = await admin.from("posts").select("author_id").eq("id", caseRow.post_id).single();
      authorId = p?.author_id;
    } else if (caseRow.target_kind === "reply" && caseRow.reply_id) {
      const { data: r } = await admin.from("replies").select("author_id").eq("id", caseRow.reply_id).single();
      authorId = r?.author_id;
    }
    if (authorId) {
      await admin.from("profiles").update({ status: "suspended" }).eq("id", authorId);
    }
  } else if (params.action === "unsuspend") {
    let authorId: string | null = null;
    if (caseRow.target_kind === "post" && caseRow.post_id) {
      const { data: p } = await admin.from("posts").select("author_id").eq("id", caseRow.post_id).single();
      authorId = p?.author_id;
    } else if (caseRow.target_kind === "reply" && caseRow.reply_id) {
      const { data: r } = await admin.from("replies").select("author_id").eq("id", caseRow.reply_id).single();
      authorId = r?.author_id;
    }
    if (authorId) {
      await admin.from("profiles").update({ status: "active" }).eq("id", authorId);
    }
  }

  // 3. Update case status
  const finalStatus = params.action === "dismiss" ? "dismissed" : "resolved";
  await admin.from("moderation_cases").update({
    status: finalStatus,
    resolved_at: new Date().toISOString(),
  }).eq("id", params.caseId);

  return { success: true };
}
