import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateKeyPair, generateSigningKeyPair, generateSalt } from '../crypto/encryption';
import { v4 as uuidv4 } from 'uuid';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'sticker' | 'voice';
export type ChatType = 'private' | 'group' | 'channel';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  publicKey: string;
  signingPublicKey: string;
  isOnline: boolean;
  lastSeen: number;
  isVerified?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  content: string;
  encryptedContent?: string;
  timestamp: number;
  status: MessageStatus;
  replyTo?: string;
  reactions?: Record<string, string[]>;
  isEdited?: boolean;
  editedAt?: number;
  isDeleted?: boolean;
  forwardedFrom?: string;
  ttl?: number; // Self-destruct timer in seconds
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  avatar?: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
  encryptionEnabled: boolean;
  groupKey?: string;
  createdAt: number;
  description?: string;
  memberCount?: number;
}

export interface CurrentUser extends User {
  privateKey: string;
  signingPrivateKey: string;
  salt: string;
  passwordHash?: string;
}

interface AppStore {
  // Auth
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  
  // Chats
  chats: Chat[];
  activeChat: string | null;
  
  // Messages
  messages: Record<string, Message[]>;
  
  // Contacts
  contacts: User[];
  
  // UI State
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  searchQuery: string;
  
  // Notifications
  notificationsEnabled: boolean;
  soundEnabled: boolean;

  // Actions - Auth
  register: (username: string, displayName: string, password: string, phone?: string) => CurrentUser;
  login: (user: CurrentUser) => void;
  logout: () => void;
  updateProfile: (updates: Partial<CurrentUser>) => void;

  // Actions - Chats
  createChat: (participants: string[], type?: ChatType, name?: string) => Chat;
  setActiveChat: (chatId: string | null) => void;
  pinChat: (chatId: string) => void;
  muteChat: (chatId: string) => void;
  archiveChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  markAsRead: (chatId: string) => void;

  // Actions - Messages
  sendMessage: (chatId: string, content: string, type?: MessageType, replyTo?: string, ttl?: number) => Message;
  editMessage: (chatId: string, messageId: string, newContent: string) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
  addReaction: (chatId: string, messageId: string, emoji: string) => void;

  // Actions - Contacts
  addContact: (user: User) => void;
  removeContact: (userId: string) => void;

  // Actions - UI
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  toggleNotifications: () => void;
  toggleSound: () => void;
}

// Generate demo contacts
const generateDemoContact = (
  id: string,
  username: string,
  displayName: string,
  bio: string,
  isOnline: boolean,
  avatar?: string
): User => {
  const keyPair = generateKeyPair();
  const signingKP = generateSigningKeyPair();
  return {
    id,
    username,
    displayName,
    bio,
    avatar,
    publicKey: keyPair.publicKey,
    signingPublicKey: signingKP.publicKey,
    isOnline,
    lastSeen: isOnline ? Date.now() : Date.now() - Math.random() * 3600000,
    isVerified: Math.random() > 0.7,
  };
};

const demoContacts: User[] = [
  generateDemoContact('contact-1', 'ahmed_k', 'أحمد خالد', 'مطور برمجيات | محب للتقنية 💻', true),
  generateDemoContact('contact-2', 'sara_m', 'سارة محمد', 'مصممة جرافيك 🎨', false),
  generateDemoContact('contact-3', 'omar_t', 'عمر طارق', 'رياضي | لاعب كرة قدم ⚽', true),
  generateDemoContact('contact-4', 'layla_a', 'ليلى أحمد', 'طالبة جامعية 📚', true),
  generateDemoContact('contact-5', 'yusuf_n', 'يوسف ناصر', 'مصور فوتوغرافي 📷', false),
  generateDemoContact('contact-6', 'nour_h', 'نور الهدى', 'كاتبة ومدونة ✍️', true),
  generateDemoContact('contact-7', 'khalid_r', 'خالد الرشيد', 'مهندس معماري 🏗️', false),
];

const createDemoMessages = (chatId: string, senderId: string, myId: string): Message[] => {
  const msgs: Message[] = [
    {
      id: uuidv4(),
      chatId,
      senderId: senderId,
      type: 'text',
      content: 'السلام عليكم! 👋',
      timestamp: Date.now() - 3600000,
      status: 'read',
    },
    {
      id: uuidv4(),
      chatId,
      senderId: myId,
      type: 'text',
      content: 'وعليكم السلام! كيف حالك؟',
      timestamp: Date.now() - 3500000,
      status: 'read',
    },
    {
      id: uuidv4(),
      chatId,
      senderId: senderId,
      type: 'text',
      content: 'بخير الحمد لله! أنت؟ 😊',
      timestamp: Date.now() - 3400000,
      status: 'read',
    },
    {
      id: uuidv4(),
      chatId,
      senderId: myId,
      type: 'text',
      content: 'تمام شكراً! قلتلك على هذا التطبيق الجديد K؟ 🔐',
      timestamp: Date.now() - 3300000,
      status: 'read',
    },
    {
      id: uuidv4(),
      chatId,
      senderId: senderId,
      type: 'text',
      content: 'ايه هو؟ يبدو مثير للاهتمام!',
      timestamp: Date.now() - 3200000,
      status: 'read',
    },
    {
      id: uuidv4(),
      chatId,
      senderId: myId,
      type: 'text',
      content: 'تطبيق مراسلة مشفر بالكامل! يستخدم تشفير X25519 + XSalsa20 🛡️',
      timestamp: Date.now() - 3100000,
      status: 'read',
      reactions: { '🔥': [senderId], '👍': [senderId] },
    },
    {
      id: uuidv4(),
      chatId,
      senderId: senderId,
      type: 'text',
      content: 'رائع! هذا أمان عالي جداً 🚀',
      timestamp: Date.now() - 300000,
      status: 'read',
    },
  ];
  return msgs;
};

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      chats: [],
      activeChat: null,
      messages: {},
      contacts: demoContacts,
      theme: 'dark',
      sidebarOpen: true,
      searchQuery: '',
      notificationsEnabled: true,
      soundEnabled: true,

      register: (username, displayName, password, phone) => {
        const keyPair = generateKeyPair();
        const signingKP = generateSigningKeyPair();
        const salt = generateSalt();

        const newUser: CurrentUser = {
          id: uuidv4(),
          username,
          displayName,
          phone,
          publicKey: keyPair.publicKey,
          privateKey: keyPair.privateKey,
          signingPublicKey: signingKP.publicKey,
          signingPrivateKey: signingKP.privateKey,
          salt,
          isOnline: true,
          lastSeen: Date.now(),
          bio: '',
        };

        // Create demo chats
        const demoChats: Chat[] = demoContacts.slice(0, 5).map((contact, i) => ({
          id: uuidv4(),
          type: 'private' as ChatType,
          participants: [newUser.id, contact.id],
          unreadCount: i < 2 ? Math.floor(Math.random() * 5) + 1 : 0,
          isPinned: i === 0,
          isMuted: false,
          isArchived: false,
          encryptionEnabled: true,
          createdAt: Date.now() - i * 86400000,
        }));

        // Group chat
        const groupChat: Chat = {
          id: uuidv4(),
          type: 'group',
          name: 'مجموعة العائلة 👨‍👩‍👧‍👦',
          participants: [newUser.id, ...demoContacts.slice(0, 4).map(c => c.id)],
          unreadCount: 3,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          encryptionEnabled: true,
          groupKey: undefined,
          createdAt: Date.now() - 86400000 * 7,
          description: 'مجموعة عائلية خاصة',
          memberCount: 5,
        };

        const allChats = [...demoChats, groupChat];

        // Create demo messages for each chat
        const allMessages: Record<string, Message[]> = {};
        demoChats.forEach((chat, i) => {
          const msgs = createDemoMessages(chat.id, demoContacts[i].id, newUser.id);
          allMessages[chat.id] = msgs;
          chat.lastMessage = msgs[msgs.length - 1];
        });

        const groupMsgs: Message[] = [
          {
            id: uuidv4(),
            chatId: groupChat.id,
            senderId: demoContacts[0].id,
            type: 'text',
            content: 'أهلاً وسهلاً بالجميع في المجموعة! 🎉',
            timestamp: Date.now() - 86400000,
            status: 'read',
          },
          {
            id: uuidv4(),
            chatId: groupChat.id,
            senderId: demoContacts[1].id,
            type: 'text',
            content: 'أهلاً! يسعدنا وجودكم 😊',
            timestamp: Date.now() - 82800000,
            status: 'read',
          },
          {
            id: uuidv4(),
            chatId: groupChat.id,
            senderId: newUser.id,
            type: 'text',
            content: 'شكراً للجميع ❤️',
            timestamp: Date.now() - 79200000,
            status: 'read',
          },
          {
            id: uuidv4(),
            chatId: groupChat.id,
            senderId: demoContacts[2].id,
            type: 'text',
            content: 'متى موعد اللقاء القادم؟',
            timestamp: Date.now() - 3600000,
            status: 'delivered',
          },
        ];
        allMessages[groupChat.id] = groupMsgs;
        groupChat.lastMessage = groupMsgs[groupMsgs.length - 1];

        set({
          currentUser: newUser,
          isAuthenticated: true,
          chats: allChats,
          messages: allMessages,
        });

        return newUser;
      },

      login: (user) => set({ currentUser: user, isAuthenticated: true }),

      logout: () => set({ currentUser: null, isAuthenticated: false, activeChat: null }),

      updateProfile: (updates) => {
        const { currentUser } = get();
        if (currentUser) {
          set({ currentUser: { ...currentUser, ...updates } });
        }
      },

      createChat: (participants, type = 'private', name) => {
        const newChat: Chat = {
          id: uuidv4(),
          type,
          name,
          participants,
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
          encryptionEnabled: true,
          createdAt: Date.now(),
        };
        set(state => ({ chats: [newChat, ...state.chats] }));
        return newChat;
      },

      setActiveChat: (chatId) => {
        set({ activeChat: chatId });
        if (chatId) get().markAsRead(chatId);
      },

      pinChat: (chatId) => {
        set(state => ({
          chats: state.chats.map(c => c.id === chatId ? { ...c, isPinned: !c.isPinned } : c),
        }));
      },

      muteChat: (chatId) => {
        set(state => ({
          chats: state.chats.map(c => c.id === chatId ? { ...c, isMuted: !c.isMuted } : c),
        }));
      },

      archiveChat: (chatId) => {
        set(state => ({
          chats: state.chats.map(c => c.id === chatId ? { ...c, isArchived: !c.isArchived } : c),
        }));
      },

      deleteChat: (chatId) => {
        set(state => ({
          chats: state.chats.filter(c => c.id !== chatId),
          messages: Object.fromEntries(Object.entries(state.messages).filter(([id]) => id !== chatId)),
          activeChat: state.activeChat === chatId ? null : state.activeChat,
        }));
      },

      markAsRead: (chatId) => {
        set(state => ({
          chats: state.chats.map(c => c.id === chatId ? { ...c, unreadCount: 0 } : c),
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(m => ({
              ...m,
              status: m.status !== 'read' ? 'read' as MessageStatus : m.status,
            })),
          },
        }));
      },

      sendMessage: (chatId, content, type = 'text', replyTo, ttl) => {
        const { currentUser } = get();
        const newMessage: Message = {
          id: uuidv4(),
          chatId,
          senderId: currentUser?.id || 'unknown',
          type,
          content,
          timestamp: Date.now(),
          status: 'sent',
          replyTo,
          ttl,
        };

        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: [...(state.messages[chatId] || []), newMessage],
          },
          chats: state.chats.map(c =>
            c.id === chatId ? { ...c, lastMessage: newMessage } : c
          ),
        }));

        // Simulate delivery after 500ms
        setTimeout(() => {
          set(state => ({
            messages: {
              ...state.messages,
              [chatId]: (state.messages[chatId] || []).map(m =>
                m.id === newMessage.id ? { ...m, status: 'delivered' } : m
              ),
            },
          }));
        }, 500);

        // Auto-delete if TTL set
        if (ttl && ttl > 0) {
          setTimeout(() => {
            get().deleteMessage(chatId, newMessage.id);
          }, ttl * 1000);
        }

        return newMessage;
      },

      editMessage: (chatId, messageId, newContent) => {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(m =>
              m.id === messageId
                ? { ...m, content: newContent, isEdited: true, editedAt: Date.now() }
                : m
            ),
          },
        }));
      },

      deleteMessage: (chatId, messageId) => {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(m =>
              m.id === messageId ? { ...m, isDeleted: true, content: '' } : m
            ),
          },
        }));
      },

      addReaction: (chatId, messageId, emoji) => {
        const { currentUser } = get();
        if (!currentUser) return;

        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] || []).map(m => {
              if (m.id !== messageId) return m;
              const reactions = { ...(m.reactions || {}) };
              if (reactions[emoji]?.includes(currentUser.id)) {
                reactions[emoji] = reactions[emoji].filter(id => id !== currentUser.id);
                if (reactions[emoji].length === 0) delete reactions[emoji];
              } else {
                reactions[emoji] = [...(reactions[emoji] || []), currentUser.id];
              }
              return { ...m, reactions };
            }),
          },
        }));
      },

      addContact: (user) => {
        set(state => ({ contacts: [...state.contacts, user] }));
      },

      removeContact: (userId) => {
        set(state => ({ contacts: state.contacts.filter(c => c.id !== userId) }));
      },

      toggleTheme: () => {
        set(state => ({ theme: state.theme === 'dark' ? 'light' : 'dark' }));
      },

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleNotifications: () => set(state => ({ notificationsEnabled: !state.notificationsEnabled })),
      toggleSound: () => set(state => ({ soundEnabled: !state.soundEnabled })),
    }),
    {
      name: 'k-app-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        chats: state.chats,
        messages: state.messages,
        contacts: state.contacts,
        theme: state.theme,
      }),
    }
  )
);
