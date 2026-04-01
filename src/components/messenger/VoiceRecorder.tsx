import { useState, useRef, useEffect } from "react";
import { Mic, Square, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onSend: (duration: number) => void;
  onCancel: () => void;
}

export default function VoiceRecorder({ onSend, onCancel }: VoiceRecorderProps) {
  const [seconds, setSeconds] = useState(0);
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(4));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    waveRef.current = setInterval(() => {
      setWaveform(Array.from({ length: 20 }, () => Math.random() * 24 + 4));
    }, 120);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (waveRef.current) clearInterval(waveRef.current);
    };
  }, []);

  const format = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-2.5 flex-1">
      {/* Cancel */}
      <button
        onClick={onCancel}
        className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Waveform */}
      <div className="flex items-center gap-0.5 flex-1 h-8">
        {waveform.map((h, i) => (
          <div
            key={i}
            className="w-1 rounded-full bg-violet-400 transition-all duration-100"
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      {/* Timer */}
      <span className="text-sm text-white/60 font-mono flex-shrink-0">{format(seconds)}</span>

      {/* Mic icon */}
      <div className="flex-shrink-0">
        <Mic className="w-4 h-4 text-red-400 animate-pulse" />
      </div>

      {/* Send */}
      <button
        onClick={() => onSend(seconds)}
        className="w-9 h-9 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center text-white transition-all flex-shrink-0"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

interface VoiceMessageProps {
  duration: number;
  isOwn: boolean;
}

export function VoiceMessage({ duration, isOwn }: VoiceMessageProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const format = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const toggle = () => {
    if (playing) {
      setPlaying(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    setPlaying(true);
    setProgress(0);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 100 / (duration * 10);
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        setPlaying(false);
        clearInterval(intervalRef.current!);
      }
    }, 100);
  };

  const bars = Array.from({ length: 28 }, (_, i) => {
    const h = 4 + Math.sin(i * 0.7) * 8 + Math.cos(i * 1.3) * 6;
    return Math.max(4, h);
  });

  const filledBars = Math.floor((progress / 100) * bars.length);

  return (
    <div className={cn("flex items-center gap-2 min-w-[180px]")}>
      <button
        onClick={toggle}
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
          isOwn
            ? "bg-white/20 hover:bg-white/30"
            : "bg-violet-600/60 hover:bg-violet-500/60"
        )}
      >
        {playing ? (
          <Square className="w-3.5 h-3.5 text-white fill-white" />
        ) : (
          <svg className="w-3.5 h-3.5 text-white fill-white ml-0.5" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Bars */}
      <div className="flex items-center gap-0.5 h-8">
        {bars.map((h, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-full transition-colors",
              i < filledBars
                ? isOwn
                  ? "bg-white"
                  : "bg-violet-400"
                : isOwn
                ? "bg-white/40"
                : "bg-white/20"
            )}
            style={{ height: `${h}px` }}
          />
        ))}
      </div>

      <span className="text-xs text-white/60 flex-shrink-0">{format(duration)}</span>
    </div>
  );
}
