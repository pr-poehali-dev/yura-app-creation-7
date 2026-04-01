import { useState, useCallback } from "react";
import { contacts, Message } from "@/data/contacts";
import ContactList from "@/components/messenger/ContactList";
import ChatWindow from "@/components/messenger/ChatWindow";
import { encryptMessage } from "@/lib/crypto";
import { Menu, X, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

// Pre-fill some demo messages
const DEMO_MESSAGES: Message[] = [
  {
    id: "d1",
    contactId: "1",
    text: "Привет! Как дела?",
    encryptedText: encryptMessage("Привет! Как дела?"),
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isOwn: false,
    type: "text",
  },
  {
    id: "d2",
    contactId: "1",
    text: "Всё хорошо, спасибо! Это защищённый канал 🔒",
    encryptedText: encryptMessage("Всё хорошо, спасибо! Это защищённый канал 🔒"),
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    isOwn: true,
    type: "text",
  },
  {
    id: "d3",
    contactId: "1",
    text: "",
    encryptedText: "",
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
    isOwn: false,
    type: "voice",
    duration: 12,
  },
  {
    id: "d4",
    contactId: "1",
    text: "",
    encryptedText: "",
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    isOwn: true,
    type: "call",
    callStatus: "outgoing",
    duration: 185,
  },
  {
    id: "d5",
    contactId: "2",
    text: "Не забудь про встречу завтра",
    encryptedText: encryptMessage("Не забудь про встречу завтра"),
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    isOwn: false,
    type: "text",
  },
];

const Index = () => {
  const [selectedContactId, setSelectedContactId] = useState<string | null>("1");
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedContact = contacts.find((c) => c.id === selectedContactId) || null;

  const contactMessages = messages.filter((m) => m.contactId === selectedContactId);

  // Last message preview for sidebar
  const lastMessages: Record<string, string> = {};
  contacts.forEach((c) => {
    const msgs = messages.filter((m) => m.contactId === c.id);
    if (msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      if (last.type === "voice") lastMessages[c.id] = "🎤 Голосовое сообщение";
      else if (last.type === "call") lastMessages[c.id] = "📞 Звонок";
      else lastMessages[c.id] = last.text.slice(0, 32) + (last.text.length > 32 ? "…" : "");
    }
  });

  const handleSendMessage = useCallback(
    (text: string, encrypted: string) => {
      if (!selectedContactId) return;
      const msg: Message = {
        id: Date.now().toString(),
        contactId: selectedContactId,
        text,
        encryptedText: encrypted,
        timestamp: new Date(),
        isOwn: true,
        type: "text",
      };
      setMessages((prev) => [...prev, msg]);
    },
    [selectedContactId]
  );

  const handleSendVoice = useCallback(
    (duration: number) => {
      if (!selectedContactId) return;
      const msg: Message = {
        id: Date.now().toString(),
        contactId: selectedContactId,
        text: "",
        encryptedText: "",
        timestamp: new Date(),
        isOwn: true,
        type: "voice",
        duration,
      };
      setMessages((prev) => [...prev, msg]);
    },
    [selectedContactId]
  );

  const handleCallStart = useCallback(
    (type: "audio" | "video") => {
      if (!selectedContactId) return;
      // Log call event as message after a short delay
      setTimeout(() => {
        const msg: Message = {
          id: Date.now().toString(),
          contactId: selectedContactId,
          text: "",
          encryptedText: "",
          timestamp: new Date(),
          isOwn: true,
          type: "call",
          callStatus: "outgoing",
          duration: 0,
        };
        setMessages((prev) => [...prev, msg]);
      }, 500);
    },
    [selectedContactId]
  );

  return (
    <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center p-0 md:p-4">
      <div className="w-full h-screen md:h-[90vh] md:max-w-5xl md:rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-2xl shadow-black/60 border border-white/5 relative">
        {/* Mobile sidebar toggle */}
        <button
          className="md:hidden absolute top-4 left-4 z-50 w-9 h-9 bg-violet-600/80 rounded-full flex items-center justify-center text-white"
          onClick={() => setSidebarOpen((v) => !v)}
        >
          {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Sidebar */}
        <div
          className={cn(
            "absolute md:relative z-40 h-full transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
          style={{ width: "320px" }}
        >
          <ContactList
            contacts={contacts}
            selectedId={selectedContactId}
            onSelect={(id) => {
              setSelectedContactId(id);
              setSidebarOpen(false);
            }}
            lastMessages={lastMessages}
          />
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {selectedContact ? (
            <ChatWindow
              contact={selectedContact}
              messages={contactMessages}
              onSendMessage={handleSendMessage}
              onSendVoice={handleSendVoice}
              onCallStart={handleCallStart}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 bg-[#13141c]">
              <Shield className="w-16 h-16 text-violet-500/30" />
              <div>
                <h2 className="text-lg font-semibold text-white/40">CipherChat</h2>
                <p className="text-sm text-white/20 mt-1">
                  Выберите контакт для начала защищённого общения
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
