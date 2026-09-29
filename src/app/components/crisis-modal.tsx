"use client";

import React from "react";
import { PhoneCall, X, ShieldAlert, Heart } from "lucide-react";
import { KENYA_CRISIS_RESOURCES } from "@/lib/safety/policy";

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function CrisisModal({
  isOpen,
  onClose,
  title = "You Are Not Alone. Support Is Available Right Now.",
  subtitle = "If you or someone you know is going through a difficult time, please reach out to these free, confidential Kenyan helplines staffed by caring counselors.",
}: CrisisModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-rose-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-snug">{title}</h3>
              <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                24/7 Verified Kenya Helplines
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close crisis dialog"
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {subtitle}
        </p>

        <div className="space-y-3 mb-6">
          {KENYA_CRISIS_RESOURCES.map((res) => (
            <a
              key={res.name}
              href={`tel:${res.phone}`}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-rose-50/70 to-amber-50/50 hover:from-rose-100 hover:to-amber-100/80 border border-rose-100 transition-all shadow-sm"
            >
              <div className="mb-2 sm:mb-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-slate-900 text-sm">{res.name}</h4>
                  {res.tollFree && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Toll Free
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">{res.description}</p>
                <p className="text-xs font-medium text-rose-700 mt-1">{res.availableHours}</p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                <span className="font-bold text-rose-700 group-hover:underline text-sm">
                  {res.displayPhone}
                </span>
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 mb-6 space-y-1.5">
          <p className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            TFL SafeSpace Community Notice
          </p>
          <p>
            TFL SafeSpace provides anonymous peer-to-peer encouragement and community connection. It is not an emergency response dispatch, a medical diagnostic platform, or a substitute for professional clinical care.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors shadow-sm"
          >
            I Understand & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
