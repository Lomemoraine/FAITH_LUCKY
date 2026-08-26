"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  EyeOff,
  Trash2,
  UserX,
  CheckCircle,
  Clock,
  RefreshCw,
  Mail,
} from "lucide-react";
import { VoicePlayer } from "@/app/components/voice-player";
import { ModerationCase, ModerationActionType } from "@/lib/types";

export default function ModerationPortal() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [emailInput, setEmailInput] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [cases, setCases] = useState<ModerationCase[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [actionReason, setActionReason] = useState<{ [caseId: string]: string }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setIsLoadingQueue(true);
    try {
      const res = await fetch("/api/moderation/queue");
      const data = await res.json();
      setCases(data.cases || []);
    } catch (err) {
      console.error("Queue load error", err);
    } finally {
      setIsLoadingQueue(false);
    }
  }, []);

  const checkModeratorAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/moderation/auth");
      const data = await res.json();
      if (data.isModerator) {
        setIsAuthenticated(true);
        setUserEmail(data.email || "Moderator");
        loadQueue();
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, [loadQueue]);

  useEffect(() => {
    checkModeratorAuth();
  }, [checkModeratorAuth]);

  async function handleSendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch("/api/moderation/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.error || "Unable to send magic link.");
      } else {
        setMagicLinkSent(true);
      }
    } catch {
      setAuthError("Network error while requesting magic link.");
    }
  }

  async function handleAction(caseId: string, action: ModerationActionType) {
    const reason = actionReason[caseId]?.trim() || `Moderator performed ${action}`;
    setActionLoading(caseId);
    setActionMessage(null);

    try {
      const res = await fetch("/api/moderation/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, action, reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMessage(data.error || "Action failed.");
      } else {
        // Remove case from queue locally
        setCases((prev) => prev.filter((c) => c.id !== caseId));
        setActionMessage(`Action '${action}' applied successfully.`);
      }
    } catch {
      setActionMessage("Network error performing action.");
    } finally {
      setActionLoading(null);
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-500 font-medium">
          <RefreshCw className="w-5 h-5 animate-spin text-terracotta-500" />
          Verifying moderator access...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-xl border border-warm-100 text-center">
          <div className="w-12 h-12 rounded-2xl bg-terracotta-100 flex items-center justify-center text-terracotta-600 mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">TFL Staff Moderation</h1>
          <p className="text-sm text-slate-600 mb-6">
            Authorized staff and clinical monitors sign in with an allowlisted email magic link.
          </p>

          {magicLinkSent ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              <CheckCircle className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
              <p className="font-semibold mb-1">Magic Link Sent</p>
              <p className="text-xs text-emerald-700">
                Please check your inbox at <strong>{emailInput}</strong> and click the link to enter the moderation dashboard.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              <div>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="moderator@talkfreelylifestyle.org"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-terracotta-500 text-sm"
                />
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Magic Link
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100">
            <a href="/" className="text-xs text-slate-500 hover:text-slate-800 font-medium">
              &larr; Return to SafeSpace Community
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-warm-100 sticky top-0 z-20 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-terracotta-500 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg">SafeSpace Moderation Queue</h1>
              <p className="text-xs text-slate-500">Signed in as {userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadQueue}
              disabled={isLoadingQueue}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <a
              href="/"
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-terracotta-50 hover:bg-terracotta-100 text-terracotta-700 transition-colors"
            >
              Public Feed
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {actionMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between">
            <span>{actionMessage}</span>
            <button
              onClick={() => setActionMessage(null)}
              className="text-xs font-bold text-amber-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Active Review Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Items flagged by automated safety screening or community reports.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-200 text-slate-700">
            {cases.length} Open {cases.length === 1 ? "Case" : "Cases"}
          </span>
        </div>

        {isLoadingQueue ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-terracotta-500" />
            <p className="text-sm">Loading queue...</p>
          </div>
        ) : cases.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-warm-100 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Moderation Queue is Clear</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              There are no pending safety flags or reported community submissions requiring human review at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {cases.map((c) => {
              const isCritical = c.severity === "critical";
              const isPriority = c.severity === "priority";

              return (
                <div
                  key={c.id}
                  className={`bg-white rounded-3xl p-6 shadow-sm border transition-all ${
                    isCritical
                      ? "border-rose-300 ring-2 ring-rose-200/60"
                      : isPriority
                      ? "border-amber-300"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          isCritical
                            ? "bg-rose-100 text-rose-800"
                            : isPriority
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {c.severity} severity
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        Source: {c.source === "safety_policy" ? "Crisis Screening" : "Community Report"}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        Target: {c.targetKind}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="bg-sand-50/70 p-4 rounded-2xl border border-sand-200/80 mb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">
                        Author: @{c.targetAuthorHandle || "Anonymous"}
                      </span>
                      {c.reportReason && (
                        <span className="text-xs font-semibold text-rose-700">
                          Reason: {c.reportReason}
                        </span>
                      )}
                    </div>

                    {c.targetContent && (
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {c.targetContent}
                      </p>
                    )}

                    {c.targetAudioUrl && (
                      <div className="pt-2">
                        <VoicePlayer audioUrl={c.targetAudioUrl} />
                      </div>
                    )}
                  </div>

                  {/* Actions & Reason */}
                  <div className="pt-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    <input
                      type="text"
                      placeholder="Audit reason / note for this action..."
                      value={actionReason[c.id] || ""}
                      onChange={(e) =>
                        setActionReason({ ...actionReason, [c.id]: e.target.value })
                      }
                      className="text-xs px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-terracotta-500 w-full md:w-72"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleAction(c.id, "hide")}
                        disabled={actionLoading === c.id}
                        className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        Hide
                      </button>

                      <button
                        onClick={() => handleAction(c.id, "remove")}
                        disabled={actionLoading === c.id}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>

                      <button
                        onClick={() => handleAction(c.id, "suspend")}
                        disabled={actionLoading === c.id}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Suspend Author
                      </button>

                      <button
                        onClick={() => handleAction(c.id, "dismiss")}
                        disabled={actionLoading === c.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Dismiss / Keep
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
