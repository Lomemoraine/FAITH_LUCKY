"use client";

import React, { useState, useEffect } from "react";
import { X, Dices, UserCheck, AlertTriangle } from "lucide-react";
import { AVATAR_OPTIONS, generateAnonymousHandle } from "@/lib/identity/pseudonym";
import { PublicProfile } from "@/lib/types";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: PublicProfile;
  onProfileUpdated: (updated: PublicProfile) => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentProfile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [handle, setHandle] = useState(currentProfile.anonymous_handle || "");
  const [selectedAvatar, setSelectedAvatar] = useState(currentProfile.avatar_id || "lotus");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHandle(currentProfile.anonymous_handle || "");
      setSelectedAvatar(currentProfile.avatar_id || "lotus");
      setErrorMessage(null);
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  function handleRollRandom() {
    setHandle(generateAnonymousHandle());
    setErrorMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanHandle = handle.trim().replace(/^@+/, "");
    if (!cleanHandle || cleanHandle.length < 3) {
      setErrorMessage("Handle must be at least 3 characters long.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/anonymous", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonymous_handle: cleanHandle,
          avatar_id: selectedAvatar,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Unable to update pseudonym.");
      } else {
        onProfileUpdated(data.profile);
        onClose();
      }
    } catch {
      setErrorMessage("Network error while updating handle.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg">
              🌸
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Customize Anonymous Identity</h3>
              <p className="text-xs text-slate-500">Every handle is completely unique across SafeSpace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Choose Avatar Icon
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATAR_OPTIONS.map((av) => (
                <button
                  type="button"
                  key={av.id}
                  onClick={() => setSelectedAvatar(av.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all ${
                    selectedAvatar === av.id
                      ? "border-rose-500 bg-rose-50/70 shadow-sm scale-105"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-2xl mb-1">{av.icon}</span>
                  <span className="text-[10px] font-medium text-slate-600 truncate max-w-full">
                    {av.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Pseudonym handle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Your Public Pseudonym
              </label>
              <button
                type="button"
                onClick={handleRollRandom}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
              >
                <Dices className="w-3.5 h-3.5" />
                Roll Suggestion
              </button>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3 text-slate-400 font-bold text-sm">@</span>
              <input
                type="text"
                value={handle.replace(/^@+/, "")}
                onChange={(e) => setHandle(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                maxLength={30}
                placeholder="UniqueHandle"
                required
                className="w-full text-sm pl-8 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Letters, numbers, underscores, and dashes only (3–30 characters).
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              {isSubmitting ? "Saving..." : "Save Identity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
