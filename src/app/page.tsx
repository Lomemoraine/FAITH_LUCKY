"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Heart,
  MessageCircle,
  Shield,
  ShoppingBag,
  UserCheck,
  Sparkles,
  PhoneCall,
  AlertTriangle,
  Send,
  Lock,
  Filter,
  PlusCircle,
  KeyRound,
  ChevronRight,
  Award,
  Mic,
  Check,
  Copy,
  Smile,
  Frown,
  Meh,
  Sun,
  Flame,
} from "lucide-react";

// Types
type Room = "all" | "anxiety" | "burnout" | "relationships" | "grief" | "wins";
type Tab = "community" | "store" | "psychologist" | "admin";
type Mood = "calm" | "overwhelmed" | "hurting" | "hopeful" | "numb";

interface Post {
  id: string;
  authorHandle: string;
  avatarColor: string;
  room: Room;
  content: string;
  hasVoiceNote?: boolean;
  voiceDuration?: string;
  empathyCount: number;
  hugCount: number;
  insightCount: number;
  prayerCount: number;
  userReacted?: string;
  replies: { id: string; authorHandle: string; avatarColor: string; content: string; time: string }[];
  isFlagged: boolean;
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
  imageBg: string;
  inStock: number;
}

export default function SafeSpaceApp() {
  const [activeTab, setActiveTab] = useState<Tab>("community");
  const [selectedRoom, setSelectedRoom] = useState<Room>("all");
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostRoom, setNewPostRoom] = useState<Room>("anxiety");
  const [hasVoiceAttached, setHasVoiceAttached] = useState(false);
  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [isVoucherUnlocked, setIsVoucherUnlocked] = useState(false);
  const [copiedVoucher, setCopiedVoucher] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState<string>("SilentOtter42");
  const [chatMessage, setChatMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState<string | null>(null);

  // Store Checkout State
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentSuccessCode, setPaymentSuccessCode] = useState<string | null>(null);
  const [isProcessingMpesa, setIsProcessingMpesa] = useState(false);
  const [mpesaCountdown, setMpesaCountdown] = useState(0);

  // Mock Products with high-end imagery styling
  const products: Product[] = [
    {
      id: "prod-1",
      name: "TFL 'SafeSpace' Signature 24K Gold Hoodie",
      priceKes: 2800,
      originalPriceKes: 3500,
      description: "Ultra-heavyweight 400GSM fleece hoodie featuring high-density metallic gold embroidery of the TFL monogram.",
      badge: "Best Seller • Care Pass Included",
      unlocksText: "Unlocks 1 Free Confidential 1-on-1 Session with a Licensed Psychologist",
      icon: "🧥",
      imageBg: "from-amber-950/80 via-slate-900 to-black",
      inStock: 18,
    },
    {
      id: "prod-2",
      name: "TFL Mental Wellness & CBT Guided Journal",
      priceKes: 1200,
      originalPriceKes: 1600,
      description: "Hardcover gold-embossed journal with 180 guided pages for mood tracking, cognitive reframing, and gratitude.",
      badge: "Therapist Recommended",
      unlocksText: "Unlocks 1 Private Mental Health Screening & Priority Triage",
      icon: "📔",
      imageBg: "from-slate-900 via-amber-950/40 to-slate-900",
      inStock: 34,
    },
    {
      id: "prod-3",
      name: "TFL 'Talk Freely' Heavyweight Oversized Tee",
      priceKes: 1500,
      originalPriceKes: 2000,
      description: "100% Organic combed cotton tee with soft-touch puff typography: 'Talk freely. While heard freely.'",
      badge: "Community Favorite",
      unlocksText: "Unlocks 1 Month Access to Psychologist Audio Wellness Rooms",
      icon: "👕",
      imageBg: "from-slate-900 via-slate-800 to-amber-950/50",
      inStock: 25,
    },
    {
      id: "prod-4",
      name: "TFL 'Heard Freely' Braided Steel Bracelet",
      priceKes: 650,
      originalPriceKes: 900,
      description: "Handcrafted surgical stainless steel bar on waterproof braided cord. A personal anchor of resilience.",
      badge: "Solidarity Edition",
      unlocksText: "Unlocks Verified SafeSpace Supporter Status",
      icon: "✨",
      imageBg: "from-amber-950/60 via-slate-900 to-slate-950",
      inStock: 50,
    },
  ];

  // Initial Posts with Rich Avatars & Voice Notes
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "post-1",
      authorHandle: "GoldenWillow42",
      avatarColor: "from-amber-500 to-yellow-300",
      room: "anxiety",
      content:
        "Ever feel like you are doing everything right on paper, but inside your chest is constantly tight with worry? Work pressure has been overwhelming this week and pretending to be okay is exhausting.",
      hasVoiceNote: true,
      voiceDuration: "0:42",
      empathyCount: 24,
      hugCount: 19,
      insightCount: 8,
      prayerCount: 11,
      replies: [
        {
          id: "rep-1",
          authorHandle: "BraveHorizon9",
          avatarColor: "from-emerald-500 to-teal-300",
          content: "You are not alone in this feeling. I felt exactly this on Tuesday. Give yourself permission to pause for 5 minutes right now. You are doing enough. 🫂",
          time: "20m ago",
        },
        {
          id: "rep-2",
          authorHandle: "QuietRiver88",
          avatarColor: "from-sky-500 to-indigo-300",
          content: "Take a deep breath and drink some cold water. Tomorrow is a fresh start.",
          time: "10m ago",
        },
      ],
      isFlagged: false,
      timeAgo: "45 mins ago",
    },
    {
      id: "post-2",
      authorHandle: "SilentOak77",
      avatarColor: "from-purple-500 to-pink-300",
      room: "wins",
      content:
        "Small win: Finally got out of bed before noon, made myself a cup of tea, and opened the window for fresh sunlight. It sounds small to most people, but for me, this was a mountain. 🌱",
      empathyCount: 52,
      hugCount: 38,
      insightCount: 21,
      prayerCount: 17,
      replies: [
        {
          id: "rep-3",
          authorHandle: "GentleDawn3",
          avatarColor: "from-rose-500 to-amber-300",
          content: "That is HUGE! Be super proud of yourself today! ❤️",
          time: "1 hour ago",
        },
      ],
      isFlagged: false,
      timeAgo: "2 hours ago",
    },
    {
      id: "post-3",
      authorHandle: "QuietRiver17",
      avatarColor: "from-rose-600 to-red-400",
      room: "burnout",
      content:
        "I feel completely empty and exhausted. Carrying this family burden alone while failing at my job is making me feel totally helpless. Sometimes I just want everything to stop.",
      empathyCount: 15,
      hugCount: 29,
      insightCount: 3,
      prayerCount: 24,
      replies: [],
      isFlagged: true,
      timeAgo: "3 hours ago",
    },
  ]);

  // Chat Conversation Log
  const [chatLog, setChatLog] = useState<{ sender: "user" | "therapist"; text: string; time: string }[]>([
    {
      sender: "therapist",
      text: "Hello! I am Dr. Amani W., a licensed clinical counselor at TFL SafeSpace. Everything you share here is 100% confidential and anonymous. How is your heart doing today?",
      time: "10:30 AM",
    },
  ]);

  // Simulated Voice Note Player
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

  // Handle Post Creation with Crisis Detection
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    // Crisis keywords check
    const crisisTriggers = ["give up", "end it", "hurt myself", "hopeless", "can't go on", "die", "suicide", "end my life", "stop everything"];
    const hasCrisisIntent = crisisTriggers.some((trigger) =>
      newPostContent.toLowerCase().includes(trigger)
    );

    const randomAvatars = [
      "from-amber-500 to-yellow-300",
      "from-emerald-500 to-teal-300",
      "from-sky-500 to-indigo-300",
      "from-purple-500 to-pink-300",
      "from-rose-500 to-amber-300",
    ];

    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorHandle: `HopeSeeker${Math.floor(100 + Math.random() * 900)}`,
      avatarColor: randomAvatars[Math.floor(Math.random() * randomAvatars.length)],
      room: newPostRoom,
      content: newPostContent,
      hasVoiceNote: hasVoiceAttached,
      voiceDuration: hasVoiceAttached ? "0:30" : undefined,
      empathyCount: 1,
      hugCount: 1,
      insightCount: 0,
      prayerCount: 1,
      replies: [],
      isFlagged: hasCrisisIntent,
      timeAgo: "Just now",
    };

    setPosts([newPost, ...posts]);
    setNewPostContent("");
    setHasVoiceAttached(false);
    setShowNewPostModal(false);

    if (hasCrisisIntent) {
      setShowCrisisModal(true);
    }
  };

  // Handle M-Pesa Simulated STK Push
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

  // Handle Send Chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = { sender: "user" as const, text: chatMessage, time: "Just now" };
    setChatLog((prev) => [...prev, userMsg]);
    setChatMessage("");
    setIsTyping(true);

    // Simulate Psychologist reply
    setTimeout(() => {
      setIsTyping(false);
      setChatLog((prev) => [
        ...prev,
        {
          sender: "therapist" as const,
          text: "Thank you for trusting me with that. When emotions feel overwhelming, naming them is the first step toward relief. What has been the heaviest part of this for you?",
          time: "Just now",
        },
      ]);
    }, 1800);
  };

  const filteredPosts =
    selectedRoom === "all" ? posts : posts.filter((p) => p.room === selectedRoom);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 selection:bg-amber-500 selection:text-black antialiased relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-[30rem] h-[30rem] bg-yellow-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-72 h-72 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Top Telemetry & Safety Bar */}
      <div className="bg-[#080B11]/90 border-b border-amber-500/10 backdrop-blur-md text-[11px] py-1.5 px-4 text-slate-400">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>384 Anonymous Members Online</span>
            </span>
            <span className="hidden sm:inline text-slate-600">&bull;</span>
            <span className="hidden sm:inline text-slate-400">End-to-End Encrypted &bull; No Names Recorded</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCrisisModal(true)}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold transition-colors"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Emergency SOS</span>
            </button>
            <span className="text-slate-600">&bull;</span>
            <span className="text-amber-400/90 font-mono">Kenya 24/7 Helpline: 1199</span>
          </div>
        </div>
      </div>

      {/* Primary Brand Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0E1420]/90 backdrop-blur-xl border-b border-amber-500/20 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-b from-amber-400/20 via-slate-900 to-black p-0.5 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src="/tfl-logo.jpeg"
                alt="TFL Logo"
                width={40}
                height={40}
                className="object-contain filter drop-shadow"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-xl sm:text-2xl tracking-tight text-white flex items-center gap-1.5">
                  I&apos;m TFL <span className="text-gold-gradient font-sans">SafeSpace</span>
                </h1>
                <span className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border border-amber-500/40 tracking-wider">
                  Anonymous Sanctuary
                </span>
              </div>
              <p className="text-xs text-amber-200/70 italic font-serif hidden sm:block">
                &ldquo;Talk freely. While heard freely. Stay anonymous.&rdquo;
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowNewPostModal(true)}
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold px-3.5 sm:px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Share Anonymously</span>
              <span className="sm:hidden">Share</span>
            </button>

            <button
              onClick={() => setShowCrisisModal(true)}
              className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden md:inline">Crisis Support</span>
            </button>
          </div>
        </div>

        {/* Dynamic Tab Switcher */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 sm:gap-2 overflow-x-auto text-xs font-semibold border-t border-slate-800/80 scrollbar-none">
          {[
            { id: "community", label: "💬 SafeSpace Feed", icon: MessageCircle },
            { id: "store", label: "🛍️ TFL Merch & Care Pass", icon: ShoppingBag },
            { id: "psychologist", label: "🩺 Psychologist Desk", icon: UserCheck },
            { id: "admin", label: "🛡️ Admin Command", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`py-3 px-3 sm:px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-amber-400 text-amber-300 bg-amber-500/10 font-bold shadow-inner"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 space-y-6">

        {/* Daily Mood & Emotional Check-in Bar */}
        <section className="glass-panel rounded-2xl p-4 sm:p-5 border border-amber-500/20 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-slate-100">Daily Heart Check-in</h2>
              </div>
              <p className="text-xs text-slate-400">
                How is your spirit feeling today? Tap a mood to filter conversations that resonate with you:
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {[
                { id: "calm", label: "🌿 Calmer", icon: Smile, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
                { id: "overwhelmed", label: "🌪️ Overwhelmed", icon: Flame, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
                { id: "hurting", label: "💔 Hurting", icon: Frown, color: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
                { id: "hopeful", label: "☀️ Hopeful", icon: Sun, color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
                { id: "numb", label: "🌫️ Heavy", icon: Meh, color: "text-slate-400 bg-slate-800 border-slate-700" },
              ].map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(selectedMood === mood.id ? null : (mood.id as Mood))}
                  className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                    selectedMood === mood.id
                      ? "ring-2 ring-amber-400 bg-amber-500/20 text-white font-bold"
                      : `${mood.color} hover:opacity-90`
                  }`}
                >
                  <span>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 1. COMMUNITY FEED TAB */}
        {activeTab === "community" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Sidebar: Topic Channels & Security Badge */}
            <div className="space-y-4 lg:col-span-1">
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    <span>SafeSpace Channels</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">{posts.length} Active</span>
                </div>

                <div className="flex flex-col gap-1 text-xs font-medium">
                  {[
                    { id: "all", label: "🌟 All Conversations", count: posts.length },
                    { id: "anxiety", label: "🌪️ Anxiety & Overwhelm", count: 1 },
                    { id: "burnout", label: "💼 Work & Life Burnout", count: 1 },
                    { id: "relationships", label: "💔 Relationships", count: 0 },
                    { id: "grief", label: "🕊️ Grief & Healing", count: 0 },
                    { id: "wins", label: "🌱 Daily Wins & Hope", count: 1 },
                  ].map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoom(room.id as Room)}
                      className={`text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                        selectedRoom === room.id
                          ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-yellow-300 font-bold border-l-4 border-amber-400 shadow-sm"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                      }`}
                    >
                      <span>{room.label}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                        {room.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Anonymity Pledge Card */}
              <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 space-y-2.5 bg-gradient-to-b from-slate-900 via-[#0E1524] to-black">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>100% Anonymity Promise</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  You are identified only by an auto-generated pseudonym. No real name, email, or phone number is ever exposed to anyone.
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                  <span>SSL 256-bit Encrypted</span>
                  <span className="text-emerald-400 font-semibold">Zero-Log Policy</span>
                </div>
              </div>
            </div>

            {/* Middle & Right Column: Interactive Post Feed */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="font-bold text-slate-100 text-base flex items-center gap-2">
                    <span>{selectedRoom === "all" ? "SafeSpace Sanctuary Feed" : `Channel: ${selectedRoom}`}</span>
                    <span className="text-xs text-amber-400 font-normal bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Live Stream
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => setShowNewPostModal(true)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Write Post</span>
                </button>
              </div>

              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className={`glass-panel rounded-2xl p-5 border space-y-4 transition-all ${
                    post.isFlagged
                      ? "border-rose-500/40 bg-gradient-to-b from-rose-950/20 to-slate-900"
                      : "border-slate-800/80 hover:border-amber-500/30"
                  }`}
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${post.avatarColor} p-0.5 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md`}
                      >
                        {post.authorHandle.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">{post.authorHandle}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                            Anonymous
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">{post.timeAgo}</span>
                      </div>
                    </div>

                    <span className="text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2.5 py-0.5 rounded-full capitalize">
                      #{post.room}
                    </span>
                  </div>

                  {/* Post Body */}
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-normal">
                    {post.content}
                  </p>

                  {/* Voice Note Simulation */}
                  {post.hasVoiceNote && (
                    <div className="bg-slate-800/80 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggleVoice(post.id)}
                          className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md transition-transform active:scale-95"
                        >
                          {isPlayingVoice === post.id ? "⏸" : "▶"}
                        </button>
                        <div>
                          <span className="font-bold text-slate-200 block text-[11px]">
                            {isPlayingVoice === post.id ? "Playing Voice Confession..." : "Anonymous Voice Note"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Duration: {post.voiceDuration}
                          </span>
                        </div>
                      </div>

                      {/* Sound Waveform Animation */}
                      <div className="flex items-center gap-0.5 h-4">
                        {[40, 70, 30, 90, 50, 80, 60, 100, 40, 70, 85, 30, 60].map((h, i) => (
                          <div
                            key={i}
                            style={{ height: `${h}%` }}
                            className={`w-1 rounded-full transition-all duration-300 ${
                              isPlayingVoice === post.id ? "bg-amber-400 animate-pulse" : "bg-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Crisis Triage Alert for High Distress Posts */}
                  {post.isFlagged && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-rose-300">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>High-distress sentiment detected. SafeSpace counselor triage notified.</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab("psychologist");
                          setActiveChatUser(post.authorHandle);
                        }}
                        className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap transition-all"
                      >
                        Open Therapist Desk ➔
                      </button>
                    </div>
                  )}

                  {/* Empathetic Reaction Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id ? { ...p, empathyCount: p.empathyCount + 1 } : p
                            )
                          );
                        }}
                        className="flex items-center gap-1.5 bg-slate-800/60 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700/50 px-2.5 py-1 rounded-lg transition-all active:scale-95"
                      >
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        <span>{post.empathyCount} Empathy</span>
                      </button>

                      <button
                        onClick={() => {
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id ? { ...p, hugCount: p.hugCount + 1 } : p
                            )
                          );
                        }}
                        className="flex items-center gap-1.5 bg-slate-800/60 hover:bg-amber-500/10 hover:text-amber-400 border border-slate-700/50 px-2.5 py-1 rounded-lg transition-all active:scale-95"
                      >
                        <span>🫂 {post.hugCount} Hugs</span>
                      </button>

                      <button
                        onClick={() => {
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id ? { ...p, insightCount: p.insightCount + 1 } : p
                            )
                          );
                        }}
                        className="flex items-center gap-1.5 bg-slate-800/60 hover:bg-emerald-500/10 hover:text-emerald-400 border border-slate-700/50 px-2.5 py-1 rounded-lg transition-all active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{post.insightCount} Resonates</span>
                      </button>

                      <button
                        onClick={() => {
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id ? { ...p, prayerCount: p.prayerCount + 1 } : p
                            )
                          );
                        }}
                        className="flex items-center gap-1.5 bg-slate-800/60 hover:bg-purple-500/10 hover:text-purple-400 border border-slate-700/50 px-2.5 py-1 rounded-lg transition-all active:scale-95"
                      >
                        <span>🙏 {post.prayerCount} Prayers</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 text-xs">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{post.replies.length} replies</span>
                    </div>
                  </div>

                  {/* Threaded Replies */}
                  {post.replies.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/50">
                      {post.replies.map((rep) => (
                        <div
                          key={rep.id}
                          className="bg-slate-900/90 p-3 rounded-xl text-xs space-y-1 ml-3 sm:ml-6 border-l-2 border-amber-400/70"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-amber-300">{rep.authorHandle}</span>
                            <span className="text-[10px] text-slate-500">{rep.time}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed">{rep.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}

        {/* 2. TFL MERCH STORE & CARE PASS TAB */}
        {activeTab === "store" && (
          <div className="space-y-6">
            
            {/* Store Hero Banner */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-[#161B28] to-amber-950/40 relative overflow-hidden shadow-2xl">
              <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-yellow-300 text-[10px] uppercase font-bold px-3 py-1 rounded-full border border-amber-500/30">
                      Shop To Heal Initiative
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      100% Impact Driven
                    </span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                    TFL Official Merchandise &amp; Care Pass
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Wear the mission. Every piece of merchandise purchased directly sponsors and unlocks a{" "}
                    <strong className="text-yellow-400">SafeSpace Care Pass</strong> for free private 1-on-1 sessions with our licensed psychologists.
                  </p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 text-center min-w-[220px] bg-slate-900/90">
                  <span className="text-xs text-slate-400">Total Care Passes Funded</span>
                  <div className="text-3xl font-extrabold text-gold-gradient my-1">184 Passes</div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Instant M-Pesa STK Delivery
                  </span>
                </div>
              </div>
            </div>

            {/* Merchandise Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="glass-panel rounded-2xl border border-slate-800 p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all shadow-xl group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
                        {prod.icon}
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full">
                          {prod.badge}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {prod.inStock} items remaining
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{prod.description}</p>
                    </div>

                    <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold">{prod.unlocksText}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 block line-through">
                        KES {prod.originalPriceKes.toLocaleString()}
                      </span>
                      <span className="font-extrabold text-xl text-yellow-400">
                        KES {prod.priceKes.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setCheckoutProduct(prod);
                        setPaymentSuccessCode(null);
                      }}
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all active:scale-95"
                    >
                      <span>Buy with M-Pesa</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher Unlock Box */}
            <div className="glass-panel p-6 rounded-2xl border border-amber-500/20 space-y-3 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <KeyRound className="w-5 h-5" />
                <span>Have a Merchandise Care Pass Voucher?</span>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">
                If you purchased merchandise or received a Care Pass code from an event/friend, enter it below to instantly unlock your private psychologist chat room.
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <input
                  type="text"
                  placeholder="e.g. TFL-CARE-948102"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono uppercase text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  onClick={() => {
                    if (voucherCodeInput.trim()) {
                      setIsVoucherUnlocked(true);
                      alert("🎉 SafeSpace Care Pass Verified! Private Psychologist Sanctuary Unlocked.");
                      setActiveTab("psychologist");
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-all active:scale-95"
                >
                  Verify &amp; Unlock Consultation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. PSYCHOLOGIST PORTAL TAB */}
        {activeTab === "psychologist" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left: Counselor Profile & Crisis Triage Queue */}
            <div className="space-y-4 lg:col-span-1">
              
              {/* Counselor Bio Card */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-extrabold text-base shadow-md">
                    DA
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-sm text-white">Dr. Amani W.</h3>
                      <Award className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-[11px] text-slate-400 block">KPA Licensed Psychologist</span>
                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Available for Sessions
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-800">
                  <p>• Clinical Trauma &amp; Anxiety Specialist</p>
                  <p>• 7+ Years Experience in Kenya</p>
                  <p>• Confidentiality Bonded by Law</p>
                </div>
              </div>

              {/* Real-time Crisis Escalation Queue */}
              <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 space-y-2.5">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="font-bold text-xs uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Crisis Triage Queue</span>
                  </h4>
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                    1 High Risk
                  </span>
                </div>

                <div
                  onClick={() => setActiveChatUser("QuietRiver17")}
                  className="bg-rose-950/30 hover:bg-rose-950/50 p-3 rounded-xl border border-rose-500/40 cursor-pointer space-y-1 transition-all"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-rose-200">
                    <span>QuietRiver17</span>
                    <span className="text-[9px] bg-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded font-mono">
                      Priority SOS
                    </span>
                  </div>
                  <p className="text-rose-300 text-[11px] line-clamp-2">
                    &ldquo;I feel completely empty and exhausted. Carrying this family burden alone while...&rdquo;
                  </p>
                  <span className="text-[10px] text-rose-400 font-semibold block pt-1">
                    ➔ Click to initiate private care
                  </span>
                </div>
              </div>
            </div>

            {/* Right: 1-on-1 Confidential Chat Sanctuary */}
            <div className="lg:col-span-3 glass-panel rounded-2xl border border-amber-500/20 shadow-2xl flex flex-col h-[560px] overflow-hidden">
              
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-sm">
                    🔒
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white">
                      Confidential Tele-Care Session with {activeChatUser}
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span>●</span> End-to-End Encrypted &bull; 100% HIPAA/Kenya DPA Compliant
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] bg-amber-500/20 text-yellow-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-mono font-bold">
                    {isVoucherUnlocked ? "Care Pass Verified ✓" : "Active Sponsored Session"}
                  </span>
                </div>
              </div>

              {/* Chat Messages Flow */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-950/60 text-xs sm:text-sm">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-4 rounded-2xl leading-relaxed shadow-md ${
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-medium rounded-br-none"
                          : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-slate-900/80 p-2.5 rounded-xl max-w-fit border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Dr. Amani is responding...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3.5 border-t border-slate-800 bg-slate-900/90 flex gap-2.5">
                <input
                  type="text"
                  placeholder="Type your message confidentially..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 4. ADMIN & SAFETY CENTER TAB */}
        {activeTab === "admin" && (
          <div className="space-y-6">
            
            {/* Real-time Telemetry Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Total Anonymous Souls</span>
                <div className="text-2xl font-extrabold text-white">1,492</div>
                <span className="text-[10px] text-emerald-400 font-semibold">+24% growth this week</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Merch Revenue (M-Pesa)</span>
                <div className="text-2xl font-extrabold text-gold-gradient">KES 88,400</div>
                <span className="text-[10px] text-emerald-400 font-semibold">38 orders completed</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Crisis Safety Flagged</span>
                <div className="text-2xl font-extrabold text-rose-400">18 Triaged</div>
                <span className="text-[10px] text-slate-400">100% connected to psychologists</span>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Cloud Infrastructure Cost</span>
                <div className="text-2xl font-extrabold text-emerald-400">KES 0.00</div>
                <span className="text-[10px] text-slate-400">Vercel &amp; Supabase Free Tier</span>
              </div>
            </div>

            {/* Recent Orders & Care Pass Dispatch Table */}
            <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">Live M-Pesa Orders &amp; Care Pass Deliveries</h3>
                <span className="text-xs text-slate-500">Auto-synchronized with Safaricom Daraja</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Customer Phone</th>
                      <th className="p-3">Item Purchased</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">M-Pesa STK Status</th>
                      <th className="p-3">Care Pass Code</th>
                      <th className="p-3">Therapist Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr>
                      <td className="p-3 font-mono font-medium">0712 *** 894</td>
                      <td className="p-3">TFL Signature Gold Hoodie (L)</td>
                      <td className="p-3 font-bold text-yellow-400">KES 2,800</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          PAID (STK Push)
                        </span>
                      </td>
                      <td className="p-3 font-mono text-amber-300 font-bold">TFL-CARE-928172</td>
                      <td className="p-3 text-emerald-400">Claimed &bull; Dr. Amani</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono font-medium">0722 *** 301</td>
                      <td className="p-3">Mental Wellness &amp; CBT Journal</td>
                      <td className="p-3 font-bold text-yellow-400">KES 1,200</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          PAID (STK Push)
                        </span>
                      </td>
                      <td className="p-3 font-mono text-amber-300 font-bold">TFL-CARE-441092</td>
                      <td className="p-3 text-slate-400">Pending User Claim</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: NEW ANONYMOUS POST */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-amber-500/30 space-y-4 bg-slate-900">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white">Share in the SafeSpace</h3>
                <span className="text-[11px] text-slate-400">100% Anonymous &bull; No identity stored</span>
              </div>
              <button
                onClick={() => setShowNewPostModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Select Channel / Topic
                </label>
                <select
                  value={newPostRoom}
                  onChange={(e) => setNewPostRoom(e.target.value as Room)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-medium"
                >
                  <option value="anxiety">🌪️ Anxiety &amp; Overwhelm</option>
                  <option value="burnout">💼 Work &amp; Life Burnout</option>
                  <option value="relationships">💔 Relationships &amp; Heartbreak</option>
                  <option value="grief">🕊️ Grief &amp; Loss</option>
                  <option value="wins">🌱 Daily Wins &amp; Positivity</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  What is on your heart right now?
                </label>
                <textarea
                  rows={4}
                  placeholder="Express your raw thoughts freely with zero fear of judgment..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              {/* Attach Voice Note Simulation */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300">Attach Anonymous Voice Confession</span>
                </div>
                <button
                  type="button"
                  onClick={() => setHasVoiceAttached(!hasVoiceAttached)}
                  className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all ${
                    hasVoiceAttached
                      ? "bg-amber-500 text-slate-950"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {hasVoiceAttached ? "Voice Attached (0:30) ✓" : "+ Add Voice Note"}
                </button>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300/90 p-3 rounded-xl text-[11px] leading-relaxed">
                💡 <strong>Safety Guardian:</strong> Our system continuously screens for severe self-harm words so our clinical team can offer instant emergency support if you are in danger.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95"
                >
                  Post Anonymously
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CRISIS EMERGENCY HOTLINE */}
      {showCrisisModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border-2 border-rose-500/60 space-y-5 bg-slate-900 relative">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto text-2xl shadow-inner">
                ❤️
              </div>
              <h3 className="font-display font-bold text-xl text-white">
                You Are Not Alone. We Are Here.
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you are going through immense pain or having thoughts of giving up, please talk to someone who cares right now. Confidential human support is available 24/7.
              </p>
            </div>

            <div className="space-y-3">
              <a
                href="tel:+254722178177"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white p-3.5 rounded-2xl flex items-center justify-between font-bold text-xs shadow-lg transition-transform active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4" />
                  <span>Befrienders Kenya (24/7 Helpline)</span>
                </div>
                <span>+254 722 178 177</span>
              </a>

              <a
                href="tel:1199"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3.5 rounded-2xl flex items-center justify-between font-bold text-xs border border-slate-700 shadow-md transition-transform active:scale-95"
              >
                <div className="flex items-center gap-2.5">
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>Kenya Red Cross Emergency</span>
                </div>
                <span className="font-mono text-emerald-400">1199</span>
              </a>
            </div>

            <button
              onClick={() => setShowCrisisModal(false)}
              className="w-full py-2 text-xs text-slate-400 font-semibold hover:text-white transition-colors"
            >
              Return to SafeSpace Community
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: M-PESA CHECKOUT & INSTANT CARE PASS DELIVERY */}
      {checkoutProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl border border-amber-500/30 space-y-4 bg-slate-900">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white">M-Pesa Express Checkout</h3>
                <span className="text-[11px] text-slate-400">Instant STK Push Prompt</span>
              </div>
              <button
                onClick={() => setCheckoutProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {!paymentSuccessCode ? (
              <form onSubmit={handleSimulateMpesa} className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl flex items-center gap-3.5 border border-slate-800">
                  <span className="text-3xl">{checkoutProduct.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{checkoutProduct.name}</h4>
                    <span className="font-extrabold text-sm text-yellow-400">
                      KES {checkoutProduct.priceKes.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Your Name / Nickname (For shipping)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Faith W."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Safaricom M-Pesa Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    You will receive an STK Push PIN prompt on your phone screen.
                  </span>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Includes 1 Free Psychologist Session Care Pass Code!</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessingMpesa}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 py-3.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  {isProcessingMpesa ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      Awaiting M-Pesa PIN ({mpesaCountdown}s)...
                    </span>
                  ) : (
                    <span>Pay KES {checkoutProduct.priceKes.toLocaleString()} via M-Pesa</span>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-4 py-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold shadow-lg">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">M-Pesa Payment Confirmed!</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Your merchandise order is confirmed and your SafeSpace Care Pass is ready.
                  </p>
                </div>

                <div className="glass-panel border border-amber-500/40 p-4 rounded-2xl space-y-2 bg-gradient-to-b from-slate-950 to-amber-950/30">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                    Your SafeSpace Care Pass Voucher
                  </span>
                  <div className="font-mono text-xl font-extrabold text-yellow-300">
                    {paymentSuccessCode}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentSuccessCode);
                      setCopiedVoucher(true);
                      setTimeout(() => setCopiedVoucher(false), 2000);
                    }}
                    className="text-[11px] text-amber-300 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    {copiedVoucher ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedVoucher ? "Copied to Clipboard!" : "Copy Voucher Code"}</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setVoucherCodeInput(paymentSuccessCode);
                    setIsVoucherUnlocked(true);
                    setCheckoutProduct(null);
                    setActiveTab("psychologist");
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 py-3 rounded-xl font-bold text-xs shadow-lg transition-transform active:scale-95"
                >
                  Go to Psychologist Sanctuary Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
