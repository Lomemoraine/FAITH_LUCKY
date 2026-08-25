"use client";

import React, { useState } from "react";
import { AlertTriangle, X, Shield, CheckCircle2 } from "lucide-react";
import { ReportReason } from "@/lib/types";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetKind: "post" | "reply";
  targetId: string;
  targetAuthorHandle?: string;
  onReportSuccess?: () => void;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: "harassment", label: "Harassment or Bullying", description: "Targeting someone with harmful, offensive, or threatening messages." },
  { value: "hate", label: "Hate Speech", description: "Attacking identity, race, religion, gender, or vulnerable groups." },
  { value: "crisis_concern", label: "Crisis or Self-Harm Concern", description: "Expressing thoughts of self-harm, severe distress, or emergency need." },
  { value: "dangerous_advice", label: "Harmful or Dangerous Advice", description: "Unsafe medical suggestions or instructions that cause risk." },
  { value: "privacy", label: "Privacy Violation", description: "Sharing personal phone numbers, names, or identifiable details." },
  { value: "spam", label: "Spam or Promotion", description: "Commercial advertising, scams, or irrelevant repetitive posts." },
  { value: "other", label: "Other Policy Violation", description: "Other behavior conflicting with community guidelines." },
];

export function ReportModal({
  isOpen,
  onClose,
  targetKind,
  targetId,
  targetAuthorHandle,
  onReportSuccess,
}: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason>("harassment");
  const [context, setContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/community/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetKind,
          targetId,
          reason: selectedReason,
          context: context.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Unable to submit report.");
      } else {
        setIsSubmitted(true);
        if (onReportSuccess) onReportSuccess();
      }
    } catch {
      setErrorMessage("Network error while submitting report.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetAndClose() {
    setIsSubmitted(false);
    setContext("");
    setErrorMessage(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                Report {targetKind === "post" ? "Post" : "Reply"}
              </h3>
              {targetAuthorHandle && (
                <p className="text-xs text-slate-500">By @{targetAuthorHandle}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            aria-label="Close dialog"
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Thank You For Keeping SafeSpace Safe</h4>
            <p className="text-xs text-slate-600 mb-6">
              Our moderation team has received your report and will review this content promptly against our community guidelines.
            </p>
            <button
              onClick={handleResetAndClose}
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Why are you reporting this {targetKind}? Please select the closest reason:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    selectedReason === r.value
                      ? "border-terracotta-500 bg-terracotta-50/50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={selectedReason === r.value}
                    onChange={() => setSelectedReason(r.value)}
                    className="mt-1 text-terracotta-600 focus:ring-terracotta-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{r.label}</div>
                    <div className="text-[11px] text-slate-500">{r.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Additional context (optional):
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                maxLength={300}
                placeholder="Optional details to help human moderators review..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-terracotta-500 resize-none h-16"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
