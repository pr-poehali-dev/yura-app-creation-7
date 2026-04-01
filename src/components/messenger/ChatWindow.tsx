import { useState, useEffect, useRef } from "react";
import { Contact, Message } from "@/data/contacts";
import {
  Phone,
  Video,
  Info,
  Send,
  Mic,
  Lock,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
} from "lucide-react";
import { encryptMessage } from "@/lib/crypto";
import { cn } from "@/lib/utils";
import CallPanel from "./CallPanel";
import VoiceRecorder, { VoiceMessage } from "./VoiceRecorder";

interface ChatWindowProps {
  contact: Contact;
  messages: Message[];
  onSendMessage: (text: string, encrypted: string) => void;
  onSendVoice: (duration: number) => void;
  onCallStart: (type: "audio" | "video") => void;
}

export default function ChatWindow({
  contact,
  messages,
  onSendMessage,
  onSendVoice,
  onCallStart,
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [recording, setRecording] = useState(false);
  const [activeCall, setActiveCall] = useState<null | "audio" | "video">(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    const encrypted = encryptMessage(trimmed);
    onSendMessage(trimmed, encrypted);
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const statusColors: Record<string, string> = {
    online: "text-emerald-400",
    busy: "text-red-400",
    away: "text-yellow-400",
    offline: "text-gray-400",
  };
  const statusLabels: Record<string, string> = {
    online: "онлайн",
    busy: "занят",
    away: "отошёл",
    offline: `был(а) ${contact.lastSeen || "давно"}`,
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-[#13141c] relative overflow-hidden">
      {/* Active call overlay */}
      {activeCall && (
        <CallPanel
          contact={contact}
          type={activeCall}
          onEnd={() => setActiveCall(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 bg-[#0f1117]/80 backdrop-blur-sm flex-shrink-0">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-violet-700 flex items-center justify-center text-sm font-bold text-white">
            {contact.avatar}
          </div>
          <span
            className={cn(
              "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0f1117]",
              contact.status === "online"
                ? "bg-emerald-400"
                : contact.status === "busy"
                ? "bg-red-500"
                : contact.status === "away"
                ? "bg-yellow-400"
                : "bg-gray-500"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-white leading-tight">{contact.name}</h2>
          <p className={cn("text-xs", statusColors[contact.status])}>
            {statusLabels[contact.status]}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setActiveCall("audio"); onCallStart("audio"); }}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            title="Голосовой звонок"
          >
            <Phone className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => { setActiveCall("video"); onCallStart("video"); }}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all"
            title="Видеозвонок"
          >
            <Video className="w-4.5 h-4.5" />
          </button>
          <button className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all">
            <Info className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-white/20">
            <Lock className="w-10 h-10" />
            <p className="text-sm">Начните разговор</p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col gap-1 max-w-[75%]",
              msg.isOwn ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            {msg.type === "call" ? (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5">
                {msg.callStatus === "incoming" ? (
                  <PhoneIncoming className="w-4 h-4 text-emerald-400" />
                ) : msg.callStatus === "outgoing" ? (
                  <PhoneOutgoing className="w-4 h-4 text-blue-400" />
                ) : (
                  <PhoneMissed className="w-4 h-4 text-red-400" />
                )}
                <span className="text-sm text-white/70">
                  {msg.callStatus === "incoming"
                    ? "Входящий звонок"
                    : msg.callStatus === "outgoing"
                    ? "Исходящий звонок"
                    : "Пропущенный звонок"}
                </span>
                {msg.duration && (
                  <span className="text-xs text-white/40">
                    {Math.floor(msg.duration / 60)}:{String(msg.duration % 60).padStart(2, "0")}
                  </span>
                )}
              </div>
            ) : msg.type === "voice" ? (
              <div
                className={cn(
                  "px-3 py-2.5 rounded-2xl",
                  msg.isOwn
                    ? "bg-violet-600 rounded-br-sm"
                    : "bg-white/8 border border-white/5 rounded-bl-sm"
                )}
              >
                <VoiceMessage duration={msg.duration || 5} isOwn={msg.isOwn} />
              </div>
            ) : (
              <div
                className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm text-white leading-relaxed",
                  msg.isOwn
                    ? "bg-violet-600 rounded-br-sm"
                    : "bg-white/8 border border-white/5 rounded-bl-sm"
                )}
              >
                {msg.text}
              </div>
            )}

            <span className="text-[10px] text-white/25 px-1">
              {msg.timestamp.toLocaleTimeString("ru", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t border-white/5 bg-[#0f1117]/80 flex-shrink-0">
        {recording ? (
          <VoiceRecorder
            onSend={(dur) => {
              setRecording(false);
              onSendVoice(dur);
            }}
            onCancel={() => setRecording(false)}
          />
        ) : (
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Написать сообщение..."
                rows={1}
                className="w-full bg-white/5 border border-white/8 text-white text-sm placeholder-white/25 rounded-2xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-violet-500/50 resize-none min-h-[44px] max-h-32 leading-relaxed"
                style={{ height: "auto" }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = Math.min(el.scrollHeight, 128) + "px";
                }}
              />
              <Lock className="absolute right-3 bottom-3 w-3.5 h-3.5 text-violet-500/40" />
            </div>

            <button
              onClick={() => setRecording(true)}
              className="w-11 h-11 rounded-full bg-white/5 border border-white/8 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-violet-400 transition-all flex-shrink-0"
              title="Голосовое сообщение"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all flex-shrink-0"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </div>
        )}

        <p className="text-center text-[10px] text-white/15 mt-2 flex items-center justify-center gap-1">
          <Lock className="w-2.5 h-2.5" /> Ключ шифрования обновится через {keyTimer} сек
        </p>
      </div>
    </div>
  );
}