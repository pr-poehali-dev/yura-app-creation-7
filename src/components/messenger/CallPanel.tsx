import { useState, useEffect, useRef } from "react";
import { Contact } from "@/data/contacts";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CallPanelProps {
  contact: Contact;
  onEnd: () => void;
  type: "audio" | "video";
}

export default function CallPanel({ contact, onEnd, type }: CallPanelProps) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setConnecting(false), 2000);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!connecting) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [connecting]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#0a0b10]/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6 rounded-r-2xl">
      {/* Animated rings */}
      <div className="relative flex items-center justify-center">
        {connecting && (
          <>
            <div className="absolute w-32 h-32 rounded-full border border-violet-500/30 animate-ping" />
            <div className="absolute w-24 h-24 rounded-full border border-violet-500/20 animate-ping [animation-delay:300ms]" />
          </>
        )}
        <div className="w-20 h-20 rounded-full bg-violet-700 flex items-center justify-center text-2xl font-bold text-white z-10">
          {contact.avatar}
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-white">{contact.name}</h2>
        <p className="text-sm text-violet-300 mt-1">
          {connecting
            ? "Соединение..."
            : `${type === "video" ? "Видеозвонок" : "Голосовой звонок"} • ${formatTime(seconds)}`}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-5 mt-4">
        <button
          onClick={() => setMuted((m) => !m)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center transition-all",
            muted
              ? "bg-red-500/80 text-white"
              : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {type === "video" && (
          <button
            onClick={() => setVideoOff((v) => !v)}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all",
              videoOff
                ? "bg-red-500/80 text-white"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            {videoOff ? (
              <VideoOff className="w-5 h-5" />
            ) : (
              <Video className="w-5 h-5" />
            )}
          </button>
        )}

        <button className="w-14 h-14 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all">
          <Volume2 className="w-5 h-5" />
        </button>

        {/* End call */}
        <button
          onClick={onEnd}
          className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-all shadow-lg shadow-red-900/40"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

      <p className="text-xs text-white/20 mt-2 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
        Звонок зашифрован
      </p>
    </div>
  );
}
