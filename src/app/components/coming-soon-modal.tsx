"use client";

import React from "react";
import { Sparkles, X, HeartHandshake, ShieldCheck } from "lucide-react";

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  badgeText?: string;
  features?: string[];
}

export function ComingSoonModal({
  isOpen,
  onClose,
  title,
  description,
  badgeText = "Feature In Development",
  features = [],
}: ComingSoonModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-warm-100 relative">
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-warm-100 flex items-center justify-center text-warm-600 mb-4">
          <HeartHandshake className="w-6 h-6" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-terracotta-50 text-terracotta-700 border border-terracotta-200 mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          {badgeText}
        </span>

        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {description}
        </p>

        {features.length > 0 && (
          <div className="bg-sand-50 rounded-2xl p-4 mb-6 border border-sand-200/60 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              What We Are Building:
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="w-full px-5 py-3 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-semibold transition-colors shadow-sm"
          >
            Got It, Back to SafeSpace
          </button>
        </div>
      </div>
    </div>
  );
}
