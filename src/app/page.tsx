"use client";

import React, { useState, useEffect } from "react";
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
  Search,
  Wind,
  Download,
  X,
} from "lucide-react";

// Types
type Room = "all" | "anxiety" | "burnout" | "relationships" | "grief" | "wins";
type Tab = "community" | "store" | "psychologist" | "admin" | "wellness";

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
  isPinned?: boolean;
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
  inStock: number;
  sizes?: string[];
}

export default function SafeSpaceApp() {
  const [activeTab, setActiveTab] = useState<Tab>("community");
  const [selectedRoom, setSelectedRoom] = useState<Room>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [showBreathingModal, setShowBreathingModal] = useState(false);
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
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [showPwaBanner, setShowPwaBanner] = useState(true);

  // Breathing tool state
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const [breathCount, setBreathCount] = useState(4);

  // Store Checkout State
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>("L");
  const [deliveryLocation, setDeliveryLocation] = useState<string>("Nairobi CBD / Westlands");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentSuccessCode, setPaymentSuccessCode] = useState<string | null>(null);
  const [isProcessingMpesa, setIsProcessingMpesa] = useState(false);
  const [mpesaCountdown, setMpesaCountdown] = useState(0);

  // Breathing timer loop
  useEffect(() => {
    if (!showBreathingModal) return;
    const phases: Array<{ name: "Inhale" | "Hold" | "Exhale"; seconds: number }> = [
      { name: "Inhale", seconds: 4 },
      { name: "Hold", seconds: 7 },
      { name: "Exhale", seconds: 8 },
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

  // Catalog Products
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
      inStock: 18,
      sizes: ["S", "M", "L", "XL", "2XL"],
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
      inStock: 25,
      sizes: ["S", "M", "L", "XL"],
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
      inStock: 50,
    },
  ];

  // Daily Affirmation
  const dailyAffirmations = [
    "You don't have to carry tomorrow's burdens today. One breath at a time.",
    "Your feelings are valid. You are not broken for feeling tired.",
    "It takes strength to admit you are struggling. Healing begins right here.",
  ];
  const [currentAffirmation] = useState(dailyAffirmations[0]);

  // Posts Feed
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
      isPinned: true,
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

  // Chat Log
  const [chatLog, setChatLog] = useState<{ sender: "user" | "therapist"; text: string; time: string }[]>([
    {
      sender: "therapist",
      text: "Hello! I am Dr. Amani W., a licensed clinical counselor at TFL SafeSpace. Everything you share here is 100% confidential and anonymous. How is your heart doing today?",
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

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const crisisTriggers = [
      "give up",
      "end it",
      "hurt myself",
      "hopeless",
      "can't go on",
      "die",
      "suicide",
      "end my life",
      "stop everything",
    ];
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
          text: "Thank you for sharing that with me. It takes courage to open up. Let's take it one step at a time.",
          time: "Just now",
        },
      ]);
    }, 1800);
  };

  const filteredPosts = posts
    .filter((p) => (selectedRoom === "all" ? true : p.room === selectedRoom))
    .filter((p) =>
      searchQuery.trim() === ""
        ? true
        : p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.authorHandle.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 selection:bg-amber-500 selection:text-black antialiased relative overflow-x-hidden pb-24 md:pb-12">
      
      {/* Ambient Lighting */}
      <div className="fixed top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-80 sm:w-[30rem] h-80 sm:h-[30rem] bg-yellow-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* Top Mobile PWA Install Banner */}
      {showPwaBanner && !pwaInstalled && (
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-950 animate-bounce" />
            <span>Install TFL SafeSpace app for fast access &amp; instant notifications!</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPwaInstalled(true);
                setShowPwaBanner(false);
                alert("✨ Tap 'Add to Home Screen' or your browser's Install icon to install TFL SafeSpace.");
              }}
              className="bg-slate-950 text-white text-[10px] px-2.5 py-1 rounded-full hover:bg-slate-800"
            >
              Install App
            </button>
            <button onClick={() => setShowPwaBanner(false)} className="text-slate-950 hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Telemetry Safety Bar */}
      <div className="bg-[#080B11]/90 border-b border-amber-500/10 backdrop-blur-md text-[11px] py-1.5 px-4 text-slate-400">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>384 Anonymous Members Online</span>
            </span>
            <span className="hidden sm:inline text-slate-600">&bull;</span>
            <span className="hidden sm:inline text-slate-400">100% Encrypted &bull; No Real Names</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowCrisisModal(true)}
              className="flex items-center gap-1 text-rose-400 hover:text-rose-300 font-semibold transition-colors"
            >
              <PhoneCall className="w-3 h-3" />
              <span>24/7 Crisis SOS</span>
            </button>
            <span className="hidden sm:inline text-slate-600">&bull;</span>
            <span className="hidden sm:inline text-amber-400/90 font-mono">Kenya Helpline: 1199</span>
          </div>
        </div>
      </div>

      {/* Primary Brand Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#0E1420]/95 backdrop-blur-xl border-b border-amber-500/20 shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-amber-400/20 via-slate-900 to-black p-0.5 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src="/tfl-logo.jpeg"
                alt="TFL Logo"
                width={44}
                height={44}
                className="object-contain filter drop-shadow"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-display font-extrabold text-lg sm:text-2xl tracking-tight text-white flex items-center gap-1">
                  I&apos;m TFL <span className="text-gold-gradient font-sans">SafeSpace</span>
                </h1>
                <span className="hidden xs:inline-block bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-yellow-300 text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full border border-amber-500/40 tracking-wider">
                  Safe Hub
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-200/70 italic font-serif hidden sm:block">
                &ldquo;Talk freely. While heard freely. Stay anonymous.&rdquo;
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBreathingModal(true)}
              className="bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
              title="Calm Down Breathing Exercise"
            >
              <Wind className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
              <span className="hidden sm:inline">Breathe</span>
            </button>

            <button
              onClick={() => setShowNewPostModal(true)}
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Share Story</span>
              <span className="sm:hidden">Share</span>
            </button>
          </div>
        </div>

        {/* Desktop / Tablet Navigation Tabs */}
        <div className="hidden md:flex max-w-6xl mx-auto px-6 gap-2 overflow-x-auto text-xs font-semibold border-t border-slate-800/80">
          {[
            { id: "community", label: "💬 SafeSpace Sanctuary", icon: MessageCircle },
            { id: "store", label: "🛍️ TFL Merch & Care Pass", icon: ShoppingBag },
            { id: "psychologist", label: "🩺 Psychologist Sanctuary", icon: UserCheck },
            { id: "wellness", label: "🌱 Self-Care & Grounding", icon: Wind },
            { id: "admin", label: "🛡️ Safety Command", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`py-3 px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-5">

        {/* Daily Affirmation Banner */}
        <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-slate-950 via-[#141A28] to-amber-950/30 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🕯️</span>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                Daily Word of Strength
              </span>
              <p className="text-slate-200 italic">&ldquo;{currentAffirmation}&rdquo;</p>
            </div>
          </div>
          <button
            onClick={() => setShowBreathingModal(true)}
            className="hidden sm:flex items-center gap-1 text-emerald-400 font-bold text-[11px] bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg hover:bg-emerald-500/20 transition-all shrink-0"
          >
            <Wind className="w-3.5 h-3.5" />
            <span>Calm Panic</span>
          </button>
        </div>

        {/* 1. COMMUNITY FEED TAB */}
        {activeTab === "community" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            
            {/* Left Sidebar: Search & Filter Channels */}
            <div className="space-y-4 lg:col-span-1">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search topics, feelings, grief..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Topic Rooms */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" />
                    <span>SafeSpace Channels</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">{posts.length} Posts</span>
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

              {/* Anonymity Pledge */}
              <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 space-y-2 bg-gradient-to-b from-slate-900 to-black">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>100% Anonymity Promise</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  You are identified only by random pseudonyms. No real identity, phone, or email is ever visible to peers.
                </p>
              </div>
            </div>

            {/* Middle & Right: Post Stream */}
            <div className="lg:col-span-3 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h2 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
                  <span>{selectedRoom === "all" ? "SafeSpace Sanctuary Feed" : `Channel: ${selectedRoom}`}</span>
                  <span className="text-xs text-amber-400 font-normal bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    Live Stream
                  </span>
                </h2>
                <span className="text-xs text-slate-400">{filteredPosts.length} stories</span>
              </div>

              {filteredPosts.map((post) => (
                <article
                  key={post.id}
                  className={`glass-panel rounded-2xl p-4 sm:p-5 border space-y-3.5 transition-all ${
                    post.isFlagged
                      ? "border-rose-500/40 bg-gradient-to-b from-rose-950/20 to-slate-900"
                      : "border-slate-800/80 hover:border-amber-500/30"
                  }`}
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr ${post.avatarColor} p-0.5 flex items-center justify-center text-slate-950 font-bold text-xs shadow-md`}
                      >
                        {post.authorHandle.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-200">{post.authorHandle}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded border border-slate-700">
                            Anonymous
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block">{post.timeAgo}</span>
                      </div>
                    </div>

                    <span className="text-[10px] sm:text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full capitalize">
                      #{post.room}
                    </span>
                  </div>

                  {/* Post Content */}
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Voice Note Simulation */}
                  {post.hasVoiceNote && (
                    <div className="bg-slate-850 border border-slate-700/60 p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleVoice(post.id)}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-md transition-transform active:scale-95"
                        >
                          {isPlayingVoice === post.id ? "⏸" : "▶"}
                        </button>
                        <div>
                          <span className="font-bold text-slate-200 block text-[11px]">
                            {isPlayingVoice === post.id ? "Playing Voice Story..." : "Voice Confession"}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            Duration: {post.voiceDuration}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 h-3.5">
                        {[40, 70, 30, 90, 50, 80, 60, 100, 40, 70, 85, 30, 60].map((h, i) => (
                          <div
                            key={i}
                            style={{ height: `${h}%` }}
                            className={`w-0.5 sm:w-1 rounded-full transition-all duration-300 ${
                              isPlayingVoice === post.id ? "bg-amber-400 animate-pulse" : "bg-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Crisis Triage Alert */}
                  {post.isFlagged && (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-rose-300">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>High-distress sentiment detected. SafeSpace counselor triage alerted.</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab("psychologist");
                          setActiveChatUser(post.authorHandle);
                        }}
                        className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 px-3 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap"
                      >
                        Open Therapist Desk ➔
                      </button>
                    </div>
                  )}

                  {/* Empathetic Reaction Bar */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs text-slate-400">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => {
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id ? { ...p, empathyCount: p.empathyCount + 1 } : p
                            )
                          );
                        }}
                        className="flex items-center gap-1 bg-slate-800/60 hover:bg-rose-500/10 hover:text-rose-400 border border-slate-700/50 px-2 py-1 rounded-lg text-[11px] transition-all active:scale-95"
                      >
                        <Heart className="w-3 h-3 text-rose-500" />
                        <span>{post.empathyCount}</span>
                      </button>

                      <button
                        onClick={() => {
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id ? { ...p, hugCount: p.hugCount + 1 } : p
                            )
                          );
                        }}
                        className="flex items-center gap-1 bg-slate-800/60 hover:bg-amber-500/10 hover:text-amber-400 border border-slate-700/50 px-2 py-1 rounded-lg text-[11px] transition-all active:scale-95"
                      >
                        <span>🫂 {post.hugCount}</span>
                      </button>

                      <button
                        onClick={() => {
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id ? { ...p, insightCount: p.insightCount + 1 } : p
                            )
                          );
                        }}
                        className="flex items-center gap-1 bg-slate-800/60 hover:bg-emerald-500/10 hover:text-emerald-400 border border-slate-700/50 px-2 py-1 rounded-lg text-[11px] transition-all active:scale-95"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span>{post.insightCount}</span>
                      </button>

                      <button
                        onClick={() => {
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id ? { ...p, prayerCount: p.prayerCount + 1 } : p
                            )
                          );
                        }}
                        className="flex items-center gap-1 bg-slate-800/60 hover:bg-purple-500/10 hover:text-purple-400 border border-slate-700/50 px-2 py-1 rounded-lg text-[11px] transition-all active:scale-95"
                      >
                        <span>🙏 {post.prayerCount}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <MessageCircle className="w-3 h-3" />
                      <span>{post.replies.length}</span>
                    </div>
                  </div>

                  {/* Replies List */}
                  {post.replies.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/50">
                      {post.replies.map((rep) => (
                        <div
                          key={rep.id}
                          className="bg-slate-900/90 p-2.5 sm:p-3 rounded-xl text-xs space-y-1 ml-2 sm:ml-6 border-l-2 border-amber-400/70"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-amber-300">{rep.authorHandle}</span>
                            <span className="text-[9px] text-slate-500">{rep.time}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                            {rep.content}
                          </p>
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
            <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-slate-950 via-[#161B28] to-amber-950/40 relative overflow-hidden shadow-2xl">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-yellow-300 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      Shop To Heal Initiative
                    </span>
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Direct Care Sponsorship
                    </span>
                  </div>
                  <h2 className="font-display text-xl sm:text-3xl font-extrabold text-white">
                    TFL Official Merchandise &amp; Care Pass
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Wear the mission. Every piece of merchandise purchased directly sponsors and unlocks a{" "}
                    <strong className="text-yellow-400">SafeSpace Care Pass</strong> for free private sessions with licensed psychologists.
                  </p>
                </div>

                <div className="glass-panel p-3.5 rounded-2xl border border-amber-500/30 text-center min-w-[200px] bg-slate-900/90 w-full sm:w-auto">
                  <span className="text-xs text-slate-400">Total Care Passes Funded</span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gold-gradient my-0.5">184 Passes</div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Instant M-Pesa STK Delivery
                  </span>
                </div>
              </div>
            </div>

            {/* Merchandise Catalog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all shadow-xl group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
                        {prod.icon}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] sm:text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                          {prod.badge}
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-1">
                          {prod.inStock} in stock
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{prod.description}</p>
                    </div>

                    <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-semibold">{prod.unlocksText}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-500 block line-through">
                        KES {prod.originalPriceKes.toLocaleString()}
                      </span>
                      <span className="font-extrabold text-lg sm:text-xl text-yellow-400">
                        KES {prod.priceKes.toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setCheckoutProduct(prod);
                        setPaymentSuccessCode(null);
                      }}
                      className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all active:scale-95"
                    >
                      <span>Buy with M-Pesa</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher Unlock Box */}
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-amber-500/20 space-y-3 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <KeyRound className="w-5 h-5" />
                <span>Have a Merchandise Care Pass Voucher?</span>
              </div>
              <p className="text-xs text-slate-400 max-w-2xl">
                If you purchased merchandise or received a Care Pass code from an event, enter it below to instantly unlock your private psychologist sanctuary.
              </p>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
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
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-all active:scale-95"
                >
                  Verify &amp; Unlock
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. PSYCHOLOGIST PORTAL TAB */}
        {activeTab === "psychologist" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
            
            {/* Left: Counselor Profile & Crisis Triage Queue */}
            <div className="space-y-4 lg:col-span-1">
              
              {/* Counselor Bio */}
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-extrabold text-base shadow-md">
                    DA
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
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

                <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800">
                  <p>• Clinical Trauma &amp; Anxiety Specialist</p>
                  <p>• 7+ Years Experience in Kenya</p>
                  <p>• 100% Confidentiality Bonded</p>
                </div>
              </div>

              {/* Real-time Crisis Escalation Queue */}
              <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <h4 className="font-bold text-xs uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Crisis Triage Queue</span>
                  </h4>
                  <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full font-bold">
                    1 High Risk
                  </span>
                </div>

                <div
                  onClick={() => setActiveChatUser("QuietRiver17")}
                  className="bg-rose-950/30 hover:bg-rose-950/50 p-2.5 rounded-xl border border-rose-500/40 cursor-pointer space-y-1 transition-all"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-rose-200">
                    <span>QuietRiver17</span>
                    <span className="text-[9px] bg-rose-500/30 text-rose-300 px-1.5 py-0.2 rounded font-mono">
                      Priority SOS
                    </span>
                  </div>
                  <p className="text-rose-300 text-[11px] line-clamp-2">
                    &ldquo;I feel completely empty and exhausted. Carrying this family burden alone while...&rdquo;
                  </p>
                  <span className="text-[10px] text-rose-400 font-semibold block pt-1">
                    ➔ Click to attend client
                  </span>
                </div>
              </div>
            </div>

            {/* Right: 1-on-1 Confidential Chat Sanctuary */}
            <div className="lg:col-span-3 glass-panel rounded-2xl border border-amber-500/20 shadow-2xl flex flex-col h-[520px] sm:h-[560px] overflow-hidden">
              
              {/* Chat Header */}
              <div className="p-3.5 sm:p-4 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-xs">
                    🔒
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white">
                      Confidential Session with {activeChatUser}
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                      <span>●</span> End-to-End Encrypted &bull; 100% Anonymous
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] sm:text-[11px] bg-amber-500/20 text-yellow-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono font-bold">
                    {isVoucherUnlocked ? "Care Pass Verified ✓" : "Active Sponsored Session"}
                  </span>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-950/60 text-xs sm:text-sm">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[80%] p-3 sm:p-3.5 rounded-2xl leading-relaxed shadow-md ${
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-medium rounded-br-none"
                          : "bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 bg-slate-900/80 p-2 rounded-xl max-w-fit border border-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Dr. Amani is typing...</span>
                  </div>
                )}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-900/90 flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message confidentially..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 4. SELF-CARE & GROUNDING TAB */}
        {activeTab === "wellness" && (
          <div className="space-y-6">
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-slate-950 via-[#10241A] to-slate-950 text-center space-y-3">
              <span className="text-3xl">🌿</span>
              <h2 className="font-display text-2xl font-bold text-white">SafeSpace Wellness &amp; Grounding Tools</h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                Quick, science-backed emergency exercises to regulate your nervous system during panic, anxiety, or emotional heaviness.
              </p>
              <button
                onClick={() => setShowBreathingModal(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg inline-flex items-center gap-2"
              >
                <Wind className="w-4 h-4" />
                <span>Launch 4-7-8 Breathing Circle</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <h3 className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                  <span>5-4-3-2-1 Sensory Grounding</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Identify 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste to instantly ground yourself in the present.
                </p>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <h3 className="font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                  <span>Box Breathing Method</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Inhale 4s &bull; Hold 4s &bull; Exhale 4s &bull; Hold 4s. Used by paramedics and therapists to lower heart rate.
                </p>
              </div>

              <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
                <h3 className="font-bold text-sm text-purple-300 flex items-center gap-1.5">
                  <span>Cognitive Reframing</span>
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ask yourself: &ldquo;Is this worry a proven fact right now, or is it my anxiety trying to predict the worst?&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. ADMIN & SAFETY CENTER TAB */}
        {activeTab === "admin" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Total Anonymous Souls</span>
                <div className="text-2xl font-extrabold text-white">1,492</div>
                <span className="text-[10px] text-emerald-400 font-semibold">+24% growth this week</span>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Merch Revenue (M-Pesa)</span>
                <div className="text-2xl font-extrabold text-gold-gradient">KES 88,400</div>
                <span className="text-[10px] text-emerald-400 font-semibold">38 orders completed</span>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Crisis Safety Flagged</span>
                <div className="text-2xl font-extrabold text-rose-400">18 Triaged</div>
                <span className="text-[10px] text-slate-400">100% connected to psychologists</span>
              </div>

              <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-xs text-slate-400">Cloud Hosting Cost</span>
                <div className="text-2xl font-extrabold text-emerald-400">KES 0.00</div>
                <span className="text-[10px] text-slate-400">Vercel &amp; Supabase Free Tier</span>
              </div>
            </div>

            {/* Orders Table */}
            <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">Live M-Pesa Orders &amp; Care Pass Deliveries</h3>
                <span className="text-xs text-slate-500">Auto-synchronized with Safaricom Daraja</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Customer Phone</th>
                      <th className="p-3">Item Purchased</th>
                      <th className="p-3">Amount</th>
                      <th className="p-3">M-Pesa STK Status</th>
                      <th className="p-3">Care Pass Code</th>
                      <th className="p-3">Therapist Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-3 font-mono">0712 *** 894</td>
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
                      <td className="p-3 font-mono">0722 *** 301</td>
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

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom on phones) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0E1420]/95 backdrop-blur-xl border-t border-amber-500/20 px-2 py-2 flex justify-around items-center text-[10px] font-semibold text-slate-400 shadow-2xl">
        {[
          { id: "community", label: "Feed", icon: MessageCircle },
          { id: "store", label: "Merch", icon: ShoppingBag },
          { id: "psychologist", label: "Therapist", icon: UserCheck },
          { id: "wellness", label: "Calm", icon: Wind },
          { id: "admin", label: "Admin", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? "text-yellow-400 font-bold scale-105" : "hover:text-slate-200"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-yellow-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* MODAL 1: NEW ANONYMOUS POST */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-500/30 space-y-4 bg-slate-900">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
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
                <label className="text-xs font-semibold text-slate-300 block mb-1">
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
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  What is on your heart right now?
                </label>
                <textarea
                  rows={4}
                  placeholder="Express your raw thoughts freely with zero fear of judgment..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-400 leading-relaxed"
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

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95"
                >
                  Post Anonymously
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: 4-7-8 BREATHING EXERCISE */}
      {showBreathingModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 text-center space-y-5 border border-emerald-500/40 bg-slate-900">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Emergency Grounding
              </span>
              <button
                onClick={() => setShowBreathingModal(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-full border-4 border-emerald-400/40 transition-all duration-1000 ${
                    breathPhase === "Inhale"
                      ? "scale-110 bg-emerald-500/20"
                      : breathPhase === "Hold"
                      ? "scale-105 bg-yellow-500/20"
                      : "scale-90 bg-slate-800/40"
                  }`}
                />
                <div className="text-center relative z-10">
                  <span className="text-3xl font-extrabold text-white block">{breathCount}s</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    {breathPhase}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                Follow the rhythm. Breathe in slowly through your nose, hold gently, and exhale smoothly through your mouth.
              </p>
            </div>

            <button
              onClick={() => setShowBreathingModal(false)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-all active:scale-95"
            >
              I Feel Calmer Now
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: CRISIS EMERGENCY HOTLINE */}
      {showCrisisModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-rose-500/60 space-y-4 bg-slate-900 relative">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto text-xl shadow-inner">
                ❤️
              </div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                You Are Not Alone. We Are Here.
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                If you are going through immense pain or having thoughts of giving up, please talk to someone who cares right now. Confidential human support is available 24/7.
              </p>
            </div>

            <div className="space-y-2.5">
              <a
                href="tel:+254722178177"
                className="w-full bg-rose-600 hover:bg-rose-500 text-white p-3 rounded-2xl flex items-center justify-between font-bold text-xs shadow-lg transition-transform active:scale-95"
              >
                <div className="flex items-center gap-2">
                  <PhoneCall className="w-4 h-4" />
                  <span>Befrienders Kenya (24/7 Helpline)</span>
                </div>
                <span>+254 722 178 177</span>
              </a>

              <a
                href="tel:1199"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-2xl flex items-center justify-between font-bold text-xs border border-slate-700 shadow-md transition-transform active:scale-95"
              >
                <div className="flex items-center gap-2">
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

      {/* MODAL 4: M-PESA CHECKOUT & CARE PASS */}
      {checkoutProduct && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-panel w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-amber-500/30 space-y-4 bg-slate-900 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
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
              <form onSubmit={handleSimulateMpesa} className="space-y-3.5">
                <div className="bg-slate-950 p-3 rounded-2xl flex items-center gap-3 border border-slate-800">
                  <span className="text-2xl">{checkoutProduct.icon}</span>
                  <div>
                    <h4 className="font-bold text-xs text-white">{checkoutProduct.name}</h4>
                    <span className="font-extrabold text-sm text-yellow-400">
                      KES {checkoutProduct.priceKes.toLocaleString()}
                    </span>
                  </div>
                </div>

                {checkoutProduct.sizes && (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Select Size
                    </label>
                    <div className="flex gap-1.5">
                      {checkoutProduct.sizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSelectedSize(s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            selectedSize === s
                              ? "bg-amber-500 text-slate-950 border-amber-400 font-extrabold"
                              : "bg-slate-950 border-slate-700 text-slate-300 hover:text-white"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Delivery Location (Kenya)
                  </label>
                  <select
                    value={deliveryLocation}
                    onChange={(e) => setDeliveryLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-medium"
                  >
                    <option value="Nairobi CBD / Westlands">Nairobi CBD / Westlands</option>
                    <option value="Kilimani / Ngong Rd / Karen">Kilimani / Ngong Rd / Karen</option>
                    <option value="Kiambu / Thika / Ruiru">Kiambu / Thika / Ruiru</option>
                    <option value="Nakuru / Eldoret / Kisumu">Nakuru / Eldoret / Kisumu</option>
                    <option value="Mombasa / Coast Region">Mombasa / Coast Region</option>
                    <option value="Countrywide Parcel Delivery">Countrywide Parcel Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Your Name / Nickname
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

                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Includes 1 Free Psychologist Session Care Pass Code!</span>
                </div>

                <button
                  type="submit"
                  disabled={isProcessingMpesa}
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 py-3 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
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
              <div className="text-center space-y-4 py-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold shadow-lg">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">M-Pesa Payment Confirmed!</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
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
