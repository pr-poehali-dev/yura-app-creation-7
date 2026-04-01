import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import AuthScreen from './components/auth/AuthScreen';
import MainLayout from './components/layout/MainLayout';
import { useStore } from './store/useStore';
import './index.css';

const App: React.FC = () => {
  const { isAuthenticated, theme } = useStore();

  useEffect(() => {
    // Apply theme to document
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''} h-screen overflow-hidden`}>
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <AuthScreen key="auth" />
        ) : (
          <MainLayout key="main" />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
