import { Contact } from "@/data/contacts";
import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface ContactListProps {
  contacts: Contact[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  lastMessages: Record<string, string>;
}

const statusColors: Record<string, string> = {
  online: "bg-emerald-400",
  busy: "bg-red-500",
  away: "bg-yellow-400",
  offline: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  online: "онлайн",
  busy: "занят",
  away: "отошёл",
  offline: "офлайн",
};

export default function ContactList({
  contacts,
  selectedId,
  onSelect,
  lastMessages,
}: ContactListProps) {
  return (
    <aside className="w-full md:w-80 flex flex-col bg-[#0f1117] border-r border-white/5 h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-5 h-5 text-violet-400" />
          <h1 className="text-lg font-bold text-white tracking-tight">CipherChat</h1>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск контактов..."
            className="w-full bg-white/5 text-sm text-white placeholder-white/30 rounded-xl px-4 py-2.5 outline-none focus:ring-1 focus:ring-violet-500/50 border border-white/5"
          />
        </div>
      </div>

      {/* Contact Items */}
      <ul className="flex-1 overflow-y-auto scrollbar-thin">
        {contacts.map((c) => (
          <li
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-white/5",
              selectedId === c.id
                ? "bg-violet-600/20 border-l-2 border-l-violet-500"
                : "hover:bg-white/5"
            )}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold text-white",
                  selectedId === c.id ? "bg-violet-600" : "bg-violet-800/60"
                )}
              >
                {c.avatar}
              </div>
              <span
                className={cn(
                  "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0f1117]",
                  statusColors[c.status]
                )}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white truncate">{c.name}</span>
                <span className="text-xs text-white/30 ml-2 flex-shrink-0">
                  {c.status === "online" ? "сейчас" : c.lastSeen || ""}
                </span>
              </div>
              <p className="text-xs text-white/40 truncate mt-0.5">
                {lastMessages[c.id] || statusLabels[c.status]}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Bottom user info */}
      <div className="px-4 py-3 border-t border-white/5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">
          Я
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-white">Вы</p>
          <p className="text-[11px] text-emerald-400">онлайн</p>
        </div>
        <Shield className="w-4 h-4 text-violet-400" title="E2E шифрование активно" />
      </div>
    </aside>
  );
}
