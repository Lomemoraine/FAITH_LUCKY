"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  ShoppingBag,
  UserCheck,
  PhoneCall,
  AlertTriangle,
  Send,
  PlusCircle,
  ChevronRight,
  Mic,
  Wind,
  Smile,
} from "lucide-react";

type Room = "all" | "anxiety" | "relationships" | "burnout" | "grief" | "wins";
type Tab = "community" | "store" | "psychologist" | "wellness";

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
  const [activeTab, setActiveTab] = useState<Tab>("community");
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
    <div className="min-h-screen bg-[#FFF8F9] text-gray-800 antialiased selection:bg-rose-100 pb-20 md:pb-12">
      
      {/* 1. RESPONSIVE TOP HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100/70 shadow-[0_2px_10px_rgba(244,63,94,0.03)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 cursor-pointer shrink-0" onClick={() => setActiveTab("community")}>
            <Image
              src="/tfl-logo-transparent.png"
              alt="TFL Logo"
              width={38}
              height={38}
              className="object-contain"
              priority
            />
            <div>
              <h1 className="font-display font-bold text-lg text-gray-900 leading-tight">
                TFL <span className="text-rose-500 font-sans">SafeSpace</span>
              </h1>
              <p className="text-[10px] text-gray-400">Anonymous &bull; Free &bull; Safe Haven</p>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-rose-50/70 p-1 rounded-full border border-rose-100/80 text-xs font-semibold">
            {[
              { id: "community", label: "Stories", icon: MessageCircle },
              { id: "store", label: "Gifts & Merch", icon: ShoppingBag },
              { id: "psychologist", label: "Counselor", icon: UserCheck },
              { id: "wellness", label: "Self-Care", icon: Smile },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`py-1.5 px-3.5 rounded-full flex items-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-rose-500 text-white shadow-sm font-bold"
                      : "text-gray-600 hover:text-rose-600 hover:bg-white/80"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowBreathingModal(true)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Calm Down Breathing"
            >
              <Wind className="w-4 h-4 text-rose-500" />
              <span className="hidden sm:inline">Calm Down</span>
            </button>

            <button
              onClick={() => setShowNewPostModal(true)}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden max-w-2xl mx-auto px-4 flex justify-around border-t border-rose-50 text-xs font-medium">
          {[
            { id: "community", label: "Stories", icon: MessageCircle },
            { id: "store", label: "Gifts & Merch", icon: ShoppingBag },
            { id: "psychologist", label: "Counselor", icon: UserCheck },
            { id: "wellness", label: "Self-Care", icon: Smile },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`py-2.5 px-3 flex items-center gap-1.5 border-b-2 transition-all ${
                  isActive
                    ? "border-rose-500 text-rose-600 font-bold"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* 2. RESPONSIVE BALANCED MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5">

        {/* TAB 1: COMMUNITY FEED */}
        {activeTab === "community" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Sidebar Column (Channels, Anonymity & Daily Quote) */}
            <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20">
              {/* Topics Selection Box */}
              <div className="bg-white p-4 rounded-2xl border border-rose-100/80 shadow-sm space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-2">SafeSpace Rooms</h3>
                <div className="space-y-1">
                  {roomsList.map((room) => {
                    const count = room.id === "all" ? posts.length : posts.filter((p) => p.room === room.id).length;
                    const isSelected = selectedRoom === room.id;
                    return (
                      <button
                        key={room.id}
                        onClick={() => setSelectedRoom(room.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-rose-500 text-white font-bold shadow-sm"
                            : "text-gray-600 hover:bg-rose-50/60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{room.icon}</span>
                          <span>{room.label}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-500"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 100% Anonymity Promise */}
              <div className="bg-white p-4 rounded-2xl border border-rose-100/80 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                  <span>🛡️</span>
                  <span>100% Anonymous Haven</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Zero logs or identity tracking. Speak freely and be heard with warmth and total safety.
                </p>
              </div>

              {/* Gentle Daily Affirmation */}
              <div className="bg-gradient-to-br from-rose-50 to-pink-50/50 p-4 rounded-2xl border border-rose-100/60 text-center space-y-1.5">
                <span className="text-rose-500 text-sm">❝</span>
                <p className="text-xs italic text-gray-700 leading-relaxed font-serif">
                  You don&apos;t have to carry tomorrow&apos;s burdens today. Take it one breath at a time.
                </p>
              </div>
            </aside>

            {/* Center Main Feed Column */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Mobile Friendly Topic Pills */}
              <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-medium">
                {roomsList.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                      selectedRoom === room.id
                        ? "bg-rose-500 text-white font-bold shadow-sm"
                        : "bg-white text-gray-600 border border-rose-100 hover:bg-rose-50/50"
                    }`}
                  >
                    {room.icon} {room.label}
                  </button>
                ))}
              </div>

              {/* Composer Card */}
              <div
                onClick={() => setShowNewPostModal(true)}
                className="bg-white p-4 rounded-2xl border border-rose-100/80 shadow-sm cursor-pointer hover:border-rose-300 transition-all flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-base shrink-0">
                  🌸
                </div>
                <div className="flex-1 text-xs sm:text-sm text-gray-400">
                  How is your heart feeling today? Tap to share freely...
                </div>
                <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                  Post
                </span>
              </div>

              {/* Posts Stream */}
              <div className="space-y-3.5">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white p-5 rounded-2xl border border-rose-100/70 shadow-sm space-y-3 transition-all hover:border-rose-200"
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center font-bold text-xs">
                          {post.authorHandle.substring(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900">{post.authorHandle}</span>
                            <span className="text-[10px] text-gray-400">&bull; {post.timeAgo}</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[11px] font-medium text-rose-500 bg-rose-50 px-2.5 py-0.5 rounded-full">
                        {post.roomLabel}
                      </span>
                    </div>

                    {/* Body Text */}
                    <p className="text-gray-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Voice Note */}
                    {post.hasVoiceNote && (
                      <div className="bg-rose-50/50 border border-rose-100 p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleVoice(post.id)}
                            className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-sm"
                          >
                            {isPlayingVoice === post.id ? "⏸" : "▶"}
                          </button>
                          <div>
                            <span className="font-bold text-gray-800 text-xs block">Voice Story</span>
                            <span className="text-[10px] text-gray-400">{post.voiceDuration}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 h-3">
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
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs text-rose-900">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Counselor alert: We are here to support you.</span>
                        </div>
                        <button
                          onClick={() => setActiveTab("psychologist")}
                          className="bg-rose-600 text-white px-3 py-1 rounded-lg font-bold text-xs shrink-0"
                        >
                          Talk to Counselor
                        </button>
                      </div>
                    )}

                    {/* Reaction & Reply Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-rose-50 text-xs text-gray-500">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                          post.hasLiked
                            ? "bg-rose-50 text-rose-600 font-bold"
                            : "hover:bg-rose-50 text-gray-500"
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${post.hasLiked ? "fill-rose-500 text-rose-500" : ""}`} />
                        <span>{post.empathyCount} I hear you</span>
                      </button>

                      <div className="flex items-center gap-1 text-gray-400">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.replies.length} replies</span>
                      </div>
                    </div>

                    {/* Replies List */}
                    {post.replies.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {post.replies.map((rep) => (
                          <div
                            key={rep.id}
                            className="bg-rose-50/40 p-2.5 rounded-xl text-xs space-y-0.5 border-l-2 border-rose-300"
                          >
                            <div className="flex justify-between font-bold text-gray-800 text-[11px]">
                              <span>{rep.authorHandle}</span>
                              <span className="text-[10px] text-gray-400 font-normal">{rep.time}</span>
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

            {/* Right Sidebar Column (Helplines, Calm Breathing & Shop to Heal) */}
            <aside className="hidden lg:block lg:col-span-3 space-y-4 sticky top-20">
              {/* 24/7 Crisis Support Card */}
              <div className="bg-white p-4 rounded-2xl border border-rose-100/80 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-rose-600 font-bold text-xs">
                  <PhoneCall className="w-4 h-4" />
                  <span>24/7 Crisis Helplines</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Free, confidential professional care across Kenya whenever you need it.
                </p>
                <div className="space-y-2 pt-1">
                  <a
                    href="tel:+254722178177"
                    className="block p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition-all text-xs font-semibold text-rose-700"
                  >
                    <div className="text-[10px] text-gray-500 font-normal">Befrienders Kenya</div>
                    <div className="font-mono font-bold">+254 722 178 177</div>
                  </a>
                  <a
                    href="tel:1199"
                    className="block p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all text-xs font-semibold text-gray-800"
                  >
                    <div className="text-[10px] text-gray-500 font-normal">Kenya Red Cross</div>
                    <div className="font-mono font-bold">1199</div>
                  </a>
                </div>
              </div>

              {/* Quick Breathing Calm Tool */}
              <div className="bg-gradient-to-br from-rose-500 to-pink-600 text-white p-4 rounded-2xl shadow-sm space-y-2 text-center">
                <span className="text-2xl block">🌬️</span>
                <h4 className="font-bold text-xs">Feeling Overwhelmed?</h4>
                <p className="text-[11px] text-rose-100 leading-relaxed">
                  Try the 4-7-8 rhythm to slow your racing thoughts.
                </p>
                <button
                  onClick={() => setShowBreathingModal(true)}
                  className="w-full bg-white text-rose-600 hover:bg-rose-50 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                >
                  Start Breathing
                </button>
              </div>

              {/* Merch Support Impact */}
              <div className="bg-white p-4 rounded-2xl border border-rose-100/80 shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                  <ShoppingBag className="w-3.5 h-3.5 text-rose-500" />
                  <span>Shop To Heal</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Every TFL gift purchased directly unlocks a free mental wellness care pass for someone in need.
                </p>
                <button
                  onClick={() => setActiveTab("store")}
                  className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 pt-1"
                >
                  <span>View Merch &amp; Gifts</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </aside>

          </div>
        )}

        {/* TAB 2: GIFTS & MERCH */}
        {activeTab === "store" && (
          <div className="space-y-6">
            
            {/* Clean Gentle Banner */}
            <div className="bg-gradient-to-br from-rose-500 to-pink-500 text-white p-6 sm:p-8 rounded-3xl shadow-sm space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full inline-block">
                Shop To Heal
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl">TFL Gifts &amp; Merchandise</h2>
              <p className="text-xs sm:text-sm text-rose-100 max-w-2xl leading-relaxed">
                Every purchase automatically unlocks a <strong>Free SafeSpace Care Pass</strong> for private counselor sessions for yourself or someone in need.
              </p>
            </div>

            {/* Responsive Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between space-y-3 hover:border-rose-300 transition-all hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-3xl">{prod.icon}</span>
                      <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">
                        {prod.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-gray-900">{prod.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{prod.description}</p>
                    
                    <div className="text-[11px] font-medium text-emerald-700 bg-emerald-50 p-2 rounded-xl">
                      ✨ {prod.unlocksText}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-rose-50">
                    <span className="font-bold text-base text-gray-900">
                      KES {prod.priceKes.toLocaleString()}
                    </span>
                    <button
                      onClick={() => {
                        setCheckoutProduct(prod);
                        setPaymentSuccessCode(null);
                      }}
                      className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-sm transition-all"
                    >
                      <span>Buy M-Pesa</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Care Pass Voucher Box */}
            <div className="max-w-xl mx-auto bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-2">
              <h4 className="font-bold text-xs sm:text-sm text-gray-900">Have a Care Pass Code?</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. TFL-CARE-948102"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value)}
                  className="flex-1 border border-rose-200 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-rose-400"
                />
                <button
                  onClick={() => {
                    if (voucherCodeInput.trim()) {
                      setIsVoucherUnlocked(true);
                      alert("🎉 Care Pass Verified! Opening counselor room.");
                      setActiveTab("psychologist");
                    }
                  }}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-5 py-2 rounded-xl transition-all"
                >
                  Unlock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COUNSELOR CHAT */}
        {activeTab === "psychologist" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Counselor Profile Card */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-rose-100 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-400 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  DA
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Dr. Amani W.</h3>
                  <p className="text-xs text-rose-600 font-medium">Licensed Clinical Psychologist</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600 border-t border-rose-50 pt-3">
                <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-2.5 rounded-xl font-medium">
                  <span>🛡️</span>
                  <span>100% Confidential &amp; End-to-End Encrypted</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Dr. Amani provides compassionate listening, trauma-informed guidance, and coping tools for grief, anxiety, and relationship distress.
                </p>
              </div>

              <div className="bg-rose-50/70 p-3 rounded-xl space-y-1 text-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400">Session Status</span>
                <div className="font-bold text-rose-700">
                  {isVoucherUnlocked ? "Care Pass Active ✓ (Unlimited)" : "Free Confidential First Session"}
                </div>
              </div>
            </div>

            {/* Center Chat Box */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden flex flex-col h-[560px]">
              {/* Header */}
              <div className="p-3.5 border-b border-rose-100 bg-rose-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-xs text-gray-900">Direct Consultation Room</span>
                </div>
                <span className="text-[10px] bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full font-bold">
                  {isVoucherUnlocked ? "Care Pass Active ✓" : "Free Session"}
                </span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-[#FFFDFE] text-xs sm:text-sm">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                        msg.sender === "user"
                          ? "bg-rose-500 text-white rounded-br-none shadow-sm"
                          : "bg-rose-50 text-gray-800 rounded-bl-none border border-rose-100 shadow-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="text-xs text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full w-fit flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-bounce [animation-delay:0.4s]"></span>
                    <span>Dr. Amani is typing...</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-rose-100 bg-white flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message confidentially..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 border border-rose-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-rose-400"
                />
                <button
                  type="submit"
                  className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center active:scale-95 shadow-sm transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 4: SELF CARE & BREATHING */}
        {activeTab === "wellness" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1: 4-7-8 Breathing */}
            <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm text-center space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-4xl block">🌬️</span>
                <h3 className="font-display font-bold text-lg text-gray-900">4-7-8 Deep Breathing</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Calm your nervous system in 2 minutes using rhythmic oxygen pacing.
                </p>
              </div>
              <button
                onClick={() => setShowBreathingModal(true)}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <Wind className="w-4 h-4" />
                <span>Start Breathing Session</span>
              </button>
            </div>

            {/* Card 2: 5-4-3-2-1 Sensory Grounding */}
            <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-3">
              <span className="text-4xl block text-center">🌿</span>
              <h3 className="font-display font-bold text-lg text-gray-900 text-center">5-4-3-2-1 Grounding</h3>
              <ul className="text-xs text-gray-600 space-y-1.5 bg-rose-50/50 p-3 rounded-xl border border-rose-100/60">
                <li><strong>5</strong> things you can see around you</li>
                <li><strong>4</strong> things you can physically touch</li>
                <li><strong>3</strong> things you can hear right now</li>
                <li><strong>2</strong> things you can smell</li>
                <li><strong>1</strong> thing you can taste or feel gratitude for</li>
              </ul>
            </div>

            {/* Card 3: Emergency Support */}
            <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm space-y-3 flex flex-col justify-between">
              <div className="space-y-2 text-center">
                <span className="text-4xl block">❤️</span>
                <h3 className="font-display font-bold text-lg text-gray-900">Immediate Safe Haven</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  If thoughts ever become too heavy, remember you never have to carry them alone.
                </p>
              </div>
              <button
                onClick={() => setShowCrisisModal(true)}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 rounded-xl text-xs border border-rose-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Open Crisis Helplines</span>
              </button>
            </div>
          </div>
        )}

        {/* SUBTLE FOOTER HELPLINE LINK */}
        <div className="text-center pt-6 pb-2">
          <button
            onClick={() => setShowCrisisModal(true)}
            className="text-xs text-rose-500 hover:underline font-medium inline-flex items-center gap-1"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Need urgent help? Free 24/7 Kenya Crisis Hotline</span>
          </button>
        </div>

      </main>

      {/* MODAL 1: SHARE STORY */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-rose-100 space-y-3.5">
            <div className="flex justify-between items-center pb-2 border-b border-rose-100">
              <h3 className="font-bold text-sm text-gray-900">Share Your Story</h3>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="w-7 h-7 rounded-full bg-rose-50 text-gray-500 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Choose Topic</label>
                <select
                  value={newPostRoom}
                  onChange={(e) => setNewPostRoom(e.target.value as Room)}
                  className="w-full border border-rose-200 rounded-xl p-2 text-xs text-gray-800 focus:outline-none focus:border-rose-400 font-medium"
                >
                  <option value="anxiety">🌪️ Stress &amp; Anxiety</option>
                  <option value="relationships">💔 Relationships</option>
                  <option value="burnout">💼 Work &amp; Pressure</option>
                  <option value="grief">🕊️ Grief &amp; Loss</option>
                  <option value="wins">🌱 Small Wins</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">What is on your heart?</label>
                <textarea
                  rows={4}
                  placeholder="Share freely without judgment..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full border border-rose-200 rounded-xl p-3 text-xs text-gray-800 focus:outline-none focus:border-rose-400 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 text-xs">
                <span className="text-gray-700 font-medium flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-rose-500" />
                  Voice Note
                </span>
                <button
                  type="button"
                  onClick={() => setHasVoiceAttached(!hasVoiceAttached)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    hasVoiceAttached
                      ? "bg-rose-500 text-white"
                      : "bg-white text-gray-700 border border-rose-200"
                  }`}
                >
                  {hasVoiceAttached ? "Attached (0:30) ✓" : "+ Add Voice"}
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-rose-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-xs rounded-3xl p-5 text-center space-y-4 border border-rose-100 shadow-2xl">
            <div className="flex justify-between items-center pb-1 border-b border-rose-50">
              <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Take a Moment</span>
              <button
                onClick={() => setShowBreathingModal(false)}
                className="w-6 h-6 rounded-full bg-rose-50 text-gray-400 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-2 space-y-2">
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full border-4 border-rose-300 transition-all duration-1000 ${
                    breathPhase === "Breathe In"
                      ? "scale-110 bg-rose-100"
                      : breathPhase === "Hold"
                      ? "scale-105 bg-amber-50"
                      : "scale-90 bg-rose-50"
                  }`}
                />
                <div className="text-center relative z-10">
                  <span className="text-3xl font-extrabold text-gray-900 block">{breathCount}s</span>
                  <span className="text-xs font-bold text-rose-600">{breathPhase}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Follow the circle. Breathe gently in and out.
              </p>
            </div>

            <button
              onClick={() => setShowBreathingModal(false)}
              className="w-full bg-rose-500 text-white font-bold py-2 rounded-xl text-xs"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: CRISIS */}
      {showCrisisModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-rose-200 space-y-3 text-center">
            <span className="text-3xl">❤️</span>
            <h3 className="font-display font-bold text-base text-gray-900">You Are Loved.</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              If you are feeling overwhelmed, free compassionate help is available right now:
            </p>

            <div className="space-y-2 pt-1">
              <a
                href="tel:+254722178177"
                className="w-full bg-rose-600 text-white p-3 rounded-xl flex items-center justify-between font-bold text-xs shadow-sm"
              >
                <span>Befrienders Kenya Helpline</span>
                <span>+254 722 178 177</span>
              </a>

              <a
                href="tel:1199"
                className="w-full bg-gray-900 text-white p-3 rounded-xl flex items-center justify-between font-bold text-xs shadow-sm"
              >
                <span>Kenya Red Cross Hotline</span>
                <span>1199</span>
              </a>
            </div>

            <button
              onClick={() => setShowCrisisModal(false)}
              className="text-xs text-gray-400 hover:underline pt-2 block mx-auto"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: M-PESA */}
      {checkoutProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-rose-100 space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-rose-50">
              <h3 className="font-bold text-sm text-gray-900">M-Pesa Express</h3>
              <button
                onClick={() => setCheckoutProduct(null)}
                className="w-6 h-6 rounded-full bg-rose-50 text-gray-400 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {!paymentSuccessCode ? (
              <form onSubmit={handleSimulateMpesa} className="space-y-3">
                <div className="bg-rose-50/50 p-2.5 rounded-xl flex items-center gap-2.5">
                  <span className="text-2xl">{checkoutProduct.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">{checkoutProduct.name}</h4>
                    <span className="font-bold text-xs text-rose-600">
                      KES {checkoutProduct.priceKes.toLocaleString()}
                    </span>
                  </div>
                </div>

                {checkoutProduct.sizes && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Select Size</label>
                    <div className="flex gap-1">
                      {checkoutProduct.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
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
                  <label className="text-xs font-bold text-gray-700 block mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Faith"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full border border-rose-200 rounded-xl p-2 text-xs text-gray-800 focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">M-Pesa Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full border border-rose-200 rounded-xl p-2 text-xs text-gray-800 focus:outline-none focus:border-rose-400 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessingMpesa}
                  className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white py-2.5 rounded-xl font-bold text-xs shadow-sm active:scale-95"
                >
                  {isProcessingMpesa ? `Prompting PIN (${mpesaCountdown}s)...` : `Pay KES ${checkoutProduct.priceKes.toLocaleString()} via M-Pesa`}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-3 py-1">
                <span className="text-3xl">✓</span>
                <h4 className="font-bold text-sm text-gray-900">Payment Received!</h4>
                <div className="bg-rose-50 p-3 rounded-xl space-y-1">
                  <span className="text-[10px] text-rose-700 font-bold uppercase block">Your Care Pass</span>
                  <div className="font-mono text-lg font-bold text-rose-600">{paymentSuccessCode}</div>
                </div>
                <button
                  onClick={() => {
                    setVoucherCodeInput(paymentSuccessCode);
                    setIsVoucherUnlocked(true);
                    setCheckoutProduct(null);
                    setActiveTab("psychologist");
                  }}
                  className="w-full bg-rose-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-sm"
                >
                  Go to Counselor Chat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
