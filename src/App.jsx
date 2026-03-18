import React, { useEffect, lazy, Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NavigationProvider } from '@/lib/NavigationContext';
import { navigationStackManager } from '@/lib/NavigationStackManager';
import { guestDataPersistence } from '@/lib/GuestDataPersistence';
import AppLayout from './components/layout/AppLayout.jsx';
import Header from './components/layout/Header.jsx';
import PageTransition from './components/layout/PageTransition';
const Onboarding = lazy(() => import(/* webpackChunkName: "onboarding" */ './pages/Onboarding'));

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

const AuthenticatedAppContent = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const location = useLocation();
  const [isNavReady, setIsNavReady] = React.useState(false);

  // Validate NavigationStackManager state against browser history on mount
  React.useEffect(() => {
    const validateNavigation = async () => {
      try {
        // Ensure navigation stack is synced with browser history
        const isValid = navigationStackManager.validateStack();
        if (!isValid) {
          console.warn('[App] Navigation stack validation failed, forcing reset');
          navigationStackManager.resetStack();
        }
        setIsNavReady(true);
      } catch (error) {
        console.error('[App] Navigation validation error:', error);
        setIsNavReady(true); // Fail gracefully
      }
    };

    validateNavigation();
  }, []);

  if (isLoadingPublicSettings || isLoadingAuth || !isNavReady) {
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

const AuthenticatedApp = () => (
  <NavigationProvider>
    <AuthenticatedAppContent />
    <Toaster />
  </NavigationProvider>
);

function App() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (dark) => document.documentElement.classList.toggle('dark', dark);
    apply(mq.matches);
    mq.addEventListener('change', e => apply(e.matches));
    return () => mq.removeEventListener('change', e => apply(e.matches));
  }, []);

  // Hide splash screen on app initialization complete
  useEffect(() => {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        splashScreen.classList.add('hidden');
      }, 100);
    }
  }, []);

  // Initialize background cleanup for guest data persistence
  useEffect(() => {
    guestDataPersistence.startBackgroundCleanup();
    return () => {
      guestDataPersistence.stopBackgroundCleanup();
    };
  }, []);

  // Register Android backbutton handler at root layout with stopImmediatePropagation
  // Ensures robust back-button handling across all Android API versions (14+)
  useEffect(() => {
    const handleAndroidBackButton = (event) => {
      navigationStackManager.handleAndroidBackButton(event);
    };

    // Register listener on document root (useCapture phase for early interception)
    // This ensures the handler fires before any child components can interfere
    document.addEventListener('backbutton', handleAndroidBackButton, true);
    
    // Fallback: Also listen at body level for API compatibility
    if (window.device || window.cordova) {
      document.body.addEventListener('backbutton', handleAndroidBackButton, true);
    }

    return () => {
      document.removeEventListener('backbutton', handleAndroidBackButton, true);
      if (window.device || window.cordova) {
        document.body.removeEventListener('backbutton', handleAndroidBackButton, true);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <NavigationProvider>
            <AuthenticatedApp />
            <Toaster />
          </NavigationProvider>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;