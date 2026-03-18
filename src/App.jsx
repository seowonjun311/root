import React, { useEffect, lazy, Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NavigationProvider } from '@/lib/NavigationContext';
import AppLayout from './components/layout/AppLayout.jsx';
import Header from './components/layout/Header.jsx';
import PageTransition from './components/layout/PageTransition';

// Lazy-load all non-critical pages for better initial load performance
const PageNotFound  = lazy(() => import('./lib/PageNotFound'));
const Onboarding    = lazy(() => import('./pages/Onboarding'));
const CreateGoal    = lazy(() => import('./pages/CreateGoal'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));

// Minimal inline fallback — avoids layout shift
const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-7 h-7 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const location = useLocation();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <PageFallback />;
  }

  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
      <Suspense fallback={<PageFallback />}>
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

            {/* Tab routes: AppLayout keeps all tabs mounted for instant switching */}
            <Route element={<AppLayout />}>
              <Route path="/Home"        element={<div />} />
              <Route path="/Records"     element={<div />} />
              <Route path="/Badges"      element={<div />} />
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
      </Suspense>
    </div>
  );
};

function App() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (dark) => document.documentElement.classList.toggle('dark', dark);
    apply(mq.matches);
    mq.addEventListener('change', e => apply(e.matches));
    return () => mq.removeEventListener('change', e => apply(e.matches));
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
  );
}

export default App;