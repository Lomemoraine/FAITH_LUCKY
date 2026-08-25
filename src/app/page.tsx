"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Heart,
  MessageCircle,
  AlertTriangle,
  Trash2,
  Flag,
  Wind,
  PenLine,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AppShell, type AppView } from "./components/app-shell";
import { SupportHome } from "./components/support-home";
import { CrisisModal } from "./components/crisis-modal";
import { ComingSoonModal } from "./components/coming-soon-modal";
import { ReportModal } from "./components/report-modal";
import { EditProfileModal } from "./components/edit-profile-modal";
import { VoiceRecorder } from "./components/voice-recorder";
import { VoicePlayer } from "./components/voice-player";
import { StoreView } from "./components/store-view";
import { CounselorView } from "./components/counselor-view";
import { AVATAR_OPTIONS } from "@/lib/identity/pseudonym";
import { PublicPost, PublicProfile, RoomSlug } from "@/lib/types";

function getAvatarIcon(avatarId?: string) {
  const found = AVATAR_OPTIONS.find((a) => a.id === avatarId);
  return found ? found.icon : "🌸";
}

export default function SafeSpaceApp() {
  const [activeView, setActiveView] = useState<AppView>("home");
  const [selectedRoom, setSelectedRoom] = useState<RoomSlug>("all");

  // Auth / Profile State
  const [currentProfile, setCurrentProfile] = useState<PublicProfile | null>(null);
  const [activeVoucherCode, setActiveVoucherCode] = useState<string>("");

  // Feed State
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Modals State
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [comingSoonModal, setComingSoonModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    features: string[];
  }>({
    isOpen: false,
    title: "",
    description: "",
    features: [],
  });

  // Report Modal State
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    targetKind: "post" | "reply";
    targetId: string;
    targetAuthorHandle?: string;
  }>({
    isOpen: false,
    targetKind: "post",
    targetId: "",
  });

  // Post Composer State
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostRoom, setNewPostRoom] = useState<RoomSlug>("anxiety");
  const [attachedAudioBlob, setAttachedAudioBlob] = useState<Blob | null>(null);
  const [attachedAudioDuration, setAttachedAudioDuration] = useState<number | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Reply Composer State
  const [expandedReplies, setExpandedReplies] = useState<{ [postId: string]: boolean }>({});
  const [replyInput, setReplyInput] = useState<{ [postId: string]: string }>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<{ [postId: string]: boolean }>({});

  // Breathing State
  const [breathPhase, setBreathPhase] = useState<"Breathe In" | "Hold" | "Breathe Out">("Breathe In");
  const [breathCount, setBreathCount] = useState(4);

  const fetchPosts = useCallback(async (room: RoomSlug) => {
    setIsLoadingFeed(true);
    setFeedError(null);
    try {
      const res = await fetch(`/api/community/posts?roomId=${room}`);
      const data = await res.json();
      if (data.posts) {
        setPosts(data.posts);
      } else {
        setPosts([]);
      }
    } catch {
      setFeedError("Unable to load community stories. Please check your connection.");
    } finally {
      setIsLoadingFeed(false);
    }
  }, []);

  const initAuthSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/anonymous");
      const data = await res.json();
      if (data.authenticated && data.profile) {
        setCurrentProfile(data.profile);
      }
    } catch (err) {
      console.error("Auth init error:", err);
    }
  }, []);

  // Initial Auth & Feed Check
  useEffect(() => {
    initAuthSession();
    fetchPosts(selectedRoom);
  }, [initAuthSession, fetchPosts, selectedRoom]);

  // Breathing Exercise Timer
  useEffect(() => {
    if (!showBreathingModal) return;
    const phases: Array<{ name: "Breathe In" | "Hold" | "Breathe Out"; seconds: number }> = [
      { name: "Breathe In", seconds: 4 },
      { name: "Hold", seconds: 7 },
      { name: "Breathe Out", seconds: 8 },
    ];
    let currentIdx = 0;
    let timer = phases[currentIdx].seconds;

    const interval = setInterval(() => {
      timer -= 1;
      setBreathCount(timer);
      if (timer <= 0) {
        currentIdx = (currentIdx + 1) % phases.length;
        setBreathPhase(phases[currentIdx].name);
        timer = phases[currentIdx].seconds;
        setBreathCount(timer);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showBreathingModal]);

  async function ensureAnonymousSession(): Promise<PublicProfile | null> {
    if (currentProfile) return currentProfile;
    try {
      const res = await fetch("/api/auth/anonymous", { method: "POST" });
      const data = await res.json();
      if (data.success && data.profile) {
        setCurrentProfile(data.profile);
        return data.profile;
      }
    } catch (err) {
      console.error("Ensure session error:", err);
    }
    return null;
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    const content = newPostContent.trim() || (attachedAudioBlob ? "Shared a voice story" : "");
    if (!content) return;

    setIsSubmittingPost(true);
    setPostError(null);

    try {
      // Ensure anonymous session exists
      const session = await ensureAnonymousSession();
      if (!session) {
        setPostError("Failed to initialize your anonymous profile. Please try again.");
        setIsSubmittingPost(false);
        return;
      }

      let audioUrl: string | null = null;
      let audioDuration: number | null = attachedAudioDuration;

      // Upload audio if recorded
      if (attachedAudioBlob) {
        const formData = new FormData();
        formData.append("audio", attachedAudioBlob, "voice-note.webm");
        if (attachedAudioDuration) {
          formData.append("duration", String(attachedAudioDuration));
        }

        const uploadRes = await fetch("/api/community/upload-audio", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.success) {
          audioUrl = uploadData.audioUrl;
          audioDuration = uploadData.duration || attachedAudioDuration;
        }
      }

      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: newPostRoom,
          content,
          audioUrl,
          audioDuration,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setPostError(data.error || "Unable to publish your story.");
      } else {
        if (data.post) {
          setPosts((prev) => [data.post, ...prev]);
        }
        setNewPostContent("");
        setAttachedAudioBlob(null);
        setAttachedAudioDuration(null);
        setShowNewPostModal(false);

        // If crisis safety screening triggered, show verified Kenya resources
        if (data.showSafetyResources) {
          setShowCrisisModal(true);
        }
      }
    } catch {
      setPostError("Network error while creating your post.");
    } finally {
      setIsSubmittingPost(false);
    }
  }

  async function handleCreateReply(postId: string) {
    const content = (replyInput[postId] || "").trim();
    if (!content) return;

    setIsSubmittingReply((prev) => ({ ...prev, [postId]: true }));

    try {
      await ensureAnonymousSession();

      const res = await fetch("/api/community/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.reply) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                replies: [...p.replies, data.reply],
              };
            }
            return p;
          })
        );
        setReplyInput((prev) => ({ ...prev, [postId]: "" }));

        if (data.showSafetyResources) {
          setShowCrisisModal(true);
        }
      }
    } catch (err) {
      console.error("Reply error:", err);
    } finally {
      setIsSubmittingReply((prev) => ({ ...prev, [postId]: false }));
    }
  }

  async function handleToggleReaction(postId: string) {
    await ensureAnonymousSession();

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const nextLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked: nextLiked,
            empathyCount: nextLiked ? p.empathyCount + 1 : Math.max(0, p.empathyCount - 1),
          };
        }
        return p;
      })
    );

    try {
      const res = await fetch("/api/community/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback on failure
        fetchPosts(selectedRoom);
      }
    } catch {
      fetchPosts(selectedRoom);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Are you sure you want to delete this story? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/community/posts?id=${postId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== postId));
      }
    } catch (err) {
      console.error("Delete post error:", err);
    }
  }

  async function handleDeleteReply(postId: string, replyId: string) {
    if (!confirm("Are you sure you want to delete this reply?")) {
      return;
    }

    try {
      const res = await fetch(`/api/community/replies?id=${replyId}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                replies: p.replies.filter((r) => r.id !== replyId),
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.error("Delete reply error:", err);
    }
  }

  async function handleResetIdentity() {
    if (!confirm("This will permanently remove your anonymous profile and all public stories and replies you created. Proceed?")) {
      return;
    }

    try {
      const res = await fetch("/api/community/identity", { method: "DELETE" });
      if (res.ok) {
        setCurrentProfile(null);
        fetchPosts(selectedRoom);
        alert("Your anonymous identity and content have been deleted.");
      }
    } catch {
      alert("Error resetting identity.");
    }
  }

  function handleProfileUpdated(updated: PublicProfile) {
    setCurrentProfile(updated);
    // Update local author handles in feed
    setPosts((prev) =>
      prev.map((p) => {
        if (p.isAuthor) {
          return {
            ...p,
            authorHandle: updated.anonymous_handle,
            authorAvatar: updated.avatar_id,
          };
        }
        return p;
      })
    );
  }

  const roomsList: Array<{ id: RoomSlug; label: string; icon: string }> = [
    { id: "all", label: "All Stories", icon: "🌸" },
    { id: "anxiety", label: "Stress & Anxiety", icon: "🌪️" },
    { id: "relationships", label: "Relationships", icon: "💔" },
    { id: "burnout", label: "Work & Pressure", icon: "💼" },
    { id: "grief", label: "Grief & Healing", icon: "🕊️" },
    { id: "wins", label: "Small Wins", icon: "🌱" },
  ];

  return (
    <AppShell
      activeView={activeView}
      onNavigate={(view) => setActiveView(view)}
      onOpenCrisis={() => setShowCrisisModal(true)}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Support Home View */}
        {activeView === "home" && (
          <SupportHome
            onNavigate={(view) => setActiveView(view)}
            onShare={() => setShowNewPostModal(true)}
            onBreathe={() => setShowBreathingModal(true)}
          />
        )}

        {/* Community Feed View */}
        {activeView === "community" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <header className="space-y-3">
              <div className="flex items-center justify-between">
                <h1 className="text-balance font-display text-3xl font-bold tracking-[-0.03em] text-[#21191d] sm:text-4xl">
                  Stories from people who understand
                </h1>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#6d6267] sm:text-base">
                Read quietly, respond with empathy, or share whenever you feel ready.
              </p>

              {/* Anonymous identity badge */}
              {currentProfile && (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-warm-50 border border-warm-200/70 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-sm shadow-sm">
                      {getAvatarIcon(currentProfile.avatar_id)}
                    </span>
                    <span className="text-slate-700">
                      Posting as: <strong className="text-slate-900">@{currentProfile.anonymous_handle}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => setShowEditProfileModal(true)}
                      className="text-rose-600 hover:text-rose-800 font-semibold underline"
                    >
                      Customize Handle
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={handleResetIdentity}
                      className="text-slate-500 hover:text-slate-700 font-medium"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              )}
            </header>

            <div className="space-y-5">
              {/* Room Filter Pills */}
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 text-sm font-medium" role="group" aria-label="Filter by topic">
                {roomsList.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    aria-pressed={selectedRoom === room.id}
                    className={`min-h-11 whitespace-nowrap rounded-full border px-4 py-2 transition-colors ${
                      selectedRoom === room.id
                        ? "border-rose-500 bg-rose-500 font-bold text-white shadow-sm"
                        : "border-[#eadfe1] bg-white text-[#6d6267] hover:border-rose-200"
                    }`}
                  >
                    {room.icon} {room.label}
                  </button>
                ))}
              </div>

              {/* Post Trigger Button */}
              <button
                onClick={() => setShowNewPostModal(true)}
                className="flex min-h-16 w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-[0_10px_35px_rgba(64,35,44,0.08)] transition-shadow hover:shadow-[0_14px_40px_rgba(64,35,44,0.12)] border border-rose-100/50"
                aria-label="Open composer to share a new story"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <PenLine className="h-5 w-5" />
                </div>
                <div className="flex-1 text-sm text-[#766b70]">
                  How is your heart feeling today?
                </div>
                <span className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow-sm">
                  Share
                </span>
              </button>

              {/* Feed Content */}
              {isLoadingFeed ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-rose-400" />
                  <p className="text-sm">Loading community stories...</p>
                </div>
              ) : feedError ? (
                <div className="bg-white p-8 rounded-2xl border border-rose-100 text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-sm text-slate-700">{feedError}</p>
                  <button
                    onClick={() => fetchPosts(selectedRoom)}
                    className="px-4 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold"
                  >
                    Retry
                  </button>
                </div>
              ) : posts.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-rose-100 text-center space-y-2">
                  <span className="text-3xl">🌸</span>
                  <h3 className="font-bold text-slate-900 text-base">Be the first to share here</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    This room is quiet right now. You can share a thought, prayer, or small victory safely and anonymously.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => {
                    const isExpanded = !!expandedReplies[post.id];

                    return (
                      <article
                        key={post.id}
                        className="bg-white p-5 rounded-2xl border border-rose-100/70 shadow-sm space-y-4 transition-all hover:border-rose-200"
                      >
                        {/* Post Header */}
                        <div className="flex items-start justify-between gap-3 text-sm">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="w-10 h-10 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center text-lg shadow-sm">
                              {getAvatarIcon(post.authorAvatar)}
                            </span>
                            <div className="min-w-0">
                              <span className="block truncate font-bold text-gray-900">
                                @{post.authorHandle}
                              </span>
                              <span className="block text-xs text-gray-400">
                                {new Date(post.createdAt).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-rose-50 px-3 py-1 text-center text-xs font-medium leading-4 text-rose-600">
                              {post.roomName}
                            </span>
                          </div>
                        </div>

                        {/* Body Text */}
                        {post.content && (
                          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                            {post.content}
                          </p>
                        )}

                        {/* Audio Player if present */}
                        {post.audioUrl && (
                          <div className="pt-1">
                            <VoicePlayer
                              audioUrl={post.audioUrl}
                              duration={post.audioDuration}
                            />
                          </div>
                        )}

                        {/* Actions bar */}
                        <div className="flex items-center justify-between border-t border-rose-50 pt-3 text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <button
                              onClick={() => handleToggleReaction(post.id)}
                              className={`flex items-center gap-1.5 font-medium transition-colors ${
                                post.hasLiked ? "text-rose-600 font-bold" : "text-gray-500 hover:text-rose-600"
                              }`}
                              aria-label="Send empathy reaction"
                            >
                              <Heart className={`w-4 h-4 ${post.hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                              <span>{post.empathyCount} Empathy</span>
                            </button>

                            <button
                              onClick={() =>
                                setExpandedReplies((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                              }
                              className="flex items-center gap-1.5 font-medium hover:text-gray-700"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.replies.length} Replies</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() =>
                                setReportModal({
                                  isOpen: true,
                                  targetKind: "post",
                                  targetId: post.id,
                                  targetAuthorHandle: post.authorHandle,
                                })
                              }
                              className="text-gray-400 hover:text-rose-600 transition-colors"
                              title="Report story"
                            >
                              <Flag className="w-3.5 h-3.5" />
                            </button>

                            {post.isAuthor && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                className="text-gray-400 hover:text-rose-600 transition-colors"
                                title="Delete your post"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Replies Section */}
                        {isExpanded && (
                          <div className="pt-3 border-t border-slate-100 space-y-3">
                            {post.replies.length > 0 && (
                              <div className="space-y-2">
                                {post.replies.map((reply) => (
                                  <div
                                    key={reply.id}
                                    className="p-3 rounded-xl bg-sand-50/70 border border-sand-200/60 text-xs space-y-1"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                                        <span>{getAvatarIcon(reply.authorAvatar)}</span>
                                        <span>@{reply.authorHandle}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400">
                                          {new Date(reply.createdAt).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}
                                        </span>
                                        <button
                                          onClick={() =>
                                            setReportModal({
                                              isOpen: true,
                                              targetKind: "reply",
                                              targetId: reply.id,
                                              targetAuthorHandle: reply.authorHandle,
                                            })
                                          }
                                          className="text-slate-400 hover:text-rose-600"
                                        >
                                          <Flag className="w-3 h-3" />
                                        </button>
                                        {reply.isAuthor && (
                                          <button
                                            onClick={() => handleDeleteReply(post.id, reply.id)}
                                            className="text-slate-400 hover:text-rose-600"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                                      {reply.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input */}
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="Write a supportive reply..."
                                value={replyInput[post.id] || ""}
                                onChange={(e) =>
                                  setReplyInput({ ...replyInput, [post.id]: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleCreateReply(post.id);
                                  }
                                }}
                                className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-400"
                              />
                              <button
                                onClick={() => handleCreateReply(post.id)}
                                disabled={
                                  isSubmittingReply[post.id] || !(replyInput[post.id] || "").trim()
                                }
                                className="px-3 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 disabled:opacity-50 transition-colors"
                              >
                                Reply
                              </button>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Wellness & Guided Breathing View */}
        {activeView === "wellness" && (
          <div className="mx-auto max-w-xl text-center space-y-6">
            <h1 className="font-display text-3xl font-bold text-slate-900">
              Gentle Self-Care & Breathing
            </h1>
            <p className="text-sm text-slate-600">
              Take a moment to pause. When overwhelming thoughts crowd in, grounding your physical breath can restore calm.
            </p>

            <div className="p-8 rounded-3xl bg-white border border-rose-100 shadow-sm space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-rose-50 border-4 border-rose-200 flex items-center justify-center text-rose-600 animate-pulse">
                <Wind className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">4-7-8 Breathing</h3>
                <p className="text-xs text-slate-500">
                  Inhale quietly through the nose for 4s, hold for 7s, and exhale completely through the mouth for 8s.
                </p>
              </div>

              <button
                onClick={() => setShowBreathingModal(true)}
                className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                Begin 2-Minute Guided Session
              </button>
            </div>
          </div>
        )}

        {/* TFL Care Gifts & Merch Store View */}
        {activeView === "store" && (
          <StoreView
            onGoToCounselor={(code) => {
              if (code) {
                setActiveVoucherCode(code);
              }
              setActiveView("psychologist");
            }}
          />
        )}

        {/* Verified Counselor 1-on-1 Consultation View */}
        {activeView === "psychologist" && (
          <CounselorView
            initialVoucherCode={activeVoucherCode}
            onGoToStore={() => setActiveView("store")}
            onOpenCrisis={() => setShowCrisisModal(true)}
          />
        )}
      </div>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Share Story or Voice Note</h3>
              <button
                onClick={() => {
                  setShowNewPostModal(false);
                  setAttachedAudioBlob(null);
                  setAttachedAudioDuration(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Choose Community Room
                </label>
                <select
                  value={newPostRoom}
                  onChange={(e) => setNewPostRoom(e.target.value as RoomSlug)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-white"
                >
                  <option value="anxiety">🌪️ Stress & Overwhelm</option>
                  <option value="relationships">💔 Relationships & Family</option>
                  <option value="burnout">💼 Work & Pressure</option>
                  <option value="grief">🕊️ Grief & Healing</option>
                  <option value="wins">🌱 Small Wins & Gratitude</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Story {attachedAudioBlob ? "(Optional with Voice Note)" : ""}
                </label>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share what is on your mind or record a quiet voice note below..."
                  rows={4}
                  required={!attachedAudioBlob}
                  className="w-full text-sm p-4 border border-slate-200 rounded-2xl focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              {/* Voice Note Recorder */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Voice Note (Optional)
                </label>
                <VoiceRecorder
                  onAudioRecorded={(blob, duration) => {
                    setAttachedAudioBlob(blob);
                    setAttachedAudioDuration(duration);
                  }}
                  onDiscard={() => {
                    setAttachedAudioBlob(null);
                    setAttachedAudioDuration(null);
                  }}
                />
              </div>

              {postError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {postError}
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  🔒 Kept 100% anonymous & device-bound
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewPostModal(false);
                      setAttachedAudioBlob(null);
                      setAttachedAudioDuration(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPost || (!newPostContent.trim() && !attachedAudioBlob)}
                    className="px-5 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 disabled:opacity-50 transition-colors shadow-sm"
                  >
                    {isSubmittingPost ? "Publishing..." : "Publish Anonymously"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Guided Breathing Modal */}
      {showBreathingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-rose-100 space-y-6">
            <h3 className="text-xl font-bold text-slate-900">Guided 4-7-8 Breathing</h3>

            <div className="w-40 h-40 mx-auto rounded-full bg-rose-50 border-4 border-rose-300 flex flex-col items-center justify-center transition-all">
              <span className="text-base font-bold text-rose-600 mb-1">{breathPhase}</span>
              <span className="text-4xl font-extrabold text-slate-800">{breathCount}</span>
            </div>

            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Focus solely on the rhythm of your breath. Inhale deeply, hold gently, and release tension slowly.
            </p>

            <button
              onClick={() => setShowBreathingModal(false)}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Finish Exercise
            </button>
          </div>
        </div>
      )}

      {/* Crisis Helplines Modal */}
      <CrisisModal
        isOpen={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
      />

      {/* Coming Soon Modal */}
      <ComingSoonModal
        isOpen={comingSoonModal.isOpen}
        onClose={() => setComingSoonModal({ ...comingSoonModal, isOpen: false })}
        title={comingSoonModal.title}
        description={comingSoonModal.description}
        features={comingSoonModal.features}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ ...reportModal, isOpen: false })}
        targetKind={reportModal.targetKind}
        targetId={reportModal.targetId}
        targetAuthorHandle={reportModal.targetAuthorHandle}
      />

      {/* Edit Profile Modal */}
      {currentProfile && (
        <EditProfileModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          currentProfile={currentProfile}
          onProfileUpdated={handleProfileUpdated}
        />
      )}
    </AppShell>
  );
}
