"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Counselor, CounselingSession, CounselingMessage, CareVoucher } from "@/lib/types";
import {
  UserCheck,
  ShieldCheck,
  Star,
  MessageCircle,
  KeyRound,
  Send,
  Sparkles,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Lock,
  ShoppingBag,
  Heart,
  X,
  User,
} from "lucide-react";

interface CounselorViewProps {
  initialVoucherCode?: string;
  onGoToStore: () => void;
  onOpenCrisis: () => void;
}

export function CounselorView({
  initialVoucherCode,
  onGoToStore,
  onOpenCrisis,
}: CounselorViewProps) {
  const [counselors, setCounselors] = useState<Counselor[]>([]);
  const [isLoadingCounselors, setIsLoadingCounselors] = useState(true);

  // Voucher / Access State
  const [voucherCodeInput, setVoucherCodeInput] = useState(initialVoucherCode || "");
  const [activeVoucher, setActiveVoucher] = useState<CareVoucher | null>(null);
  const [isRedeemingVoucher, setIsRedeemingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // Unlock Modal State (Prompt to purchase gift / pass)
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [pendingCounselor, setPendingCounselor] = useState<Counselor | null>(null);

  // Selected Counselor & Active Session State
  const [selectedCounselor, setSelectedCounselor] = useState<Counselor | null>(null);
  const [activeSession, setActiveSession] = useState<CounselingSession | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);

  // Chat Messaging State
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const voucherInputRef = useRef<HTMLInputElement | null>(null);

  const handleRedeemVoucher = useCallback(async (codeToRedeem?: string) => {
    const code = (codeToRedeem || voucherCodeInput).trim().toUpperCase();
    if (!code) {
      setVoucherError("Please enter a Care Pass code (e.g. CARE-XXXX-TFL).");
      return;
    }

    setIsRedeemingVoucher(true);
    setVoucherError(null);

    try {
      const res = await fetch("/api/vouchers/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setVoucherError(data.error || "Invalid Care Pass voucher code.");
      } else {
        setActiveVoucher(data.voucher);
        setVoucherCodeInput("");
        setShowUnlockModal(false);
      }
    } catch {
      setVoucherError("Error connecting to voucher redemption service.");
    } finally {
      setIsRedeemingVoucher(false);
    }
  }, [voucherCodeInput]);

  useEffect(() => {
    fetchCounselors();
    if (initialVoucherCode) {
      handleRedeemVoucher(initialVoucherCode);
    }
  }, [initialVoucherCode, handleRedeemVoucher]);

  useEffect(() => {
    if (activeSession) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeSession]);

  async function fetchCounselors() {
    setIsLoadingCounselors(true);
    try {
      const res = await fetch("/api/counseling/counselors");
      const data = await res.json();
      if (data.success && data.counselors) {
        setCounselors(data.counselors);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingCounselors(false);
    }
  }

  function handleInitiateChat(counselor: Counselor) {
    if (!activeVoucher) {
      setPendingCounselor(counselor);
      setShowUnlockModal(true);
    } else {
      handleStartSession(counselor);
    }
  }

  async function handleStartSession(counselor: Counselor) {
    // Guard: never attempt to start without a redeemed Care Pass in hand.
    if (!activeVoucher) {
      setPendingCounselor(counselor);
      setShowUnlockModal(true);
      return;
    }

    setIsStartingSession(true);
    try {
      const res = await fetch("/api/counseling/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselorId: counselor.id,
          voucherId: activeVoucher?.id || null,
          voucherCode: activeVoucher?.code || null,
          primaryConcern: "General emotional guidance and support",
          intakeMood: "neutral",
        }),
      });

      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        setSelectedCounselor(counselor);
        setShowUnlockModal(false);
      } else {
        // Server rejected access (e.g. voucher invalid/expired) — surface the
        // paywall again instead of failing silently.
        setActiveVoucher(null);
        setVoucherError(
          data.error || "Your Care Pass could not be verified. Please purchase or re-enter a valid code."
        );
        setPendingCounselor(counselor);
        setShowUnlockModal(true);
      }
    } catch (err) {
      console.error("Start session error:", err);
      setVoucherError("Network error while connecting to a counselor. Please try again.");
    } finally {
      setIsStartingSession(false);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSession || !newMessage.trim() || isSendingMessage) return;

    const userText = newMessage.trim();
    setNewMessage("");
    setIsSendingMessage(true);

    const clientMsg: CounselingMessage = {
      id: `msg-${Date.now()}`,
      sessionId: activeSession.id,
      senderRole: "client",
      content: userText,
      createdAt: new Date().toISOString(),
    };

    // Optimistically update
    setActiveSession((prev) =>
      prev ? { ...prev, messages: [...prev.messages, clientMsg] } : null
    );

    try {
      await fetch("/api/counseling/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          senderRole: "client",
          content: userText,
        }),
      });

      // Simulated empathetic psychologist reply
      setTimeout(() => {
        const counselorReplies = [
          "Thank you for sharing that with me. What you're experiencing is completely valid. How long have you felt this way?",
          "I hear how heavy this feels. Let's take a slow breath together. Can you tell me what typically brings you the most relief when this happens?",
          "You showed great courage expressing this. You are not alone in this feeling. We will work through it step by step.",
        ];
        const replyText =
          counselorReplies[Math.floor(Math.random() * counselorReplies.length)];

        const counselorMsg: CounselingMessage = {
          id: `cmsg-${Date.now()}`,
          sessionId: activeSession.id,
          senderRole: "counselor",
          content: replyText,
          createdAt: new Date().toISOString(),
        };

        setActiveSession((prev) =>
          prev ? { ...prev, messages: [...prev.messages, counselorMsg] } : null
        );
      }, 1500);
    } catch (err) {
      console.error("Send message error:", err);
    } finally {
      setIsSendingMessage(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      {/* 1. Active Consultation Room (if in session) */}
      {activeSession && selectedCounselor ? (
        <div className="rounded-3xl bg-white border border-rose-100 shadow-xl overflow-hidden animate-fade-in">
          {/* Room Header */}
          <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                {selectedCounselor.avatarInitials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-white">
                    {selectedCounselor.name}
                  </h2>
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Online & Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {selectedCounselor.title}
                  {selectedCounselor.showLicenseNumber && selectedCounselor.licenseNumber
                    ? ` • ${selectedCounselor.licenseNumber}`
                    : selectedCounselor.isLicensed !== false
                    ? " • Kenya Board Verified"
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCrisis}
                className="text-xs px-3 py-1.5 rounded-xl border border-rose-400/50 text-rose-300 hover:bg-rose-950 transition-colors"
              >
                Urgent Help 24/7
              </button>
              <button
                onClick={() => {
                  setActiveSession(null);
                  setSelectedCounselor(null);
                }}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                End Consultation
              </button>
            </div>
          </div>

          {/* Privacy Guarantee Bar */}
          <div className="bg-emerald-50/80 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% Confidential & Encrypted. Communicating directly with a licensed professional.</span>
            </div>
            <span className="font-mono text-[11px] text-emerald-700 font-bold">
              Session #{activeSession.id.slice(-6)}
            </span>
          </div>

          {/* Messages Feed */}
          <div className="h-[420px] overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
            {activeSession.messages.map((msg) => {
              const isMe = msg.senderRole === "client";
              const isSystem = msg.senderRole === "system";

              if (isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/70 text-xs text-amber-900 text-center max-w-lg mx-auto"
                  >
                    {msg.content}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {selectedCounselor.avatarInitials}
                    </div>
                  )}

                  <div
                    className={`max-w-md p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                      isMe
                        ? "bg-rose-500 text-white rounded-br-none"
                        : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <span
                      className={`text-[10px] block mt-1.5 text-right font-mono ${
                        isMe ? "text-rose-200" : "text-slate-400"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 bg-white border-t border-slate-100 flex items-center gap-3"
          >
            <input
              type="text"
              placeholder={`Type a private message to ${selectedCounselor.name}...`}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 text-xs sm:text-sm px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-rose-500 bg-slate-50/60"
            />
            <button
              type="submit"
              disabled={isSendingMessage || !newMessage.trim()}
              className="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      ) : (
        <>
          {/* Header & Care Pass Unlock Banner */}
          <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-rose-950 p-8 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/30 border border-rose-400/30 text-rose-300 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Licensed Tele-Psychologists
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
                  Direct 1-on-1 Counselors
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Connect 1-on-1 with real, licensed Kenyan psychologists. Private sessions are unlocked by purchasing a Care Gift or Session Pass.
                </p>
              </div>

              {/* Voucher status pill or Store trigger */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 max-w-xs w-full space-y-3">
                {activeVoucher ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Care Pass Active!</span>
                    </div>
                    <p className="font-mono text-sm font-bold text-white tracking-wider">
                      {activeVoucher.code}
                    </p>
                    <span className="text-[11px] text-slate-300 block">
                      {activeVoucher.perkDescription}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Unlock 1-on-1 Access</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Every TFL gift or direct pass unlocks confidential human counselor sessions.
                    </p>
                    <button
                      onClick={onGoToStore}
                      className="w-full py-2.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Get Care Gift in Store</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Voucher Code Redemption Input Bar */}
          {!activeVoucher && (
            <div className="p-6 rounded-3xl bg-white border border-rose-100 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <KeyRound className="w-4 h-4 text-rose-500" />
                  <span>Have a Care Pass Voucher Code?</span>
                </div>
                <span className="text-[11px] text-slate-400">Demo Code: CARE-DEMO-TFL</span>
              </div>

              {voucherError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {voucherError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  ref={voucherInputRef}
                  type="text"
                  placeholder="Enter Voucher Code (e.g. CARE-8F92-TFL)"
                  value={voucherCodeInput}
                  onChange={(e) => setVoucherCodeInput(e.target.value)}
                  className="flex-1 uppercase font-mono text-sm px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 bg-slate-50/50"
                />
                <button
                  onClick={() => handleRedeemVoucher()}
                  disabled={isRedeemingVoucher || !voucherCodeInput.trim()}
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                >
                  {isRedeemingVoucher ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Redeem Care Pass</span>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Counselors Directory */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-rose-500" />
                  Verified Kenyan Counseling Psychologists
                </h2>
                <p className="text-xs text-slate-500">
                  Speak directly with real professionals (not an AI bot).
                </p>
              </div>
              {!activeVoucher && (
                <button
                  onClick={onGoToStore}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Browse gifts to unlock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isLoadingCounselors ? (
              <div className="p-16 text-center text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-rose-400" />
                <p className="text-sm">Connecting to verified counselors...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-3">
                {counselors.map((counselor) => (
                  <div
                    key={counselor.id}
                    className="flex flex-col justify-between rounded-3xl bg-white p-6 border border-rose-100 shadow-sm hover:shadow-md hover:border-rose-300 transition-all duration-200"
                  >
                    <div className="space-y-4">
                      {/* Avatar & Online status */}
                      <div className="flex items-start justify-between">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center text-xl font-bold shadow-sm">
                          {counselor.avatarInitials}
                        </div>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Available
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-slate-900">
                          {counselor.name}
                        </h3>
                        <span className="text-xs text-rose-600 font-semibold block">
                          {counselor.title}
                        </span>
                        {counselor.showLicenseNumber && counselor.licenseNumber ? (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            License: {counselor.licenseNumber}
                          </span>
                        ) : counselor.isLicensed !== false ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Kenya Board Verified
                          </span>
                        ) : null}
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium">
                        🎯 {counselor.specialty}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {counselor.bio}
                      </p>

                      {/* Ratings & Experience */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1 font-bold text-slate-800">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {counselor.rating} Rating
                        </span>
                        <span>{counselor.sessionsCompleted}+ sessions</span>
                      </div>
                    </div>

                    {/* Chat Action Button */}
                    <div className="mt-6 pt-4 space-y-1.5">
                      <button
                        onClick={() => handleInitiateChat(counselor)}
                        disabled={isStartingSession}
                        className={`w-full py-3 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 ${
                          activeVoucher
                            ? "bg-rose-500 hover:bg-rose-600 text-white"
                            : "bg-slate-900 hover:bg-slate-800 text-white"
                        }`}
                      >
                        {activeVoucher ? (
                          <>
                            <MessageCircle className="w-4 h-4" />
                            <span>Start Confidential Chat</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5 text-rose-300" />
                            <span>Chat with {counselor.name.split(" ")[0]}</span>
                          </>
                        )}
                      </button>

                      {!activeVoucher && (
                        <p className="text-[10px] text-center text-slate-400">
                          Real psychologist • Unlocks with Care Gift
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* --- UNLOCK COUNSELING MODAL (Paywall / Care Gift Prompt) --- */}
      {showUnlockModal && pendingCounselor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-100 animate-in fade-in space-y-6">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <Lock className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowUnlockModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold">
                <User className="w-3 h-3 text-teal-600" />
                Real Human Counselor • Not a Bot
              </div>
              <h3 className="text-xl font-bold text-slate-900 leading-snug">
                Unlock 1-on-1 Session with {pendingCounselor.name}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                In SafeSpace, you talk directly with licensed Kenyan psychologists who dedicate real clinical time to you.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sand-50/90 border border-sand-200/80 space-y-2.5 text-xs text-slate-700">
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                How Care Pass Funding Works:
              </p>
              <p className="leading-relaxed">
                To sustainably fund our therapists, sessions are unlocked whenever you purchase any <strong>Care Gift or Merch</strong> (Guided Journals, Hope Hoodies, Serenity Bands, or a direct session pass for <strong>500 KES</strong>).
              </p>
              <p className="text-[11px] text-emerald-800 font-medium bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                🎁 100% of store proceeds sponsor tele-therapy sessions for young people in Kenya.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  onGoToStore();
                }}
                className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Browse Care Gifts & Unlock Session</span>
              </button>

              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setTimeout(() => {
                    voucherInputRef.current?.focus();
                  }, 100);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                <span>I Already Have a Care Pass Code</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
