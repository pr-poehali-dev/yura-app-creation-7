import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Users, MessageCircle, Tv, Plus, Check, Shield } from 'lucide-react';
import { useStore, User } from '../../store/useStore';

interface NewChatDialogProps {
  onClose: () => void;
}

const NewChatDialog: React.FC<NewChatDialogProps> = ({ onClose }) => {
  const { contacts, currentUser, createChat, setActiveChat, theme } = useStore();
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'new' | 'group' | 'channel'>('new');
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [step, setStep] = useState<'select' | 'name'>('select');

  const filtered = contacts.filter(c =>
    c.displayName.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getAvatarColor = (name: string) => {
    const colors = ['from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500', 'from-green-500 to-emerald-500', 'from-orange-500 to-red-500'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  const handleSelect = (contact: User) => {
    if (mode === 'new') {
      // Direct message - find or create chat
      const existingChat = useStore.getState().chats.find(c =>
        c.type === 'private' &&
        c.participants.includes(contact.id) &&
        c.participants.includes(currentUser?.id || '')
      );
      if (existingChat) {
        setActiveChat(existingChat.id);
      } else {
        const newChat = createChat([currentUser?.id || '', contact.id], 'private');
        setActiveChat(newChat.id);
      }
      onClose();
    } else {
      setSelected(prev =>
        prev.includes(contact.id) ? prev.filter(id => id !== contact.id) : [...prev, contact.id]
      );
    }
  };

  const handleCreate = () => {
    if (step === 'select' && selected.length > 0) {
      if (mode === 'group' || mode === 'channel') setStep('name');
      return;
    }
    if (step === 'name' && groupName.trim()) {
      const newChat = createChat(
        [currentUser?.id || '', ...selected],
        mode === 'channel' ? 'channel' : 'group',
        groupName
      );
      setActiveChat(newChat.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        onClick={e => e.stopPropagation()}
        className="bg-[#17212B] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[85vh] flex flex-col border border-white/10 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">
            {step === 'name' ? 'اسم المجموعة' : 'محادثة جديدة'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'select' && (
          <>
            {/* Mode Selector */}
            <div className="flex gap-2 px-4 py-3 border-b border-white/5">
              {[
                { id: 'new', icon: MessageCircle, label: 'رسالة' },
                { id: 'group', icon: Users, label: 'مجموعة' },
                { id: 'channel', icon: Tv, label: 'قناة' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id as typeof mode)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    mode === m.id ? 'bg-[#2AABEE] text-white' : 'bg-white/5 text-white/50 hover:text-white'
                  }`}
                >
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="بحث عن جهة اتصال..."
                  className="w-full bg-white/8 rounded-xl pr-10 pl-4 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:bg-white/12 transition-colors"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
                {selected.map(id => {
                  const contact = contacts.find(c => c.id === id);
                  return contact ? (
                    <button
                      key={id}
                      onClick={() => setSelected(prev => prev.filter(s => s !== id))}
                      className="flex items-center gap-2 bg-[#2AABEE]/20 border border-[#2AABEE]/30 rounded-full pl-3 pr-2 py-1.5 shrink-0"
                    >
                      <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getAvatarColor(contact.displayName)} flex items-center justify-center text-white text-[8px] font-bold`}>
                        {getInitials(contact.displayName)}
                      </div>
                      <span className="text-white text-xs">{contact.displayName}</span>
                      <X className="w-3 h-3 text-white/50" />
                    </button>
                  ) : null;
                })}
              </div>
            )}
          </>
        )}

        {step === 'name' && (
          <div className="px-4 py-4">
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder={mode === 'group' ? 'اسم المجموعة...' : 'اسم القناة...'}
              className="w-full bg-white/8 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 outline-none focus:border-[#2AABEE] text-sm text-right"
              dir="rtl"
              autoFocus
            />
            <div className="flex items-center gap-2 mt-3">
              <Shield className="w-4 h-4 text-[#2AABEE]" />
              <span className="text-white/40 text-xs">ستكون جميع الرسائل مشفرة</span>
            </div>
          </div>
        )}

        {/* Contact List */}
        {step === 'select' && (
          <div className="flex-1 overflow-y-auto">
            {filtered.map(contact => (
              <motion.button
                key={contact.id}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                onClick={() => handleSelect(contact)}
                className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
              >
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getAvatarColor(contact.displayName)} flex items-center justify-center text-white font-bold text-sm`}>
                    {getInitials(contact.displayName)}
                  </div>
                  {contact.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#17212B]" />
                  )}
                </div>
                <div className="flex-1 text-right">
                  <p className="text-white font-medium text-sm">{contact.displayName}</p>
                  <p className="text-white/40 text-xs">@{contact.username}</p>
                </div>
                {mode !== 'new' && (
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selected.includes(contact.id)
                      ? 'bg-[#2AABEE] border-[#2AABEE]'
                      : 'border-white/20'
                  }`}>
                    {selected.includes(contact.id) && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        )}

        {/* Create Button */}
        {(mode !== 'new' || step === 'name') && (
          <div className="p-4 border-t border-white/10">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCreate}
              disabled={step === 'select' ? selected.length === 0 : !groupName.trim()}
              className="w-full bg-gradient-to-r from-[#2AABEE] to-[#0088CC] text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              {step === 'name' ? 'إنشاء' : 'التالي'}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default NewChatDialog;
