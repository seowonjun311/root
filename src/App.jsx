import React, { useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import Header from './components/layout/Header';
import Home from './pages/Home.jsx';
import Onboarding from './pages/Onboarding';
import CreateGoal from './pages/CreateGoal';
import Records from './pages/Records.jsx';
import Badges from './pages/Badges';
import AppSettings from './pages/AppSettings';
import NotificationSettings from './pages/NotificationSettings';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  // [로그인 시스템 일시 정지] - 필요시 아래 주석 제거
  /*
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }
  */

  // Render the main app with page transitions
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Navigate to="/Onboarding" replace />} />
        <Route path="/Onboarding" element={
          <motion.div key="onboarding" initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-100%', opacity: 0 }} transition={{ type: 'tween', duration: 0.28, ease: 'easeInOut' }} style={{ willChange: 'transform' }}>
            <Onboarding />
          </motion.div>
        } />
        <Route path="/CreateGoal" element={
          <motion.div key="creategoal" initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-100%', opacity: 0 }} transition={{ type: 'tween', duration: 0.28, ease: 'easeInOut' }} style={{ willChange: 'transform' }}>
            <Header />
            <CreateGoal />
          </motion.div>
        } />
        <Route element={<AppLayout />}>
          <Route path="/Home" element={<div />} />
          <Route path="/Records" element={<div />} />
          <Route path="/Badges" element={<div />} />
          <Route path="/AppSettings" element={<div />} />
        </Route>
        <Route path="/NotificationSettings" element={
          <motion.div key="notificationsettings" initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '-100%', opacity: 0 }} transition={{ type: 'tween', duration: 0.28, ease: 'easeInOut' }} style={{ willChange: 'transform' }}>
            <Header />
            <NotificationSettings />
          </motion.div>
        } />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </AnimatePresence>
  );
};


function App() {
  // 시스템 다크모드 감지 및 실시간 모니터링
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 초기 설정
    if (darkModeQuery.matches) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // 실시간 변경 감지
    const handleChange = (e) => {
      if (e.matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    darkModeQuery.addEventListener('change', handleChange);
    return () => darkModeQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App