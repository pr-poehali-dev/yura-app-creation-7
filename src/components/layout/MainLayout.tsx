import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import ChatWindow from '../chat/ChatWindow';
import SettingsPanel from '../settings/SettingsPanel';
import { useStore } from '../../store/useStore';

const MainLayout: React.FC = () => {
  const { theme, activeChat, sidebarOpen, setSidebarOpen } = useStore();
  const [showSettings, setShowSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const showSidebar = isMobile ? !activeChat : true;

  return (
    <div className={`h-screen flex overflow-hidden ${theme === 'dark' ? 'bg-[#0E1621]' : 'bg-gray-100'}`}>

      {/* Mobile Overlay */}
      {isMobile && activeChat && (
        <div className="fixed inset-0 z-30">
          <ChatWindow />
          <button
            onClick={() => useStore.getState().setActiveChat(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white z-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Sidebar */}
      {(!isMobile || !activeChat) && (
        <div className={`${isMobile ? 'w-full' : 'w-80 shrink-0'} h-full border-r ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
          <Sidebar onOpenSettings={() => setShowSettings(true)} />
        </div>
      )}

      {/* Main Content (Desktop) */}
      {!isMobile && (
        <div className="flex-1 h-full overflow-hidden">
          <ChatWindow />
        </div>
      )}

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainLayout;
