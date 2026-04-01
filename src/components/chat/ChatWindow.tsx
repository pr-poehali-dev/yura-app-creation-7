import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Smile, Paperclip, Mic, Phone, Video, MoreVertical,
  Reply, Edit2, Trash2, Copy, Forward, Pin, Search,
  ArrowDown, Shield, Lock, CheckCheck, Check, Image,
  Camera, File, X, ChevronDown, Info, Clock, Flame
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useStore, Message, MessageType } from '../../store/useStore';
import { format, isToday, isYesterday } from 'date-fns';
import { ar } from 'date-fns/locale';

const ChatWindow: React.FC = () => {
  const {
    activeChat, chats, contacts, currentUser, messages,
    sendMessage, editMessage, deleteMessage, addReaction, theme
  } = useStore();

  const [inputText, setInputText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [showTTL, setShowTTL] = useState(false);
  const [ttlValue, setTtlValue] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recordingInterval = useRef<NodeJS.Timeout>();

  const chat = chats.find(c => c.id === activeChat);
  const chatMessages = activeChat ? (messages[activeChat] || []) : [];

  const getContactById = (id: string) =>
    contacts.find(c => c.id === id) || (currentUser?.id === id ? currentUser : null);

  const getChatName = () => {
    if (!chat) return '';
    if (chat.type !== 'private') return chat.name || 'مجموعة';
    const otherId = chat.participants.find(id => id !== currentUser?.id);
    return getContactById(otherId || '')?.displayName || 'مجهول';
  };

  const getOtherUser = () => {
    if (!chat || chat.type !== 'private') return null;
    const otherId = chat.participants.find(id => id !== currentUser?.id);
    return getContactById(otherId || '');
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const getAvatarColor = (name: string) => {
    const colors = [
      'from-blue-500 to-cyan-500', 'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500', 'from-orange-500 to-red-500',
      'from-indigo-500 to-blue-500',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [activeChat]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      const container = messagesContainerRef.current;
      if (container) {
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        if (isNearBottom) scrollToBottom();
      }
    }
  }, [chatMessages.length]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
      setShowScrollDown(!isNearBottom);
    }
  };

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || !activeChat) return;

    if (editingMsg) {
      editMessage(activeChat, editingMsg.id, text);
      setEditingMsg(null);
    } else {
      sendMessage(activeChat, text, 'text', replyTo?.id, ttlValue > 0 ? ttlValue : undefined);
      setReplyTo(null);
      setTtlValue(0);
    }

    setInputText('');
    setShowEmoji(false);
    setTimeout(() => scrollToBottom(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingInterval.current = setInterval(() => {
      setRecordingTime(t => t + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    clearInterval(recordingInterval.current);
    if (recordingTime > 0 && activeChat) {
      sendMessage(activeChat, `🎤 رسالة صوتية (${recordingTime}ث)`, 'voice');
    }
    setRecordingTime(0);
  };

  const formatRecordingTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    msgs.forEach(msg => {
      const msgDate = new Date(msg.timestamp);
      let dateStr = '';
      if (isToday(msgDate)) dateStr = 'اليوم';
      else if (isYesterday(msgDate)) dateStr = 'أمس';
      else dateStr = format(msgDate, 'dd MMMM yyyy', { locale: ar });

      if (dateStr !== currentDate) {
        currentDate = dateStr;
        groups.push({ date: dateStr, messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    });

    return groups;
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setContextMenu({ msg, x: e.clientX, y: e.clientY });
  };

  const replyToMsg = chatMessages.find(m => m.id === replyTo?.id);

  if (!activeChat || !chat) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-[#0E1621]' : 'bg-[#F0F2F5]'}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-28 h-28 bg-gradient-to-br from-[#2AABEE] to-[#0088CC] rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#2AABEE]/20">
            <span className="text-white font-black text-5xl">K</span>
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            مرحباً بك في K
          </h2>
          <p className={`text-sm mb-1 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
            اختر محادثة للبدء
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Lock className="w-4 h-4 text-[#2AABEE]" />
            <p className="text-[#2AABEE] text-xs">جميع الرسائل مشفرة من طرف إلى طرف</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const otherUser = getOtherUser();
  const chatName = getChatName();
  const messageGroups = groupMessagesByDate(chatMessages);

  return (
    <div className={`flex-1 flex flex-col h-full ${theme === 'dark' ? 'bg-[#0E1621]' : 'bg-[#F0F2F5]'} relative`}>

      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-3 border-b ${theme === 'dark' ? 'bg-[#17212B] border-white/5' : 'bg-white border-gray-200'} z-10 shrink-0`}>
        <div className="relative shrink-0">
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(chatName)} flex items-center justify-center text-white font-bold text-sm`}>
            {getInitials(chatName)}
          </div>
          {otherUser?.isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#17212B]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className={`font-bold text-base truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {chatName}
          </h2>
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3 text-[#2AABEE]" />
            <p className="text-[#2AABEE] text-xs">
              {otherUser?.isOnline
                ? 'متصل الآن'
                : chat.type === 'group'
                ? `${chat.participants.length} أعضاء`
                : 'مشفر من طرف إلى طرف'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <motion.button whileTap={{ scale: 0.9 }} className={`p-2 rounded-xl ${theme === 'dark' ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'} transition-colors`}>
            <Phone className="w-5 h-5" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className={`p-2 rounded-xl ${theme === 'dark' ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'} transition-colors`}>
            <Video className="w-5 h-5" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className={`p-2 rounded-xl ${theme === 'dark' ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'} transition-colors`}>
            <Search className="w-5 h-5" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} className={`p-2 rounded-xl ${theme === 'dark' ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'} transition-colors`}>
            <MoreVertical className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{
          backgroundImage: theme === 'dark'
            ? 'radial-gradient(circle at 20% 80%, rgba(42,171,238,0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(42,171,238,0.02) 0%, transparent 50%)'
            : 'none'
        }}
        onClick={() => { setContextMenu(null); setShowEmoji(false); }}
      >
        {messageGroups.map((group) => (
          <div key={group.date}>
            {/* Date Separator */}
            <div className="flex items-center gap-3 my-4">
              <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
              <span className={`text-xs px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-white/8 text-white/50' : 'bg-gray-200 text-gray-500'}`}>
                {group.date}
              </span>
              <div className={`flex-1 h-px ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
            </div>

            {group.messages.map((msg, i) => {
              const isMe = msg.senderId === currentUser?.id;
              const sender = getContactById(msg.senderId);
              const senderName = sender?.displayName || 'مجهول';
              const prevMsg = group.messages[i - 1];
              const showAvatar = !isMe && (
                !prevMsg ||
                prevMsg.senderId !== msg.senderId ||
                msg.timestamp - prevMsg.timestamp > 300000
              );
              const replyMsg = msg.replyTo ? chatMessages.find(m => m.id === msg.replyTo) : null;

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 group`}
                  onContextMenu={e => handleContextMenu(e, msg)}
                >
                  {/* Avatar for group */}
                  {chat.type === 'group' && !isMe && (
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(senderName)} flex items-center justify-center text-white text-xs font-bold shrink-0 mr-2 ${showAvatar ? '' : 'opacity-0'} self-end mb-1`}>
                      {getInitials(senderName)}
                    </div>
                  )}

                  <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                    {/* Sender name in group */}
                    {chat.type === 'group' && !isMe && showAvatar && (
                      <span className="text-[#2AABEE] text-xs font-semibold mb-1 px-3">
                        {senderName}
                      </span>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`relative rounded-2xl px-4 py-2 shadow-sm ${
                        msg.isDeleted
                          ? theme === 'dark' ? 'bg-white/5 text-white/30' : 'bg-gray-100 text-gray-400'
                          : isMe
                          ? 'bg-[#2B5278] text-white rounded-br-md'
                          : theme === 'dark'
                          ? 'bg-[#232E3C] text-white rounded-bl-md'
                          : 'bg-white text-gray-900 rounded-bl-md shadow-sm'
                      }`}
                    >
                      {/* Reply Preview */}
                      {replyMsg && !msg.isDeleted && (
                        <div className={`border-r-2 border-[#2AABEE] pr-3 mb-2 py-1 rounded-r ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                          <p className="text-[#2AABEE] text-xs font-semibold mb-0.5">
                            {replyMsg.senderId === currentUser?.id ? 'أنت' : getContactById(replyMsg.senderId)?.displayName}
                          </p>
                          <p className={`text-xs truncate ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                            {replyMsg.content}
                          </p>
                        </div>
                      )}

                      {/* TTL indicator */}
                      {msg.ttl && !msg.isDeleted && (
                        <div className="flex items-center gap-1 mb-1">
                          <Flame className="w-3 h-3 text-orange-400 animate-pulse" />
                          <span className="text-orange-400 text-xs">رسالة مؤقتة</span>
                        </div>
                      )}

                      {/* Message Content */}
                      {msg.isDeleted ? (
                        <p className="text-sm italic flex items-center gap-2">
                          <X className="w-3 h-3" />
                          تم حذف هذه الرسالة
                        </p>
                      ) : msg.type === 'voice' ? (
                        <div className="flex items-center gap-3 min-w-[160px]">
                          <div className="w-8 h-8 bg-[#2AABEE] rounded-full flex items-center justify-center">
                            <Mic className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex gap-1 items-end h-8">
                              {[...Array(20)].map((_, j) => (
                                <div
                                  key={j}
                                  className="bg-[#2AABEE]/50 rounded-full w-1"
                                  style={{ height: `${20 + Math.sin(j * 0.8) * 15}px` }}
                                />
                              ))}
                            </div>
                            <p className="text-xs text-white/50 mt-1">{msg.content.match(/\d+ث/)?.[0] || '0:00'}</p>
                          </div>
                        </div>
                      ) : (
                        <p className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${msg.isDeleted ? '' : 'text-right'}`} dir="auto">
                          {msg.content}
                        </p>
                      )}

                      {/* Time & Status */}
                      {!msg.isDeleted && (
                        <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {msg.isEdited && (
                            <span className="text-white/40 text-[10px]">معدّل</span>
                          )}
                          <span className="text-white/40 text-[10px]">
                            {format(new Date(msg.timestamp), 'HH:mm')}
                          </span>
                          {isMe && (
                            <span>
                              {msg.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-[#2AABEE]" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-white/40" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-white/40" />
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Reactions */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                          <motion.button
                            key={emoji}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => addReaction(chat.id, msg.id, emoji)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
                              users.includes(currentUser?.id || '')
                                ? 'bg-[#2AABEE]/30 border border-[#2AABEE]/50 text-white'
                                : theme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {emoji}
                            {users.length > 1 && <span>{users.length}</span>}
                          </motion.button>
                        ))}
                      </div>
                    )}

                    {/* Quick action buttons on hover */}
                    <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {['👍', '❤️', '😂', '😮', '😢'].map(emoji => (
                        <motion.button
                          key={emoji}
                          whileTap={{ scale: 0.8 }}
                          onClick={() => addReaction(chat.id, msg.id, emoji)}
                          className="text-sm hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </motion.button>
                      ))}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }}
                        className={`p-1 rounded-lg ${theme === 'dark' ? 'text-white/40 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:bg-gray-100'} transition-colors`}
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollDown && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-6 w-10 h-10 bg-[#2AABEE] rounded-full flex items-center justify-center shadow-lg z-20"
          >
            <ArrowDown className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x - 180 }}
              className="z-50 bg-[#232E3C] rounded-2xl shadow-2xl overflow-hidden w-[180px]"
            >
              {[
                { icon: Reply, label: 'رد', action: () => { setReplyTo(contextMenu.msg); setContextMenu(null); inputRef.current?.focus(); } },
                { icon: Copy, label: 'نسخ', action: () => { navigator.clipboard.writeText(contextMenu.msg.content); setContextMenu(null); } },
                ...(contextMenu.msg.senderId === currentUser?.id ? [
                  { icon: Edit2, label: 'تعديل', action: () => { setEditingMsg(contextMenu.msg); setInputText(contextMenu.msg.content); setContextMenu(null); inputRef.current?.focus(); } },
                ] : []),
                { icon: Pin, label: 'تثبيت', action: () => setContextMenu(null) },
                { icon: Forward, label: 'إعادة توجيه', action: () => setContextMenu(null) },
                { icon: Trash2, label: 'حذف', action: () => { if (activeChat) deleteMessage(activeChat, contextMenu.msg.id); setContextMenu(null); }, danger: true },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    (item as { danger?: boolean }).danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white hover:bg-white/5'
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

      {/* Input Area */}
      <div className={`px-4 py-3 border-t ${theme === 'dark' ? 'bg-[#17212B] border-white/5' : 'bg-white border-gray-200'} shrink-0`}>

        {/* Reply Preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-center gap-3 mb-3 px-3 py-2 rounded-xl border-r-2 border-[#2AABEE] ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[#2AABEE] text-xs font-semibold">
                  {replyTo.senderId === currentUser?.id ? 'أنت' : getContactById(replyTo.senderId)?.displayName}
                </p>
                <p className={`text-xs truncate ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
                  {replyTo.content}
                </p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Indicator */}
        <AnimatePresence>
          {editingMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`flex items-center gap-3 mb-3 px-3 py-2 rounded-xl border-r-2 border-yellow-400 ${theme === 'dark' ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}
            >
              <Edit2 className="w-4 h-4 text-yellow-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-yellow-400 text-xs font-semibold">تعديل الرسالة</p>
                <p className={`text-xs truncate ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>{editingMsg.content}</p>
              </div>
              <button onClick={() => { setEditingMsg(null); setInputText(''); }} className="text-white/40 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TTL Selector */}
        <AnimatePresence>
          {showTTL && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-3 overflow-x-auto pb-1"
            >
              <Flame className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-white/60 text-xs shrink-0">حذف بعد:</span>
              {[
                { label: 'بدون', value: 0 },
                { label: '5ث', value: 5 },
                { label: '10ث', value: 10 },
                { label: '1د', value: 60 },
                { label: '1س', value: 3600 },
                { label: '1ي', value: 86400 },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTtlValue(opt.value)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                    ttlValue === opt.value
                      ? 'bg-orange-500 text-white'
                      : theme === 'dark' ? 'bg-white/10 text-white/60' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-3">
          {/* Left buttons */}
          <div className="flex items-center gap-1 mb-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowEmoji(!showEmoji)}
              className={`p-2 rounded-xl transition-colors ${
                showEmoji
                  ? 'text-[#2AABEE] bg-[#2AABEE]/10'
                  : theme === 'dark' ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Smile className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowAttachment(!showAttachment)}
              className={`p-2 rounded-xl transition-colors ${
                theme === 'dark' ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Paperclip className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowTTL(!showTTL)}
              className={`p-2 rounded-xl transition-colors ${
                showTTL || ttlValue > 0
                  ? 'text-orange-400 bg-orange-500/10'
                  : theme === 'dark' ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:bg-gray-100'
              }`}
            >
              <Flame className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Text Input */}
          <div className={`flex-1 rounded-2xl px-4 py-2 ${theme === 'dark' ? 'bg-[#232E3C]' : 'bg-gray-100'}`}>
            {isRecording ? (
              <div className="flex items-center gap-3 py-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-400 text-sm font-mono">{formatRecordingTime(recordingTime)}</span>
                <div className="flex gap-1 items-end flex-1">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="bg-red-400/50 rounded-full w-1"
                      animate={{ height: [8, 24, 8] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالة..."
                dir="auto"
                rows={1}
                className={`w-full bg-transparent resize-none outline-none text-sm leading-relaxed max-h-32 ${
                  theme === 'dark' ? 'text-white placeholder-white/30' : 'text-gray-900 placeholder-gray-400'
                }`}
                style={{ minHeight: '24px' }}
              />
            )}
          </div>

          {/* Send / Mic Button */}
          {inputText.trim() || editingMsg ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              className="w-10 h-10 bg-gradient-to-br from-[#2AABEE] to-[#0088CC] rounded-full flex items-center justify-center shadow-lg shadow-[#2AABEE]/30 shrink-0 mb-0.5"
            >
              <Send className="w-5 h-5 text-white" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onTouchStart={startRecording}
              onTouchEnd={stopRecording}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0 mb-0.5 transition-colors ${
                isRecording
                  ? 'bg-red-500 shadow-red-500/30 animate-pulse'
                  : 'bg-gradient-to-br from-[#2AABEE] to-[#0088CC] shadow-[#2AABEE]/30'
              }`}
            >
              <Mic className="w-5 h-5 text-white" />
            </motion.button>
          )}
        </div>

        {/* Emoji Picker */}
        <AnimatePresence>
          {showEmoji && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 z-50"
            >
              <EmojiPicker
                onEmojiClick={(e) => {
                  setInputText(prev => prev + e.emoji);
                  setShowEmoji(false);
                  inputRef.current?.focus();
                }}
                theme={theme === 'dark' ? 'dark' as const : 'light' as const}
                height={350}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment Menu */}
        <AnimatePresence>
          {showAttachment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 left-4 z-50 bg-[#232E3C] rounded-2xl shadow-2xl p-2 flex gap-2"
            >
              {[
                { icon: Image, label: 'صورة', color: 'text-blue-400 bg-blue-400/10' },
                { icon: Camera, label: 'كاميرا', color: 'text-green-400 bg-green-400/10' },
                { icon: File, label: 'ملف', color: 'text-orange-400 bg-orange-400/10' },
                { icon: Mic, label: 'صوت', color: 'text-purple-400 bg-purple-400/10' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => setShowAttachment(false)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${item.color} transition-colors hover:opacity-80`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] text-white/60">{item.label}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ChatWindow;
