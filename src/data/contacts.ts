export interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: "online" | "offline" | "busy" | "away";
  lastSeen?: string;
  phone: string;
}

export interface Message {
  id: string;
  contactId: string;
  text: string;
  encryptedText: string;
  timestamp: Date;
  isOwn: boolean;
  type: "text" | "voice" | "call";
  duration?: number; // for voice/call in seconds
  voiceUrl?: string;
  callStatus?: "incoming" | "outgoing" | "missed";
}

export const contacts: Contact[] = [
  {
    id: "1",
    name: "Алексей Смирнов",
    avatar: "АС",
    status: "online",
    phone: "+7 900 123-45-67",
  },
  {
    id: "2",
    name: "Мария Иванова",
    avatar: "МИ",
    status: "busy",
    lastSeen: "2 мин назад",
    phone: "+7 900 234-56-78",
  },
  {
    id: "3",
    name: "Дмитрий Козлов",
    avatar: "ДК",
    status: "away",
    lastSeen: "15 мин назад",
    phone: "+7 900 345-67-89",
  },
  {
    id: "4",
    name: "Анна Петрова",
    avatar: "АП",
    status: "offline",
    lastSeen: "вчера",
    phone: "+7 900 456-78-90",
  },
  {
    id: "5",
    name: "Игорь Новиков",
    avatar: "ИН",
    status: "online",
    phone: "+7 900 567-89-01",
  },
];
