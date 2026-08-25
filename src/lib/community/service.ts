import { createServerSupabaseClient } from "../supabase/server";
import { createAdminSupabaseClient } from "../supabase/admin";
import { evaluateSafetyPolicy } from "../safety/policy";
import { checkRateLimit } from "../ratelimit/limiter";
import { PublicPost, PublicReply, ReportReason } from "../types";

export interface CreatePostInput {
  roomId: string;
  content: string;
  audioUrl?: string | null;
  audioDuration?: number | null;
}

export interface CreatePostResult {
  success: boolean;
  post?: PublicPost;
  showSafetyResources?: boolean;
  safetySeverity?: string | null;
  error?: string;
}

export interface CreateReplyInput {
  postId: string;
  content: string;
  audioUrl?: string | null;
  audioDuration?: number | null;
}

export interface CreateReplyResult {
  success: boolean;
  reply?: PublicReply;
  showSafetyResources?: boolean;
  safetySeverity?: string | null;
  error?: string;
}

interface RawProfile {
  id: string;
  public_id: string;
  anonymous_handle: string;
  avatar_id: string;
  status: string;
}

interface RawRoom {
  id: string;
  name: string;
}

interface RawReply {
  id: string;
  post_id: string;
  content: string;
  audio_url: string | null;
  audio_duration: number | null;
  created_at: string;
  status: string;
  profiles: RawProfile | null;
}

interface RawPost {
  id: string;
  room_id: string;
  content: string;
  audio_url: string | null;
  audio_duration: number | null;
  created_at: string;
  status: string;
  rooms: RawRoom | null;
  profiles: RawProfile | null;
  reactions: Array<{ profile_id: string }> | null;
  replies: RawReply[] | null;
}

export async function fetchCommunityFeed(options: {
  roomId?: string;
  cursor?: string;
  limit?: number;
}): Promise<{ posts: PublicPost[]; nextCursor?: string }> {
  const supabase = createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  const currentUserId = userData?.user?.id;

  const limit = options.limit || 20;
  let query = supabase
    .from("posts")
    .select(`
      id,
      room_id,
      content,
      audio_url,
      audio_duration,
      created_at,
      status,
      rooms!room_id (
        id,
        name
      ),
      profiles!author_id (
        id,
        public_id,
        anonymous_handle,
        avatar_id,
        status
      ),
      reactions (
        profile_id
      ),
      replies (
        id,
        post_id,
        content,
        audio_url,
        audio_duration,
        created_at,
        status,
        profiles!author_id (
          id,
          public_id,
          anonymous_handle,
          avatar_id
        )
      )
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (options.roomId && options.roomId !== "all") {
    query = query.eq("room_id", options.roomId);
  }

  if (options.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Community] Error fetching posts:", error.message);
    return { posts: [] };
  }

  const rawRows = (data || []) as unknown as RawPost[];
  const hasMore = rawRows.length > limit;
  const items = hasMore ? rawRows.slice(0, limit) : rawRows;
  const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].created_at : undefined;

  const posts: PublicPost[] = items.map((row) => {
    const isAuthor = currentUserId ? row.profiles?.id === currentUserId : false;
    const userLiked = currentUserId
      ? (row.reactions || []).some((r) => r.profile_id === currentUserId)
      : false;

    const replies: PublicReply[] = (row.replies || [])
      .filter((rep) => rep.status === "published")
      .map((rep) => ({
        id: rep.id,
        postId: row.id,
        authorHandle: rep.profiles?.anonymous_handle || "Supportive Peer",
        authorAvatar: rep.profiles?.avatar_id || "lotus",
        authorPublicId: rep.profiles?.public_id || "",
        content: rep.content,
        audioUrl: rep.audio_url,
        audioDuration: rep.audio_duration,
        createdAt: rep.created_at,
        isAuthor: currentUserId ? rep.profiles?.id === currentUserId : false,
      }));

    return {
      id: row.id,
      roomId: row.room_id,
      roomName: row.rooms?.name || "Support Room",
      authorHandle: row.profiles?.anonymous_handle || "SafeSpace Member",
      authorAvatar: row.profiles?.avatar_id || "lotus",
      authorPublicId: row.profiles?.public_id || "",
      content: row.content,
      audioUrl: row.audio_url,
      audioDuration: row.audio_duration,
      empathyCount: (row.reactions || []).length,
      hasLiked: userLiked,
      replies,
      createdAt: row.created_at,
      isAuthor,
    };
  });

  return { posts, nextCursor };
}

export async function createPostAction(input: CreatePostInput): Promise<CreatePostResult> {
  const content = input.content?.trim();
  if (!content || content.length < 2 || content.length > 2000) {
    return { success: false, error: "Post must be between 2 and 2000 characters." };
  }

  const supabase = createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, error: "Anonymous session required to post." };
  }
  const userId = userData.user.id;

  // Rate limit check
  const rateLimit = await checkRateLimit(userId, "create_post");
  if (!rateLimit.allowed) {
    return { success: false, error: rateLimit.message };
  }

  // Safety screening
  const safetyCheck = evaluateSafetyPolicy(content);

  // Insert post
  const { data: postData, error: postError } = await supabase
    .from("posts")
    .insert({
      author_id: userId,
      room_id: input.roomId || "anxiety",
      content,
      audio_url: input.audioUrl || null,
      audio_duration: input.audioDuration || null,
      status: "published",
    })
    .select("id, room_id, content, audio_url, audio_duration, created_at, rooms!room_id(name), profiles!author_id(public_id, anonymous_handle, avatar_id)")
    .single();

  if (postError) {
    console.error("[Community] Create post error:", postError.message);
    return { success: false, error: "Unable to publish your post. Please try again." };
  }

  // If safety screening triggered, create a moderation case
  if (safetyCheck.triggered && safetyCheck.severity) {
    const adminClient = createAdminSupabaseClient();
    await adminClient.from("moderation_cases").insert({
      source: "safety_policy",
      severity: safetyCheck.severity,
      target_kind: "post",
      post_id: postData.id,
      status: "open",
    });
  }

  interface CreatedPostRow {
    id: string;
    room_id: string;
    content: string;
    audio_url: string | null;
    audio_duration: number | null;
    created_at: string;
    rooms: { name: string } | null;
    profiles: { public_id: string; anonymous_handle: string; avatar_id: string } | null;
  }

  const inserted = postData as unknown as CreatedPostRow;

  const post: PublicPost = {
    id: inserted.id,
    roomId: inserted.room_id,
    roomName: inserted.rooms?.name || "Support Room",
    authorHandle: inserted.profiles?.anonymous_handle || "SafeSpace Member",
    authorAvatar: inserted.profiles?.avatar_id || "lotus",
    authorPublicId: inserted.profiles?.public_id || "",
    content: inserted.content,
    audioUrl: inserted.audio_url,
    audioDuration: inserted.audio_duration,
    empathyCount: 0,
    hasLiked: false,
    replies: [],
    createdAt: inserted.created_at,
    isAuthor: true,
  };

  return {
    success: true,
    post,
    showSafetyResources: safetyCheck.triggered,
    safetySeverity: safetyCheck.severity,
  };
}

export async function createReplyAction(input: CreateReplyInput): Promise<CreateReplyResult> {
  const content = input.content?.trim();
  if (!content || content.length < 2 || content.length > 1000) {
    return { success: false, error: "Reply must be between 2 and 1000 characters." };
  }

  const supabase = createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, error: "Anonymous session required to reply." };
  }
  const userId = userData.user.id;

  // Rate limit check
  const rateLimit = await checkRateLimit(userId, "create_reply");
  if (!rateLimit.allowed) {
    return { success: false, error: rateLimit.message };
  }

  // Safety check
  const safetyCheck = evaluateSafetyPolicy(content);

  // Insert reply
  const { data: replyData, error: replyError } = await supabase
    .from("replies")
    .insert({
      post_id: input.postId,
      author_id: userId,
      content,
      audio_url: input.audioUrl || null,
      audio_duration: input.audioDuration || null,
      status: "published",
    })
    .select("id, post_id, content, audio_url, audio_duration, created_at, profiles!author_id(public_id, anonymous_handle, avatar_id)")
    .single();

  if (replyError) {
    console.error("[Community] Create reply error:", replyError.message);
    return { success: false, error: "Unable to submit your reply." };
  }

  // If safety screening triggered, create a moderation case
  if (safetyCheck.triggered && safetyCheck.severity) {
    const adminClient = createAdminSupabaseClient();
    await adminClient.from("moderation_cases").insert({
      source: "safety_policy",
      severity: safetyCheck.severity,
      target_kind: "reply",
      reply_id: replyData.id,
      status: "open",
    });
  }

  interface CreatedReplyRow {
    id: string;
    post_id: string;
    content: string;
    audio_url: string | null;
    audio_duration: number | null;
    created_at: string;
    profiles: { public_id: string; anonymous_handle: string; avatar_id: string } | null;
  }

  const inserted = replyData as unknown as CreatedReplyRow;

  const reply: PublicReply = {
    id: inserted.id,
    postId: inserted.post_id,
    authorHandle: inserted.profiles?.anonymous_handle || "Supportive Peer",
    authorAvatar: inserted.profiles?.avatar_id || "lotus",
    authorPublicId: inserted.profiles?.public_id || "",
    content: inserted.content,
    audioUrl: inserted.audio_url,
    audioDuration: inserted.audio_duration,
    createdAt: inserted.created_at,
    isAuthor: true,
  };

  return {
    success: true,
    reply,
    showSafetyResources: safetyCheck.triggered,
    safetySeverity: safetyCheck.severity,
  };
}

export async function toggleEmpathyReaction(postId: string): Promise<{ success: boolean; liked: boolean }> {
  const supabase = createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return { success: false, liked: false };
  const userId = userData.user.id;

  // Rate limit
  const rateLimit = await checkRateLimit(userId, "toggle_reaction");
  if (!rateLimit.allowed) {
    return { success: false, liked: false };
  }

  // Check if exists
  const { data: existing } = await supabase
    .from("reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase.from("reactions").delete().eq("post_id", postId).eq("profile_id", userId);
    return { success: true, liked: false };
  } else {
    await supabase.from("reactions").insert({ post_id: postId, profile_id: userId });
    return { success: true, liked: true };
  }
}

export async function deletePostAction(postId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function deleteReplyAction(replyId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("replies").delete().eq("id", replyId);
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function reportContentAction(input: {
  targetKind: "post" | "reply";
  targetId: string;
  reason: ReportReason;
  context?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, error: "Please create a session before reporting." };
  }
  const userId = userData.user.id;

  const rateLimit = await checkRateLimit(userId, "create_report");
  if (!rateLimit.allowed) {
    return { success: false, error: rateLimit.message };
  }

  const payload: {
    reporter_id: string;
    reason: ReportReason;
    context: string | null;
    post_id?: string;
    reply_id?: string;
  } = {
    reporter_id: userId,
    reason: input.reason,
    context: input.context?.trim() || null,
  };

  if (input.targetKind === "post") {
    payload.post_id = input.targetId;
  } else {
    payload.reply_id = input.targetId;
  }

  const { error } = await supabase.from("reports").insert(payload);
  if (error) {
    // Unique violation returns neutral success
    if (error.code === "23505") {
      return { success: true };
    }
    return { success: false, error: "Unable to submit report." };
  }

  // Create or elevate moderation case
  const adminClient = createAdminSupabaseClient();
  const severity = input.reason === "crisis_concern" ? "critical" : "standard";

  await adminClient.from("moderation_cases").insert({
    source: "user_report",
    severity,
    target_kind: input.targetKind,
    post_id: input.targetKind === "post" ? input.targetId : null,
    reply_id: input.targetKind === "reply" ? input.targetId : null,
    status: "open",
  });

  return { success: true };
}

export async function deleteIdentityAction(): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerSupabaseClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    return { success: false, error: "No active session to delete." };
  }
  const userId = userData.user.id;

  const adminClient = createAdminSupabaseClient();

  // Set profile to deleting
  await adminClient.from("profiles").update({ status: "deleting" }).eq("id", userId);

  // Delete all user posts, replies, reactions, reports
  await adminClient.from("posts").delete().eq("author_id", userId);
  await adminClient.from("replies").delete().eq("author_id", userId);
  await adminClient.from("reactions").delete().eq("profile_id", userId);
  await adminClient.from("reports").delete().eq("reporter_id", userId);
  await adminClient.from("profiles").delete().eq("id", userId);

  // Delete Supabase Auth User
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId);
  if (authError) {
    console.error("[Identity] Auth delete error:", authError.message);
  }

  return { success: true };
}
