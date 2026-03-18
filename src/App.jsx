import React, { useEffect } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion'
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AppLayout from './components/layout/AppLayout.jsx';
import Header from './components/layout/Header';
import Onboarding from './pages/Onboarding';
import CreateGoal from './pages/CreateGoal';
import NotificationSettings from './pages/NotificationSettings';
import PageTransition from './components/layout/PageTransition';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    // position:relative container so PageTransition's absolute positioning works
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/Onboarding" replace />} />

          <Route path="/Onboarding" element={
            <PageTransition>
              <Onboarding />
            </PageTransition>
          } />

          <Route path="/CreateGoal" element={
            <PageTransition>
              <Header />
              <CreateGoal />
            </PageTransition>
          } />

          {/* Tab routes: AppLayout handles its own keep-alive rendering, no slide needed */}
          <Route element={<AppLayout />}>
            <Route path="/Home" element={<div />} />
            <Route path="/Records" element={<div />} />
            <Route path="/Badges" element={<div />} />
            <Route path="/AppSettings" element={<div />} />
          </Route>

          <Route path="/NotificationSettings" element={
            <PageTransition>
              <Header />
              <NotificationSettings />
            </PageTransition>
          } />

          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </AnimatePresence>
    </div>
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