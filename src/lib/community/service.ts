import { createServerSupabaseClient } from "../supabase/server";
import { createAdminSupabaseClient } from "../supabase/admin";
import { evaluateSafetyPolicyAsync } from "../safety/policy";
import { checkRateLimit } from "../ratelimit/limiter";
import { sendCrisisEscalationAlert } from "../httpsms";
import { generateAnonymousHandle, getRandomAvatarId } from "../identity/pseudonym";
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

// Default Authentic Community Seed Posts for Instant Exploration
export const DEFAULT_COMMUNITY_POSTS: PublicPost[] = [
  {
    id: "post-seed-1",
    roomId: "anxiety",
    roomName: "Anxiety & Panic",
    authorHandle: "QuietMorning29",
    authorAvatar: "lotus",
    authorPublicId: "usr_seed_1",
    content: "Woke up with my chest feeling so tight today, worrying about finding work after campus. Just putting this here to remind myself: take it one breath at a time. It's okay to feel overwhelmed, but we will make it through. 🌸",
    audioUrl: null,
    audioDuration: null,
    empathyCount: 14,
    hasLiked: false,
    replies: [
      {
        id: "rep-seed-1",
        postId: "post-seed-1",
        authorHandle: "PatientHeart94",
        authorAvatar: "sun",
        authorPublicId: "usr_seed_rep_1",
        content: "Sending you so much warmth! That post-campus transition in Nairobi is heavy on all of us. You are not alone at all. Slow breaths today!",
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        isAuthor: false,
      },
      {
        id: "rep-seed-2",
        postId: "post-seed-1",
        authorHandle: "CalmWave51",
        authorAvatar: "wave",
        authorPublicId: "usr_seed_rep_2",
        content: "Try drinking a glass of cold water and naming 5 things around you. That grounding exercise helped me a lot during panic moments.",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isAuthor: false,
      },
    ],
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isAuthor: false,
  },
  {
    id: "post-seed-2",
    roomId: "burnout",
    roomName: "Stress & Overwhelm",
    authorHandle: "BraveSparrow72",
    authorAvatar: "star",
    authorPublicId: "usr_seed_2",
    content: "Recorded a quick 45-second reflection about learning to set boundaries at work without feeling guilty. Sometimes saying 'no' is the highest form of self-care. 🌿",
    audioUrl: null,
    audioDuration: 45,
    empathyCount: 22,
    hasLiked: false,
    replies: [
      {
        id: "rep-seed-3",
        postId: "post-seed-2",
        authorHandle: "TenderSoul18",
        authorAvatar: "sprout",
        authorPublicId: "usr_seed_rep_3",
        content: "Needed to hear this today. Hustle culture makes us feel like taking a break is a crime. Thank you for sharing!",
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        isAuthor: false,
      },
    ],
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    isAuthor: false,
  },
  {
    id: "post-seed-3",
    roomId: "wins",
    roomName: "Quiet Wins",
    authorHandle: "HealingWalker88",
    authorAvatar: "dove",
    authorPublicId: "usr_seed_3",
    content: "Small win: I actually went for a 20-minute walk in Uhuru Park instead of staying isolated in my room all afternoon. Celebrating small steps today! ✨",
    audioUrl: null,
    audioDuration: null,
    empathyCount: 31,
    hasLiked: false,
    replies: [],
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    isAuthor: false,
  },
];

let activeCommunityPosts: PublicPost[] = [...DEFAULT_COMMUNITY_POSTS];

export async function getCurrentSessionProfile(): Promise<{
  id: string;
  public_id: string;
  anonymous_handle: string;
  avatar_id: string;
}> {
  // 1. Try Supabase Auth
  try {
    const supabase = createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("public_id, anonymous_handle, avatar_id")
        .eq("id", userData.user.id)
        .maybeSingle();

      if (profile) {
        return {
          id: userData.user.id,
          public_id: profile.public_id,
          anonymous_handle: profile.anonymous_handle,
          avatar_id: profile.avatar_id,
        };
      }
    }
  } catch {
    // Continue to cookie check
  }

  // 2. Try Cookie Profile
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const existingCookie = cookieStore.get("tfl_anon_profile")?.value;

    if (existingCookie) {
      const parsed = JSON.parse(existingCookie);
      if (parsed.anonymous_handle && parsed.public_id) {
        return {
          id: parsed.id || `anon_${parsed.public_id}`,
          public_id: parsed.public_id,
          anonymous_handle: parsed.anonymous_handle,
          avatar_id: parsed.avatar_id || "lotus",
        };
      }
    }
  } catch {
    // Continue to fallback
  }

  // 3. Fallback Profile
  return {
    id: `anon_dev_guest`,
    public_id: `usr_dev_guest`,
    anonymous_handle: generateAnonymousHandle(),
    avatar_id: getRandomAvatarId(),
  };
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
  const currentProfile = await getCurrentSessionProfile();
  const currentUserId = currentProfile.id;

  const limit = options.limit || 20;

  try {
    const supabase = createServerSupabaseClient();
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

    if (!error && data && data.length > 0) {
      const rawRows = data as unknown as RawPost[];
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
  } catch (err) {
    console.warn("[Community] Supabase feed query warning (using active feed):", err);
  }

  // Fallback to active in-memory feed
  let filtered = activeCommunityPosts;
  if (options.roomId && options.roomId !== "all") {
    filtered = filtered.filter((p) => p.roomId === options.roomId);
  }

  const posts = filtered.map((p) => ({
    ...p,
    isAuthor: p.authorPublicId === currentProfile.public_id,
  }));

  return { posts };
}

const ROOM_NAMES: Record<string, string> = {
  all: "General Room",
  anxiety: "Anxiety & Panic",
  relationships: "Relationships",
  burnout: "Stress & Overwhelm",
  grief: "Grief & Loss",
  wins: "Quiet Wins",
};

export async function createPostAction(input: CreatePostInput): Promise<CreatePostResult> {
  const content = input.content?.trim();
  if (!content || content.length < 2 || content.length > 2000) {
    return { success: false, error: "Post must be between 2 and 2000 characters." };
  }

  const profile = await getCurrentSessionProfile();
  const userId = profile.id;

  // Rate limit check
  const rateLimit = await checkRateLimit(userId, "create_post");
  if (!rateLimit.allowed) {
    return { success: false, error: rateLimit.message };
  }

  // Safety screening (Hybrid fast-regex + AI semantic triage)
  const safetyCheck = await evaluateSafetyPolicyAsync(content);

  const newPostId = `post-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();
  const roomName = ROOM_NAMES[input.roomId || "anxiety"] || "Support Room";

  const newPost: PublicPost = {
    id: newPostId,
    roomId: input.roomId || "anxiety",
    roomName,
    authorHandle: profile.anonymous_handle,
    authorAvatar: profile.avatar_id,
    authorPublicId: profile.public_id,
    content,
    audioUrl: input.audioUrl || null,
    audioDuration: input.audioDuration || null,
    empathyCount: 0,
    hasLiked: false,
    replies: [],
    createdAt: now,
    isAuthor: true,
  };

  // Add to in-memory active feed
  activeCommunityPosts = [newPost, ...activeCommunityPosts];

  // Also try Supabase DB insert if online
  try {
    const supabase = createServerSupabaseClient();
    await supabase.from("posts").insert({
      id: newPost.id,
      author_id: userId,
      room_id: input.roomId || "anxiety",
      content,
      audio_url: input.audioUrl || null,
      audio_duration: input.audioDuration || null,
      status: "published",
    });

    if (safetyCheck.triggered && safetyCheck.severity) {
      const adminClient = createAdminSupabaseClient();
      await adminClient.from("moderation_cases").insert({
        source: "safety_policy",
        severity: safetyCheck.severity,
        target_kind: "post",
        post_id: newPost.id,
        status: "open",
      });

      if (safetyCheck.severity === "priority" || safetyCheck.severity === "critical") {
        sendCrisisEscalationAlert({
          postId: newPost.id,
          roomName: input.roomId || "general",
          severity: safetyCheck.severity,
        }).catch((err) => console.error("[CrisisSMS] Failed to send alert:", err));
      }
    }
  } catch (err) {
    console.warn("[Community] DB save warning (post saved to active feed):", err);
  }

  return {
    success: true,
    post: newPost,
    showSafetyResources: safetyCheck.triggered,
    safetySeverity: safetyCheck.severity,
  };
}

export async function createReplyAction(input: CreateReplyInput): Promise<CreateReplyResult> {
  const content = input.content?.trim();
  if (!content || content.length < 1 || content.length > 1000) {
    return { success: false, error: "Reply must be between 1 and 1000 characters." };
  }

  const profile = await getCurrentSessionProfile();
  const userId = profile.id;

  // Rate limit check
  const rateLimit = await checkRateLimit(userId, "create_reply");
  if (!rateLimit.allowed) {
    return { success: false, error: rateLimit.message };
  }

  // Safety check
  const safetyCheck = await evaluateSafetyPolicyAsync(content);

  const replyId = `rep-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newReply: PublicReply = {
    id: replyId,
    postId: input.postId,
    authorHandle: profile.anonymous_handle,
    authorAvatar: profile.avatar_id,
    authorPublicId: profile.public_id,
    content,
    audioUrl: input.audioUrl || null,
    audioDuration: input.audioDuration || null,
    createdAt: now,
    isAuthor: true,
  };

  // Add to active in-memory feed
  activeCommunityPosts = activeCommunityPosts.map((p) => {
    if (p.id === input.postId) {
      return {
        ...p,
        replies: [...p.replies, newReply],
      };
    }
    return p;
  });

  // Also try Supabase DB insert
  try {
    const supabase = createServerSupabaseClient();
    await supabase.from("replies").insert({
      id: replyId,
      post_id: input.postId,
      author_id: userId,
      content,
      audio_url: input.audioUrl || null,
      audio_duration: input.audioDuration || null,
      status: "published",
    });
  } catch (err) {
    console.warn("[Community] DB save reply warning (saved to active feed):", err);
  }

  return {
    success: true,
    reply: newReply,
    showSafetyResources: safetyCheck.triggered,
    safetySeverity: safetyCheck.severity,
  };
}

export async function toggleEmpathyReaction(postId: string): Promise<{ success: boolean; liked: boolean }> {
  const profile = await getCurrentSessionProfile();
  const userId = profile.id;

  // Rate limit
  const rateLimit = await checkRateLimit(userId, "toggle_reaction");
  if (!rateLimit.allowed) {
    return { success: false, liked: false };
  }

  let nextLiked = false;

  // Update in-memory feed
  activeCommunityPosts = activeCommunityPosts.map((p) => {
    if (p.id === postId) {
      nextLiked = !p.hasLiked;
      return {
        ...p,
        hasLiked: nextLiked,
        empathyCount: nextLiked ? p.empathyCount + 1 : Math.max(0, p.empathyCount - 1),
      };
    }
    return p;
  });

  try {
    const supabase = createServerSupabaseClient();
    const { data: existing } = await supabase
      .from("reactions")
      .select("post_id")
      .eq("post_id", postId)
      .eq("profile_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase.from("reactions").delete().eq("post_id", postId).eq("profile_id", userId);
    } else {
      await supabase.from("reactions").insert({ post_id: postId, profile_id: userId });
    }
  } catch (err) {
    console.warn("[Community] DB reaction warning (updated in active feed):", err);
  }

  return { success: true, liked: nextLiked };
}

export async function deletePostAction(postId: string): Promise<{ success: boolean; error?: string }> {
  activeCommunityPosts = activeCommunityPosts.filter((p) => p.id !== postId);

  try {
    const supabase = createServerSupabaseClient();
    await supabase.from("posts").delete().eq("id", postId);
  } catch (err) {
    console.warn("[Community] DB delete post warning:", err);
  }

  return { success: true };
}

export async function deleteReplyAction(replyId: string): Promise<{ success: boolean; error?: string }> {
  activeCommunityPosts = activeCommunityPosts.map((p) => ({
    ...p,
    replies: p.replies.filter((r) => r.id !== replyId),
  }));

  try {
    const supabase = createServerSupabaseClient();
    await supabase.from("replies").delete().eq("id", replyId);
  } catch (err) {
    console.warn("[Community] DB delete reply warning:", err);
  }

  return { success: true };
}

export async function reportContentAction(input: {
  targetKind: "post" | "reply";
  targetId: string;
  reason: ReportReason;
  context?: string;
}): Promise<{ success: boolean; error?: string }> {
  const profile = await getCurrentSessionProfile();
  const userId = profile.id;

  const rateLimit = await checkRateLimit(userId, "create_report");
  if (!rateLimit.allowed) {
    return { success: false, error: rateLimit.message };
  }

  try {
    const admin = createAdminSupabaseClient();
    await admin.from("moderation_cases").insert({
      source: "user_report",
      severity: input.reason === "crisis_concern" ? "critical" : "priority",
      target_kind: input.targetKind,
      post_id: input.targetKind === "post" ? input.targetId : null,
      reply_id: input.targetKind === "reply" ? input.targetId : null,
      status: "open",
    });
  } catch (err) {
    console.warn("[Community] DB report warning:", err);
  }

  return { success: true };
}

export async function deleteIdentityAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user) {
      await supabase.from("profiles").update({ status: "deleting" }).eq("id", userData.user.id);
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.warn("[Community] Delete identity warning:", err);
  }

  const { cookies } = await import("next/headers");
  const cookieStore = cookies();
  cookieStore.delete("tfl_anon_profile");

  return { success: true };
}
