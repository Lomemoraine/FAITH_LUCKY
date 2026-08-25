"use client";

import React, { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  PhoneCall,
  AlertTriangle,
  Send,
  ChevronRight,
  Mic,
  Wind,
  PenLine,
} from "lucide-react";
import { AppShell, type AppView } from "./components/app-shell";
import { SupportHome } from "./components/support-home";

type Room = "all" | "anxiety" | "relationships" | "burnout" | "grief" | "wins";

interface Post {
  id: string;
  authorHandle: string;
  room: Room;
  roomLabel: string;
  content: string;
  hasVoiceNote?: boolean;
  voiceDuration?: string;
  empathyCount: number;
  hasLiked?: boolean;
  replies: { id: string; authorHandle: string; content: string; time: string }[];
  isFlagged?: boolean;
  timeAgo: string;
}

interface Product {
  id: string;
  name: string;
  priceKes: number;
  originalPriceKes: number;
  description: string;
  badge: string;
  unlocksText: string;
  icon: string;
  sizes?: string[];
}

export default function SafeSpaceApp() {
  const [activeView, setActiveView] = useState<AppView>("home");
  const [selectedRoom, setSelectedRoom] = useState<Room>("all");
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostRoom, setNewPostRoom] = useState<Room>("anxiety");
  const [hasVoiceAttached, setHasVoiceAttached] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [isVoucherUnlocked, setIsVoucherUnlocked] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);

  // Breathing state
  const [breathPhase, setBreathPhase] = useState<"Breathe In" | "Hold" | "Breathe Out">("Breathe In");
  const [breathCount, setBreathCount] = useState(4);

  // Store State
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("L");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentSuccessCode, setPaymentSuccessCode] = useState<string | null>(null);
  const [isProcessingMpesa, setIsProcessingMpesa] = useState(false);
  const [mpesaCountdown, setMpesaCountdown] = useState(0);

  // Breathing interval
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

  // Merch
  const products: Product[] = [
    {
      id: "prod-1",
      name: "TFL Signature Rose Gold Hoodie",
      priceKes: 2800,
      originalPriceKes: 3500,
      description: "Ultra-soft heavy fleece hoodie with gold embroidery. Warm, soothing, and comfortable.",
      badge: "Free Therapy Gift Pass",
      unlocksText: "Includes 1 Free 1-on-1 Session with Dr. Amani",
      icon: "🧥",
      sizes: ["S", "M", "L", "XL", "2XL"],
    },
    {
      id: "prod-2",
      name: "TFL Daily Self-Care & Gratitude Journal",
      priceKes: 1200,
      originalPriceKes: 1600,
      description: "Hardcover guided journal for recording daily thoughts, prayers, and reflections.",
      badge: "Most Loved",
      unlocksText: "Includes 1 Free Mental Wellness Check-in",
      icon: "📔",
    },
    {
      id: "prod-3",
      name: "TFL 'Talk Freely' Soft Cotton Tee",
      priceKes: 1500,
      originalPriceKes: 2000,
      description: "100% Breathable soft cotton shirt with uplifting words of hope.",
      badge: "Community Favorite",
      unlocksText: "Includes 1 Month Access to Counselor Audio Rooms",
      icon: "👕",
      sizes: ["S", "M", "L", "XL"],
    },
    {
      id: "prod-4",
      name: "TFL 'Stay Strong' Rose Gold Bracelet",
      priceKes: 650,
      originalPriceKes: 900,
      description: "Waterproof stainless steel reminder charm that you are loved and never alone.",
      badge: "Gift of Hope",
      unlocksText: "Unlocks Verified Supporter Badge",
      icon: "✨",
    },
  ];

  // Feed Posts
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "post-1",
      authorHandle: "MamaZawadi",
      room: "anxiety",
      roomLabel: "Stress & Overwhelm",
      content:
        "Sometimes as women and mothers we carry so much silently without telling anyone. Juzi I was feeling so overwhelmed with family and work. Just writing this here makes my chest feel a bit lighter. Thank you for this safe space. 💕",
      hasVoiceNote: true,
      voiceDuration: "0:38",
      empathyCount: 38,
      replies: [
        {
          id: "rep-1",
          authorHandle: "AmaniSister",
          content: "Pole sana mama. You are doing a wonderful job. Give yourself permission to pause for 10 minutes today. 🫂",
          time: "15m ago",
        },
      ],
      timeAgo: "30m ago",
    },
    {
      id: "post-2",
      authorHandle: "FaithSeeker24",
      room: "wins",
      roomLabel: "Small Wins",
      content:
        "Small win for today: I managed to take a quiet morning walk, prayed, and drank a full glass of water. Step by step, we will be okay! 🌸✨",
      empathyCount: 64,
      replies: [
        {
          id: "rep-2",
          authorHandle: "GracefulHeart",
          content: "Proud of you sister! Keep taking it one day at a time. ❤️",
          time: "1h ago",
        },
      ],
      timeAgo: "2h ago",
    },
    {
      id: "post-3",
      authorHandle: "QuietTears",
      room: "grief",
      roomLabel: "Grief & Healing",
      content:
        "Lost someone very close to me recently and the house feels so quiet. I feel like crying every evening and I don't know who to talk to without feeling like a burden.",
      empathyCount: 42,
      isFlagged: true,
      replies: [],
      timeAgo: "4h ago",
    },
  ]);

  // Chat
  const [chatLog, setChatLog] = useState<{ sender: "user" | "therapist"; text: string; time: string }[]>([
    {
      sender: "therapist",
      text: "Habari! I am Dr. Amani, a licensed clinical counselor at TFL SafeSpace. Everything you share here is 100% confidential and safe. How is your heart doing today?",
      time: "10:30 AM",
    },
  ]);

  const toggleVoice = (postId: string) => {
    if (isPlayingVoice === postId) {
      setIsPlayingVoice(null);
    } else {
      setIsPlayingVoice(postId);
      setTimeout(() => {
        setIsPlayingVoice(null);
      }, 4000);
    }
  };

  const handleLike = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const hasLiked = p.hasLiked;
          return {
            ...p,
            hasLiked: !hasLiked,
            empathyCount: hasLiked ? p.empathyCount - 1 : p.empathyCount + 1,
          };
        }
        return p;
      })
    );
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const crisisTriggers = ["give up", "end it", "hurt myself", "hopeless", "can't go on", "die", "suicide", "end my life"];
    const hasCrisis = crisisTriggers.some((t) => newPostContent.toLowerCase().includes(t));

    const roomLabels: Record<Room, string> = {
      all: "General",
      anxiety: "Stress & Overwhelm",
      relationships: "Relationships",
      burnout: "Work & Pressure",
      grief: "Grief & Healing",
      wins: "Small Wins",
    };

    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorHandle: `SisterHope${Math.floor(100 + Math.random() * 900)}`,
      room: newPostRoom,
      roomLabel: roomLabels[newPostRoom],
      content: newPostContent,
      hasVoiceNote: hasVoiceAttached,
      voiceDuration: hasVoiceAttached ? "0:30" : undefined,
      empathyCount: 1,
      hasLiked: true,
      replies: [],
      isFlagged: hasCrisis,
      timeAgo: "Just now",
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
    setHasVoiceAttached(false);
    setShowNewPostModal(false);

    if (hasCrisis) {
      setShowCrisisModal(true);
    }
  };

  const handleSimulateMpesa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setIsProcessingMpesa(true);
    setMpesaCountdown(5);

    const interval = setInterval(() => {
      setMpesaCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsProcessingMpesa(false);
          const generatedCode = `TFL-CARE-${Math.floor(100000 + Math.random() * 900000)}`;
          setPaymentSuccessCode(generatedCode);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = { sender: "user" as const, text: chatMessage, time: "Just now" };
    setChatLog((prev) => [...prev, userMsg]);
    setChatMessage("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setChatLog((prev) => [
        ...prev,
        {
          sender: "therapist" as const,
          text: "Thank you for trusting me with that. You are not alone, and taking things one step at a time is more than enough.",
          time: "Just now",
        },
      ]);
    }, 1500);
  };

  const roomsList: Array<{ id: Room; label: string; icon: string }> = [
    { id: "all", label: "All Stories", icon: "🌸" },
    { id: "anxiety", label: "Stress & Anxiety", icon: "🌪️" },
    { id: "relationships", label: "Relationships", icon: "💔" },
    { id: "burnout", label: "Work & Pressure", icon: "💼" },
    { id: "grief", label: "Grief & Healing", icon: "🕊️" },
    { id: "wins", label: "Small Wins", icon: "🌱" },
  ];

  const filteredPosts = posts.filter(
    (p) => (selectedRoom === "all" ? true : p.room === selectedRoom)
  );

  return (
    <AppShell
      activeView={activeView}
      onNavigate={setActiveView}
      onOpenCrisis={() => setShowCrisisModal(true)}
    >
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {activeView === "home" && (
          <SupportHome
            onNavigate={setActiveView}
            onShare={() => setShowNewPostModal(true)}
            onBreathe={() => setShowBreathingModal(true)}
          />
        )}

        {activeView === "community" && (
          <div className="mx-auto max-w-2xl space-y-6">
            <header className="space-y-3">
              <h1 className="text-balance font-display text-3xl font-bold tracking-[-0.03em] text-[#21191d] sm:text-4xl">
                Stories from people who understand
              </h1>
              <p className="max-w-xl text-sm leading-6 text-[#6d6267] sm:text-base">
                Read quietly, respond with empathy, or share whenever you feel ready.
              </p>
            </header>

            <div className="space-y-5">
              
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 text-sm font-medium" role="group" aria-label="Filter by topic">
                {roomsList.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    aria-pressed={selectedRoom === room.id}
                    className={`min-h-11 whitespace-nowrap rounded-full border px-4 py-2 transition-colors ${
                      selectedRoom === room.id
                        ? "border-rose-500 bg-rose-500 font-bold text-white"
                        : "border-[#eadfe1] bg-white text-[#6d6267] hover:border-rose-200"
                    }`}
                  >
                    {room.icon} {room.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowNewPostModal(true)}
                className="flex min-h-16 w-full items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-[0_10px_35px_rgba(64,35,44,0.08)] transition-shadow hover:shadow-[0_14px_40px_rgba(64,35,44,0.12)]"
                aria-label="Open composer to share a new story"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <PenLine className="h-5 w-5" />
                </div>
                <div className="flex-1 text-sm text-[#766b70]">
                  How is your heart feeling today?
                </div>
                <span className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white">
                  Share
                </span>
              </button>

              {/* Posts Stream */}
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white p-5 rounded-2xl border border-rose-100/70 shadow-sm space-y-4 transition-all hover:border-rose-200"
                  >
                    {/* Post Header */}
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-sm">
                          {post.authorHandle.substring(0, 2).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <span className="block truncate font-bold text-gray-900">{post.authorHandle}</span>
                          <span className="block text-xs text-gray-400">{post.timeAgo}</span>
                        </div>
                      </div>

                      <span className="max-w-32 shrink-0 rounded-full bg-rose-50 px-3 py-1 text-center text-xs font-medium leading-4 text-rose-500">
                        {post.roomLabel}
                      </span>
                    </div>

                    {/* Body Text */}
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Voice Note */}
                    {post.hasVoiceNote && (
                      <div className="bg-rose-50/50 border border-rose-100 p-3 rounded-xl flex items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleVoice(post.id)}
                            aria-label={isPlayingVoice === post.id ? "Pause voice story" : "Play voice story"}
                            className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-sm shadow-sm"
                          >
                            {isPlayingVoice === post.id ? "⏸" : "▶"}
                          </button>
                          <div>
                            <span className="font-bold text-gray-800 text-sm block">Voice Story</span>
                            <span className="text-xs text-gray-400">{post.voiceDuration}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 h-4" aria-hidden="true">
                          {[40, 80, 30, 90, 50, 70, 40, 100].map((h, i) => (
                            <div
                              key={i}
                              style={{ height: `${h}%` }}
                              className={`w-1 rounded-full ${
                                isPlayingVoice === post.id ? "bg-rose-500 animate-pulse" : "bg-rose-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Crisis Triage Banner */}
                    {post.isFlagged && (
                      <div className="flex flex-col items-stretch justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" aria-hidden="true" />
                          <span>Counselor alert: We are here to support you.</span>
                        </div>
                        <button
                          onClick={() => setActiveView("psychologist")}
                          className="min-h-11 shrink-0 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white"
                        >
                          Talk to Counselor
                        </button>
                      </div>
                    )}

                    {/* Reaction & Reply Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-rose-50 text-sm text-gray-500">
                      <button
                        onClick={() => handleLike(post.id)}
                        aria-label={`${post.hasLiked ? "Remove empathy" : "Show empathy"} - ${post.empathyCount} people heard`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all min-h-[40px] ${
                          post.hasLiked
                            ? "bg-rose-50 text-rose-600 font-bold"
                            : "hover:bg-rose-50 text-gray-500"
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${post.hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                        <span>{post.empathyCount} I hear you</span>
                      </button>

                      <div className="flex items-center gap-2 text-gray-400">
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.replies.length} replies</span>
                      </div>
                    </div>

                    {/* Replies List */}
                    {post.replies.length > 0 && (
                      <div className="space-y-3 pt-1">
                        {post.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className="bg-rose-50/40 p-3 rounded-xl text-sm space-y-1 border-l-2 border-rose-300"
                          >
                            <div className="flex justify-between font-bold text-gray-800 text-xs">
                              <span>{rep.authorHandle}</span>
                              <span className="text-xs text-gray-400 font-normal">{rep.time}</span>
                            </div>
                            <p className="text-gray-600">{rep.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: GIFTS & MERCH */}
        {activeView === "store" && (
          <div className="mx-auto max-w-5xl space-y-8">
            <header className="grid items-end gap-6 border-b border-[#e5dadd] pb-7 sm:grid-cols-[1fr_auto]">
              <div>
                <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-[#21191d] sm:text-4xl">
                  Gifts that help fund care
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6267] sm:text-base">
                  Every purchase includes a SafeSpace care benefit for you or someone who needs support.
                </p>
              </div>
              <div className="rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white">
                Shop to heal
              </div>
            </header>

            {/* Responsive Product Cards Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between space-y-4 hover:border-rose-300 transition-all hover:shadow-md"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-4xl">{prod.icon}</span>
                      <span className="text-xs font-bold bg-rose-50 text-rose-600 px-3 py-1 rounded-full border border-rose-100">
                        {prod.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-gray-900">{prod.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{prod.description}</p>
                    
                    <div className="text-xs font-medium text-emerald-700 bg-emerald-50 p-3 rounded-xl">
                      ✨ {prod.unlocksText}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-rose-50">
                    <span className="font-bold text-lg text-gray-900">
                      KES {prod.priceKes.toLocaleString()}
                    </span>
                    <button
                      onClick={() => {
                        setCheckoutProduct(prod);
                        setPaymentSuccessCode(null);
                      }}
                      className="min-h-[44px] bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                      aria-label={`Buy ${prod.name} for KES ${prod.priceKes} via M-Pesa`}
                    >
                      <span>Buy M-Pesa</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Care Pass Voucher Box */}
            <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-3">
              <h3 className="font-bold text-base text-gray-900">Have a Care Pass Code?</h3>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="e.g. TFL-CARE-948102"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value)}
                  aria-label="Enter your care pass code"
                  className="flex-1 border border-rose-200 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-rose-400 min-h-[48px]"
                />
                <button
                  onClick={() => {
                    if (voucherCodeInput.trim()) {
                      setIsVoucherUnlocked(true);
                      alert("🎉 Care Pass Verified! Opening counselor room.");
                      setActiveView("psychologist");
                    }
                  }}
                  className="min-h-[48px] bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COUNSELOR CHAT */}
        {activeView === "psychologist" && (
          <div className="space-y-7">
            <header>
              <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-[#21191d] sm:text-4xl">
                Talk with Dr. Amani
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6267] sm:text-base">
                A confidential space to speak openly and take the next step at your pace.
              </p>
            </header>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Left Counselor Profile Card */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  DA
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Dr. Amani W.</h3>
                  <p className="text-sm text-rose-600 font-medium">Licensed Clinical Psychologist</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-gray-600 border-t border-rose-50 pt-4">
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-xl font-medium">
                  <span>🛡️</span>
                  <span>100% Confidential &amp; Encrypted</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Dr. Amani provides compassionate listening, trauma-informed guidance, and coping tools for grief, anxiety, and relationship distress.
                </p>
              </div>

              <div className="bg-rose-50/70 p-4 rounded-xl space-y-1.5 text-sm">
                <span className="text-xs font-bold uppercase text-gray-400">Session Status</span>
                <div className="font-bold text-rose-700">
                  {isVoucherUnlocked ? "Care Pass Active ✓ (Unlimited)" : "Free Confidential First Session"}
                </div>
              </div>
            </div>

            {/* Center Chat Box */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden flex flex-col h-[600px]">
              {/* Header */}
              <div className="p-4 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
                  <span className="font-bold text-sm text-gray-900">Direct Consultation Room</span>
                </div>
                <span className="text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded-full font-bold">
                  {isVoucherUnlocked ? "Care Pass Active ✓" : "Free Session"}
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-4 bg-[#FFFDFE]" role="log" aria-label="Chat messages with Dr. Amani" aria-live="polite">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl leading-relaxed text-sm ${
                        msg.sender === "user"
                          ? "bg-rose-500 text-white rounded-br-none shadow-sm"
                          : "bg-rose-50 text-gray-800 rounded-bl-none border border-rose-100 shadow-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-xs text-gray-400 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="text-sm text-rose-500 bg-rose-50 px-4 py-2 rounded-full w-fit flex items-center gap-2" aria-label="Dr. Amani is typing">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-bounce [animation-delay:0.4s]"></span>
                    <span>Dr. Amani is typing...</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-rose-100 bg-white flex gap-3">
                <label htmlFor="chat-input" className="sr-only">Type your message</label>
                <input
                  id="chat-input"
                  type="text"
                  placeholder="Type your message confidentially..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 border border-rose-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-rose-400 min-h-[48px]"
                />
                <button
                  type="submit"
                  className="min-h-[48px] min-w-[48px] bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center justify-center active:scale-95 shadow-sm transition-all"
                  aria-label="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
            </div>
          </div>
        )}

        {/* TAB 4: SELF CARE & BREATHING */}
        {activeView === "wellness" && (
          <div className="space-y-7">
            <header>
              <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-[#21191d] sm:text-4xl">
                Take one gentle minute for yourself
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6d6267] sm:text-base">
                Choose a calming exercise or reach immediate support when things feel too heavy.
              </p>
            </header>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Card 1: 4-7-8 Breathing */}
            <div className="bg-white p-8 rounded-2xl border border-rose-100 shadow-sm text-center space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-5xl block" aria-hidden="true">🌬️</span>
                <h3 className="font-display font-bold text-xl text-gray-900">4-7-8 Deep Breathing</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Calm your nervous system in 2 minutes using rhythmic oxygen pacing.
                </p>
              </div>
              <button
                onClick={() => setShowBreathingModal(true)}
                className="w-full min-h-[48px] bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-xl text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
                aria-label="Start 4-7-8 breathing exercise"
              >
                <Wind className="w-5 h-5" />
                <span>Start Breathing Session</span>
              </button>
            </div>

            {/* Card 2: 5-4-3-2-1 Sensory Grounding */}
            <div className="bg-white p-8 rounded-2xl border border-rose-100 shadow-sm space-y-4">
              <span className="text-5xl block text-center" aria-hidden="true">🌿</span>
              <h3 className="font-display font-bold text-xl text-gray-900 text-center">5-4-3-2-1 Grounding</h3>
              <ul className="text-sm text-gray-600 space-y-2 bg-rose-50/50 p-4 rounded-xl border border-rose-100/60" role="list">
                <li><strong>5</strong> things you can see around you</li>
                <li><strong>4</strong> things you can physically touch</li>
                <li><strong>3</strong> things you can hear right now</li>
                <li><strong>2</strong> things you can smell</li>
                <li><strong>1</strong> thing you can taste or feel gratitude for</li>
              </ul>
            </div>

            {/* Card 3: Emergency Support */}
            <div className="bg-white p-8 rounded-2xl border border-rose-100 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3 text-center">
                <span className="text-5xl block" aria-hidden="true">❤️</span>
                <h3 className="font-display font-bold text-xl text-gray-900">Immediate Safe Haven</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  If thoughts ever become too heavy, remember you never have to carry them alone.
                </p>
              </div>
              <button
                onClick={() => setShowCrisisModal(true)}
                className="w-full min-h-[48px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-3 rounded-xl text-sm border border-rose-200 flex items-center justify-center gap-2 transition-all"
                aria-label="Open crisis helpline numbers"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Open Crisis Helplines</span>
              </button>
            </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL 1: SHARE STORY */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="share-story-title">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-rose-100">
              <h2 id="share-story-title" className="font-bold text-lg text-gray-900">Share Your Story</h2>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="min-h-[44px] min-w-[44px] rounded-full bg-rose-50 text-gray-500 flex items-center justify-center text-sm font-bold"
                aria-label="Close share story dialog"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label htmlFor="post-topic" className="text-sm font-bold text-gray-700 block mb-1.5">Choose Topic</label>
                <select
                  id="post-topic"
                  value={newPostRoom}
                  onChange={(e) => setNewPostRoom(e.target.value as Room)}
                  className="w-full border border-rose-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:border-rose-400 font-medium min-h-[48px]"
                >
                  <option value="anxiety">🌪️ Stress &amp; Anxiety</option>
                  <option value="relationships">💔 Relationships</option>
                  <option value="burnout">💼 Work &amp; Pressure</option>
                  <option value="grief">🕊️ Grief &amp; Loss</option>
                  <option value="wins">🌱 Small Wins</option>
                </select>
              </div>

              <div>
                <label htmlFor="post-content" className="text-sm font-bold text-gray-700 block mb-1.5">What is on your heart?</label>
                <textarea
                  id="post-content"
                  rows={4}
                  placeholder="Share freely without judgment..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full border border-rose-200 rounded-xl p-4 text-sm text-gray-800 focus:outline-none focus:border-rose-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 text-sm">
                <span className="text-gray-700 font-medium flex items-center gap-2">
                  <Mic className="w-5 h-5 text-rose-500" />
                  Voice Note
                </span>
                <button
                  type="button"
                  onClick={() => setHasVoiceAttached(!hasVoiceAttached)}
                  aria-label={hasVoiceAttached ? "Remove voice note" : "Add voice note"}
                  aria-pressed={hasVoiceAttached}
                  className={`min-h-[40px] px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    hasVoiceAttached
                      ? "bg-rose-500 text-white"
                      : "bg-white text-gray-700 border border-rose-200"
                  }`}
                >
                  {hasVoiceAttached ? "Attached (0:30) ✓" : "+ Add Voice"}
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] bg-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm active:scale-95"
                >
                  Post Anonymously
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 4-7-8 BREATHING */}
      {showBreathingModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="breathing-title">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 text-center space-y-5 border border-rose-100 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-rose-50">
              <span id="breathing-title" className="text-sm font-bold text-rose-500 uppercase tracking-wider">Take a Moment</span>
              <button
                onClick={() => setShowBreathingModal(false)}
                className="min-h-[44px] min-w-[44px] rounded-full bg-rose-50 text-gray-400 flex items-center justify-center text-sm font-bold"
                aria-label="Close breathing exercise"
              >
                ✕
              </button>
            </div>

            <div className="py-3 space-y-3">
              <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full border-4 border-rose-300 transition-all duration-1000 ${
                    breathPhase === "Breathe In"
                      ? "scale-110 bg-rose-100"
                      : breathPhase === "Hold"
                      ? "scale-105 bg-amber-50"
                      : "scale-90 bg-rose-50"
                  }`}
                  aria-hidden="true"
                />
                <div className="text-center relative z-10">
                  <span className="text-4xl font-extrabold text-gray-900 block">{breathCount}s</span>
                  <span className="text-sm font-bold text-rose-600">{breathPhase}</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Follow the circle. Breathe gently in and out.
              </p>
            </div>

            <button
              onClick={() => setShowBreathingModal(false)}
              className="w-full min-h-[48px] bg-rose-500 text-white font-bold py-3 rounded-xl text-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: CRISIS */}
      {showCrisisModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="crisis-title">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-rose-200 space-y-4 text-center">
            <span className="text-4xl" aria-hidden="true">❤️</span>
            <h2 id="crisis-title" className="font-display font-bold text-xl text-gray-900">You Are Loved.</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              If you are feeling overwhelmed, free compassionate help is available right now:
            </p>

            <div className="space-y-3 pt-1">
              <a
                href="tel:+254722178177"
                className="w-full bg-rose-600 text-white p-4 rounded-xl flex items-center justify-between font-bold text-sm shadow-sm min-h-[52px]"
                aria-label="Call Befrienders Kenya Helpline at +254 722 178 177"
              >
                <span>Befrienders Kenya Helpline</span>
                <span>+254 722 178 177</span>
              </a>

              <a
                href="tel:1199"
                className="w-full bg-gray-900 text-white p-4 rounded-xl flex items-center justify-between font-bold text-sm shadow-sm min-h-[52px]"
                aria-label="Call Kenya Red Cross Hotline at 1199"
              >
                <span>Kenya Red Cross Hotline</span>
                <span>1199</span>
              </a>
            </div>

            <button
              onClick={() => setShowCrisisModal(false)}
              className="text-sm text-gray-400 hover:underline pt-2 block mx-auto min-h-[44px]"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: M-PESA */}
      {checkoutProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn" role="dialog" aria-modal="true" aria-labelledby="mpesa-title">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-rose-50">
              <h2 id="mpesa-title" className="font-bold text-lg text-gray-900">M-Pesa Express</h2>
              <button
                onClick={() => setCheckoutProduct(null)}
                className="min-h-[44px] min-w-[44px] rounded-full bg-rose-50 text-gray-400 flex items-center justify-center text-sm font-bold"
                aria-label="Close M-Pesa checkout"
              >
                ✕
              </button>
            </div>

            {!paymentSuccessCode ? (
              <form onSubmit={handleSimulateMpesa} className="space-y-4">
                <div className="bg-rose-50/50 p-3 rounded-xl flex items-center gap-3">
                  <span className="text-3xl">{checkoutProduct.icon}</span>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{checkoutProduct.name}</h4>
                    <span className="font-bold text-sm text-rose-600">
                      KES {checkoutProduct.priceKes.toLocaleString()}
                    </span>
                  </div>
                </div>

                {checkoutProduct.sizes && (
                  <div>
                    <label htmlFor="size-select" className="text-sm font-bold text-gray-700 block mb-1.5">Select Size</label>
                    <div className="flex gap-2" id="size-select" role="radiogroup" aria-label="Select size">
                      {checkoutProduct.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          aria-pressed={selectedSize === s}
                          className={`min-h-[40px] min-w-[40px] px-3 py-2 rounded-lg text-sm font-bold border ${
                            selectedSize === s
                              ? "bg-rose-500 text-white border-rose-500"
                              : "bg-white text-gray-700 border-rose-100"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="customer-name" className="text-sm font-bold text-gray-700 block mb-1.5">Your Name</label>
                  <input
                    id="customer-name"
                    type="text"
                    placeholder="e.g. Faith"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full border border-rose-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-rose-400 min-h-[48px]"
                  />
                </div>

                <div>
                  <label htmlFor="mpesa-phone" className="text-sm font-bold text-gray-700 block mb-1.5">M-Pesa Phone Number</label>
                  <input
                    id="mpesa-phone"
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full border border-rose-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-rose-400 font-mono min-h-[48px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingMpesa}
                  className="w-full min-h-[48px] bg-[#22c55e] hover:bg-[#16a34a] text-white py-3 rounded-xl font-bold text-sm shadow-sm active:scale-95"
                >
                  {isProcessingMpesa ? `Prompting PIN (${mpesaCountdown}s)...` : `Pay KES ${checkoutProduct.priceKes.toLocaleString()} via M-Pesa`}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-2">
                <span className="text-4xl" aria-hidden="true">✓</span>
                <h4 className="font-bold text-lg text-gray-900">Payment Received!</h4>
                <div className="bg-rose-50 p-4 rounded-xl space-y-1.5">
                  <span className="text-xs text-rose-700 font-bold uppercase block">Your Care Pass</span>
                  <div className="font-mono text-xl font-bold text-rose-600">{paymentSuccessCode}</div>
                </div>
                <button
                  onClick={() => {
                    setVoucherCodeInput(paymentSuccessCode);
                    setIsVoucherUnlocked(true);
                    setCheckoutProduct(null);
                    setActiveView("psychologist");
                  }}
                  className="w-full min-h-[48px] bg-rose-500 text-white py-3 rounded-xl font-bold text-sm shadow-sm"
                >
                  Go to Counselor Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </AppShell>
  );
}
