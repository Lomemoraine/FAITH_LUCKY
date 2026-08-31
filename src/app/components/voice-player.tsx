"use client";

import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, AlertCircle, RefreshCw } from "lucide-react";

interface VoicePlayerProps {
  audioUrl: string;
  duration?: number | null;
}

export function VoicePlayer({ audioUrl, duration }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState<number>(duration || 0);
  const [hasError, setHasError] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setHasError(false);
    setIsPlaying(false);
    setCurrentTime(0);

    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = "metadata";
    audio.src = audioUrl;

    audio.onloadedmetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    audio.ondurationchange = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(Math.round(audio.currentTime));
      if ((!totalDuration || totalDuration === 0) && audio.duration && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.onerror = (e) => {
      console.warn("[VoicePlayer] Audio load error:", e);
      setHasError(true);
      setIsPlaying(false);
      setIsLoading(false);
    };

    audio.oncanplay = () => {
      setIsLoading(false);
    };

    return () => {
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [audioUrl]);

  async function togglePlay() {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasError(false);
      setIsLoading(true);
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("[VoicePlayer] Playback error:", err);
        setHasError(true);
        setIsPlaying(false);
      } finally {
        setIsLoading(false);
      }
    }
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const seekTime = Number(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  }

  function formatTime(seconds: number) {
    if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-sm w-full max-w-md">
      <button
        type="button"
        onClick={togglePlay}
        disabled={isLoading}
        className="w-10 h-10 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white flex items-center justify-center transition-all shadow-sm shrink-0"
        aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
          <span className="flex items-center gap-1 font-bold text-rose-700">
            <Volume2 className="w-3.5 h-3.5" />
            Voice Note
          </span>
          <span className="font-mono text-[10px] text-slate-500">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
        </div>

        {/* Progress Bar & Animated Waveform */}
        <div className="relative flex items-center h-4">
          <input
            type="range"
            min={0}
            max={totalDuration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
          />
        </div>

        {hasError && (
          <div className="flex items-center gap-1 text-[10px] text-rose-600 font-medium">
            <AlertCircle className="w-3 h-3" />
            <span>Audio stream failed to load.</span>
          </div>
        )}
      </div>

      {/* Animated Sound Bars */}
      <div className="flex items-center gap-0.5 h-5 shrink-0 px-1" aria-hidden="true">
        {[40, 90, 60, 100, 70, 30].map((h, i) => (
          <div
            key={i}
            style={{
              height: isPlaying ? `${Math.max(25, (h * (currentTime + i + 1)) % 100)}%` : `${h * 0.4}%`,
            }}
            className={`w-1 rounded-full transition-all duration-200 ${
              isPlaying ? "bg-rose-500" : "bg-rose-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
