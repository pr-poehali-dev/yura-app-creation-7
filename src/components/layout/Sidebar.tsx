import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Edit, Settings, Archive, Bookmark, Users,
  Moon, Sun, LogOut, Bell, BellOff, Pin, Volume2, VolumeX,
  ChevronDown, Shield, MessageCircle, Phone, Tv, User, X, Check, Plus
} from 'lucide-react';
import { useStore, Chat, User as UserType } from '../../store/useStore';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import NewChatDialog from '../chat/NewChatDialog';

interface SidebarProps {
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const {
    currentUser, chats, contacts, activeChat, messages,
    setActiveChat, theme, toggleTheme, logout,
    searchQuery, setSearchQuery, pinChat, muteChat, archiveChat, deleteChat
  } = useStore();

  const [showMenu, setShowMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ chatId: string; x: number; y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
  const [showNewChat, setShowNewChat] = useState(false);

  const getContactById = (id: string): UserType | undefined =>
    contacts.find(c => c.id === id) || (currentUser?.id === id ? currentUser as UserType : undefined);

  const getChatName = (chat: Chat): string => {
    if (chat.type === 'group' || chat.type === 'channel') return chat.name || 'مجموعة';
    const otherId = chat.participants.find(id => id !== currentUser?.id);
    const contact = getContactById(otherId || '');
    return contact?.displayName || 'مجهول';
  };

  const getChatAvatar = (chat: Chat): string | undefined => {
    if (chat.type !== 'private') return chat.avatar;
    const otherId = chat.participants.find(id => id !== currentUser?.id);
    return getContactById(otherId || '')?.avatar;
  };

  const getInitials = (name: string): string => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (name: string): string => {
    const colors = [
      'from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500', 'from-orange-500 to-red-500',
      'from-indigo-500 to-blue-500', 'from-teal-500 to-green-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  const isOnline = (chat: Chat): boolean => {
    if (chat.type !== 'private') return false;
    const otherId = chat.participants.find(id => id !== currentUser?.id);
    return getContactById(otherId || '')?.isOnline || false;
  };

  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return '';
    const now = Date.now();
    const diff = now - timestamp;
    if (diff < 60000) return 'الآن';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}د`;
    if (diff < 86400000) {
      const date = new Date(timestamp);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    return formatDistanceToNow(timestamp, { locale: ar, addSuffix: false });
  };

  const filteredChats = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return chats
      .filter(c => !c.isArchived)
      .filter(c => {
        if (!q) return true;
        const name = getChatName(c).toLowerCase();
        const last = c.lastMessage?.content?.toLowerCase() || '';
        return name.includes(q) || last.includes(q);
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const aTime = a.lastMessage?.timestamp || a.createdAt;
        const bTime = b.lastMessage?.timestamp || b.createdAt;
        return bTime - aTime;
      });
  }, [chats, searchQuery, contacts]);

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    setContextMenu({ chatId, x: e.clientX, y: e.clientY });
  };

  return (
    <div className={`h-full flex flex-col ${theme === 'dark' ? 'bg-[#17212B]' : 'bg-[#F5F5F5]'} relative`}>
      {/* Header */}
      <div className={`px-4 pt-4 pb-3 ${theme === 'dark' ? 'border-b border-white/5' : 'border-b border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="relative"
            >
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(currentUser?.displayName || 'K')} flex items-center justify-center text-white font-bold text-sm`}>
                {getInitials(currentUser?.displayName || 'K')}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#17212B]" />
            </button>

            <div>
              <h1 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {currentUser?.displayName}
              </h1>
              <p className="text-[#2AABEE] text-xs">@{currentUser?.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className={`p-2 rounded-xl ${theme === 'dark' ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'} transition-colors`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowNewChat(true)}
              className={`p-2 rounded-xl ${theme === 'dark' ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'} transition-colors`}
            >
              <Edit className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme === 'dark' ? 'text-white/30' : 'text-gray-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث..."
            className={`w-full pr-10 pl-4 py-2.5 rounded-xl text-sm outline-none transition-all ${
              theme === 'dark'
                ? 'bg-white/8 text-white placeholder-white/30 focus:bg-white/12'
                : 'bg-white text-gray-900 placeholder-gray-400 border border-gray-200'
            }`}
            dir="rtl"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          )}
        </div>
      </div>

      {/* Menu Dropdown */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute top-24 right-4 left-4 z-50 rounded-2xl shadow-2xl overflow-hidden ${
              theme === 'dark' ? 'bg-[#232E3C]' : 'bg-white border border-gray-200'
            }`}
          >
            {[
              { icon: User, label: 'الملف الشخصي', action: () => { onOpenSettings(); setShowMenu(false); } },
              { icon: Shield, label: 'الأمان والخصوصية', action: () => { onOpenSettings(); setShowMenu(false); } },
              { icon: Archive, label: 'الأرشيف', action: () => setShowMenu(false) },
              { icon: Bookmark, label: 'المحفوظات', action: () => setShowMenu(false) },
              { icon: Users, label: 'جهات الاتصال', action: () => { setActiveTab('contacts'); setShowMenu(false); } },
              { icon: Settings, label: 'الإعدادات', action: () => { onOpenSettings(); setShowMenu(false); } },
              { icon: LogOut, label: 'تسجيل الخروج', action: () => logout(), danger: true },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className={`w-full flex items-center gap-3 px-4 py-3 text-right transition-colors ${
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : theme === 'dark'
                    ? 'text-white hover:bg-white/5'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5 opacity-70" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className={`flex border-b ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
        {[
          { id: 'chats', icon: MessageCircle, label: 'المحادثات' },
          { id: 'contacts', icon: Users, label: 'جهات الاتصال' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'chats' | 'contacts')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-[#2AABEE]'
                : theme === 'dark' ? 'text-white/40' : 'text-gray-500'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2AABEE]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Chat/Contact List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'chats' ? (
          <div>
            {filteredChats.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/30 text-sm">لا توجد محادثات</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const name = getChatName(chat);
                const avatar = getChatAvatar(chat);
                const lastMsg = chat.lastMessage;
                const isActive = activeChat === chat.id;
                const online = isOnline(chat);
                const msgs = messages[chat.id] || [];
                const lastMsgSenderIsMe = lastMsg?.senderId === currentUser?.id;

                return (
                  <motion.div
                    key={chat.id}
                    whileHover={{ backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                    onClick={() => setActiveChat(chat.id)}
                    onContextMenu={e => handleContextMenu(e, chat.id)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors relative ${
                      isActive
                        ? theme === 'dark' ? 'bg-[#2AABEE]/15 border-r-2 border-[#2AABEE]' : 'bg-blue-50 border-r-2 border-blue-500'
                        : ''
                    }`}
                  >
                    {/* Pin indicator */}
                    {chat.isPinned && (
                      <Pin className="absolute top-2 left-2 w-3 h-3 text-[#2AABEE]/50" />
                    )}

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {avatar ? (
                        <img src={avatar} className="w-12 h-12 rounded-full object-cover" alt={name} />
                      ) : (
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(name)} flex items-center justify-center text-white font-bold text-base`}>
                          {getInitials(name)}
                        </div>
                      )}
                      {online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#17212B]" />
                      )}
                      {chat.type === 'group' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#2AABEE] rounded-full flex items-center justify-center">
                          <Users className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`font-semibold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {name}
                          </span>
                          {chat.isMuted && <VolumeX className="w-3 h-3 text-white/30 shrink-0" />}
                        </div>
                        <span className={`text-xs shrink-0 mr-2 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                          {formatTime(lastMsg?.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          {lastMsgSenderIsMe && (
                            <div className="shrink-0">
                              {lastMsg?.status === 'read' ? (
                                <div className="flex">
                                  <Check className="w-3 h-3 text-[#2AABEE]" />
                                  <Check className="w-3 h-3 text-[#2AABEE] -ml-1.5" />
                                </div>
                              ) : lastMsg?.status === 'delivered' ? (
                                <div className="flex">
                                  <Check className="w-3 h-3 text-white/40" />
                                  <Check className="w-3 h-3 text-white/40 -ml-1.5" />
                                </div>
                              ) : (
                                <Check className="w-3 h-3 text-white/40" />
                              )}
                            </div>
                          )}
                          <p className={`text-xs truncate ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'} ${lastMsg?.isDeleted ? 'italic' : ''}`}>
                            {lastMsg?.isDeleted ? 'تم حذف هذه الرسالة' : lastMsg?.content || 'ابدأ المحادثة'}
                          </p>
                        </div>

                        {chat.unreadCount > 0 && (
                          <span className={`shrink-0 mr-2 min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs font-bold text-white px-1.5 ${
                            chat.isMuted ? 'bg-white/20' : 'bg-[#2AABEE]'
                          }`}>
                            {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          // Contacts Tab
          <div>
            {contacts.map(contact => (
              <motion.div
                key={contact.id}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                onClick={() => {
                  // Find or create chat
                  const existingChat = chats.find(c =>
                    c.type === 'private' &&
                    c.participants.includes(contact.id) &&
                    c.participants.includes(currentUser?.id || '')
                  );
                  if (existingChat) {
                    setActiveChat(existingChat.id);
                    setActiveTab('chats');
                  }
                }}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer"
              >
                <div className="relative shrink-0">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(contact.displayName)} flex items-center justify-center text-white font-bold text-base`}>
                    {getInitials(contact.displayName)}
                  </div>
                  {contact.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#17212B]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{contact.displayName}</span>
                    {contact.isVerified && (
                      <Shield className="w-3.5 h-3.5 text-[#2AABEE]" />
                    )}
                  </div>
                  <p className="text-white/40 text-xs truncate">
                    {contact.isOnline ? '🟢 متصل الآن' : contact.bio || `@${contact.username}`}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x }}
              className="z-50 bg-[#232E3C] rounded-2xl shadow-2xl overflow-hidden min-w-[180px]"
            >
              {[
                { icon: Pin, label: 'تثبيت', action: () => { pinChat(contextMenu.chatId); setContextMenu(null); } },
                { icon: VolumeX, label: 'كتم', action: () => { muteChat(contextMenu.chatId); setContextMenu(null); } },
                { icon: Archive, label: 'أرشفة', action: () => { archiveChat(contextMenu.chatId); setContextMenu(null); } },
                { icon: X, label: 'حذف', action: () => { deleteChat(contextMenu.chatId); setContextMenu(null); }, danger: true },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating New Chat Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowNewChat(true)}
        className="absolute bottom-6 right-4 w-14 h-14 bg-gradient-to-br from-[#2AABEE] to-[#0088CC] rounded-full flex items-center justify-center shadow-2xl shadow-[#2AABEE]/30 z-10"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* New Chat Dialog */}
      <AnimatePresence>
        {showNewChat && (
          <NewChatDialog onClose={() => setShowNewChat(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sidebar;