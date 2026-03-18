import React, { useEffect, lazy, Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NavigationProvider } from '@/lib/NavigationContext';
import { navigationStackManager } from '@/lib/NavigationStackManager';
import AppLayout from './components/layout/AppLayout.jsx';
import Header from './components/layout/Header.jsx';
import PageTransition from './components/layout/PageTransition';
import Onboarding from './pages/Onboarding';

// Aggressive code-splitting for non-critical pages (improves Time-to-Interactive)
const PageNotFound  = lazy(() => import(/* webpackChunkName: "404" */ './lib/PageNotFound'));
const CreateGoal    = lazy(() => import(/* webpackChunkName: "create-goal" */ './pages/CreateGoal'));
const NotificationSettings = lazy(() => import(/* webpackChunkName: "notifications" */ './pages/NotificationSettings'));

// Lazy-load onboarding components for faster initial load
const OnboardingWelcome = lazy(() => import(/* webpackChunkName: "onboarding-welcome" */ '@/components/onboarding/OnboardingWelcome'));
const OnboardingGoal = lazy(() => import(/* webpackChunkName: "onboarding-goal" */ '@/components/onboarding/OnboardingGoal'));
const OnboardingCategory = lazy(() => import(/* webpackChunkName: "onboarding-category" */ '@/components/onboarding/OnboardingCategory'));
const OnboardingDDay = lazy(() => import(/* webpackChunkName: "onboarding-dday" */ '@/components/onboarding/OnboardingDDay'));
const OnboardingDDayDate = lazy(() => import(/* webpackChunkName: "onboarding-dday-date" */ '@/components/onboarding/OnboardingDDayDate'));
const OnboardingDuration = lazy(() => import(/* webpackChunkName: "onboarding-duration" */ '@/components/onboarding/OnboardingDuration'));
const OnboardingAction = lazy(() => import(/* webpackChunkName: "onboarding-action" */ '@/components/onboarding/OnboardingAction'));
const OnboardingNickname = lazy(() => import(/* webpackChunkName: "onboarding-nickname" */ '@/components/onboarding/OnboardingNickname'));

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
              <Onboarding />
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

  // Register Android backbutton handler (non-breaking for web)
  useEffect(() => {
    const handleAndroidBackButton = () => {
      navigationStackManager.handleAndroidBackButton();
    };

    // Check if we're in a Cordova/Capacitor environment
    if (window.device || window.cordova) {
      document.addEventListener('backbutton', handleAndroidBackButton);
      return () => document.removeEventListener('backbutton', handleAndroidBackButton);
    }
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationProvider>
            <AuthenticatedApp />
          </NavigationProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;