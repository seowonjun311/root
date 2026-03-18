import React, { useEffect, lazy, Suspense } from 'react'
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NavigationProvider } from '@/lib/NavigationContext';
import { AnimationStateProvider } from '@/lib/AnimationStateContext';
import { navigationStackManager } from '@/lib/NavigationStackManager';
import { guestDataPersistence } from '@/lib/GuestDataPersistence';
import AppLayout from './components/layout/AppLayout.jsx';
import Header from './components/layout/Header.jsx';
import PageTransition from './components/layout/PageTransition';
import ErrorBoundary from './components/ErrorBoundary.jsx';
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

const AppContent = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavReady, setIsNavReady] = React.useState(false);

  React.useEffect(() => {
    const validateNavigation = async () => {
      try {
        const isValid = navigationStackManager.validateStack();
        if (!isValid) {
          console.warn('[App] Navigation stack validation failed, forcing reset');
          navigationStackManager.resetStack();
        }

        // On Android WebView, validate sync status for diagnostics
        if (window.device || window.cordova) {
          const syncReport = navigationStackManager.validateAndroidWebViewSync();
          if (!syncReport.isInSync) {
            console.warn('[App] Android WebView desync detected, revalidating stack');
            navigationStackManager.validateStack();
          }
        }

        setIsNavReady(true);
      } catch (error) {
        console.error('[App] Navigation validation error:', error);
        setIsNavReady(true);
      }
    };

    validateNavigation();
  }, []);

  if (isLoadingPublicSettings || isLoadingAuth || !isNavReady) {
    return <PageFallback />;
  }

  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
      <ErrorBoundary onResetToHome={() => navigate('/Home', { replace: true })}>
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/Onboarding" replace />} />

              <Route path="/Onboarding" element={
                <Suspense fallback={<PageFallback />}>
                  <Onboarding />
                </Suspense>
              } />

              <Route path="/CreateGoal" element={
                <Suspense fallback={<PageFallback />}>
                  <PageTransition>
                    <Header />
                    <CreateGoal />
                  </PageTransition>
                </Suspense>
              } />

              {/* Tab routes: AppLayout keeps all tabs mounted for instant switching */}
              <Route element={<AppLayout />}>
                <Route path="/Home"        element={<div />} />
                <Route path="/Records"     element={<div />} />
                <Route path="/Badges"      element={<div />} />
                <Route path="/AppSettings" element={<div />} />
              </Route>

              <Route path="/NotificationSettings" element={
                <Suspense fallback={<PageFallback />}>
                  <PageTransition>
                    <Header />
                    <NotificationSettings />
                  </PageTransition>
                </Suspense>
              } />

              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </ErrorBoundary>
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

  // Hide splash screen only after react-query hydration and initial render completes
  useEffect(() => {
    const hideSplash = async () => {
      try {
        // Wait for QueryClient to hydrate and stabilize
        // This ensures all initial queries are cached before splash screen is removed
        const hydrationStart = performance.now();
        
        // Use requestAnimationFrame to wait for React's initial render
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            // Wait one more frame to ensure component mount is complete
            requestAnimationFrame(resolve);
          });
        });

        // Verify QueryClient is fully initialized
        const queryCache = queryClientInstance.getQueryCache();
        const initialQueriesCount = queryCache.getAll().length;
        
        // Wait a bit longer if queries are still being added (hydration in progress)
        if (initialQueriesCount === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const hydrationTime = performance.now() - hydrationStart;
        console.log(`[App] QueryClient hydration complete in ${hydrationTime.toFixed(2)}ms`);

        // Now safe to hide splash screen
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen && !splashScreen.classList.contains('hidden')) {
          // Use CSS transition for smooth fade
          splashScreen.style.transition = 'opacity 0.3s ease-out';
          splashScreen.style.opacity = '0';
          
          // Remove from DOM after transition
          setTimeout(() => {
            splashScreen.classList.add('hidden');
            splashScreen.style.opacity = '1'; // Reset for potential re-init
          }, 300);
        }
      } catch (error) {
        console.warn('[App] Splash screen removal error:', error);
        // Force hide on error to prevent indefinite loading state
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
          splashScreen.classList.add('hidden');
        }
      }
    };

    hideSplash();
  }, []);

  // Initialize background cleanup for guest data persistence
  useEffect(() => {
    guestDataPersistence.startBackgroundCleanup();
    return () => {
      guestDataPersistence.stopBackgroundCleanup();
    };
  }, []);

  // Register Android back button handler
  useEffect(() => {
    const handleAndroidBackButton = (event) => {
      // Import here to avoid circular dependency
      const animationStateModule = require('@/lib/AnimationStateContext');
      const state = animationStateModule;
      
      // Prevent back navigation during page transitions
      if (state && state.isAnimating) {
        event.preventDefault();
        event.stopImmediatePropagation();
        console.log('[App] Back button blocked during animation');
        return;
      }

      navigationStackManager.handleAndroidBackButton(event);
    };

    // Single listener at document level with capture phase
    document.addEventListener('backbutton', handleAndroidBackButton, true);

    return () => {
      document.removeEventListener('backbutton', handleAndroidBackButton, true);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <NavigationProvider>
            <AnimationStateProvider>
              <AppContent />
              <Toaster />
            </AnimationStateProvider>
          </NavigationProvider>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;