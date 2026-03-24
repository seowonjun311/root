import React, { useEffect, lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { NavigationProvider } from '@/lib/NavigationContext';
import { AnimationStateProvider, useAnimationState } from '@/lib/AnimationStateContext';
import { TabNavigationProvider } from '@/lib/TabNavigationContext';
import { navigationStackManager } from '@/lib/NavigationStackManager';
import { guestDataPersistence } from '@/lib/GuestDataPersistence';
import AppLayout from './components/layout/AppLayout.jsx';
import Header from './components/layout/Header.jsx';
import PageTransition from './components/layout/PageTransition';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const Onboarding = lazy(() => import('./pages/Onboarding'));
const PageNotFound = lazy(() => import('./lib/PageNotFound'));
const CreateGoalExercise = lazy(() => import('./pages/CreateGoalExercise'));
const CreateGoalStudy = lazy(() => import('./pages/CreateGoalStudy'));
const CreateGoalMental = lazy(() => import('./pages/CreateGoalMental'));
const CreateGoalDaily = lazy(() => import('./pages/CreateGoalDaily'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));

const PageFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-background">
    <div className="w-7 h-7 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
  </div>
);

const RootRedirect = () => {
  const { isAuthenticated, user, isLoadingAuth } = useAuth();

  if (isLoadingAuth) return <PageFallback />;

  if (isAuthenticated) {
    if (user?.onboarding_complete) {
      return <Navigate to="/Home" replace />;
    }
    return <Navigate to="/Onboarding" replace />;
  }

  const guestData = guestDataPersistence.loadOnboardingData();
  if (guestData?.onboardingComplete) {
    return <Navigate to="/Home" replace />;
  }

  return <Navigate to="/Onboarding" replace />;
};

const AppRoutes = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAnimating } = useAnimationState();
  const [isNavReady, setIsNavReady] = React.useState(false);

  useEffect(() => {
    const validateNavigation = async () => {
      try {
        const isValid = navigationStackManager.validateStack();
        if (!isValid) {
          navigationStackManager.resetStack();
        }

        if (window.device || window.cordova) {
          const syncReport = navigationStackManager.validateAndroidWebViewSync();
          if (!syncReport.isInSync) {
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

  useEffect(() => {
    const handleAndroidBackButton = (event) => {
      if (isAnimating) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      navigationStackManager.handleAndroidBackButton(event);
    };

    document.addEventListener('backbutton', handleAndroidBackButton, true);

    return () => {
      document.removeEventListener('backbutton', handleAndroidBackButton, true);
    };
  }, [isAnimating]);

  if (isLoadingPublicSettings || isLoadingAuth || !isNavReady) {
    return <PageFallback />;
  }

  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
      <ErrorBoundary onResetToHome={() => navigate('/Home', { replace: true })}>
        <Suspense fallback={<PageFallback />}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<RootRedirect />} />

              <Route
                path="/Onboarding"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <Onboarding />
                  </Suspense>
                }
              />

              <Route
                path="/CreateGoalExercise"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <PageTransition>
                      <Header />
                      <CreateGoalExercise />
                    </PageTransition>
                  </Suspense>
                }
              />

              <Route
                path="/CreateGoalStudy"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <PageTransition>
                      <Header />
                      <CreateGoalStudy />
                    </PageTransition>
                  </Suspense>
                }
              />

              <Route
                path="/CreateGoalMental"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <PageTransition>
                      <Header />
                      <CreateGoalMental />
                    </PageTransition>
                  </Suspense>
                }
              />

              <Route
                path="/CreateGoalDaily"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <PageTransition>
                      <Header />
                      <CreateGoalDaily />
                    </PageTransition>
                  </Suspense>
                }
              />

              <Route element={<AppLayout />}>
                <Route path="/Home" element={<div />} />
                <Route path="/Records" element={<div />} />
                <Route path="/Badges" element={<div />} />
                <Route path="/AppSettings" element={<div />} />

                {/* 예전 경로 호환 */}
                <Route path="/Record" element={<Navigate to="/Records" replace />} />
                <Route path="/Badge" element={<Navigate to="/Badges" replace />} />
                <Route path="/Settings" element={<Navigate to="/AppSettings" replace />} />
              </Route>

              <Route
                path="/NotificationSettings"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <PageTransition>
                      <Header />
                      <NotificationSettings />
                    </PageTransition>
                  </Suspense>
                }
              />

              <Route
                path="/PrivacyPolicy"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <PrivacyPolicy />
                  </Suspense>
                }
              />

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
    mq.addEventListener('change', (e) => apply(e.matches));

    return () => {
      mq.removeEventListener('change', (e) => apply(e.matches));
    };
  }, []);

  useEffect(() => {
    const hideSplash = async () => {
      try {
        await new Promise((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(resolve);
          });
        });

        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen && !splashScreen.classList.contains('hidden')) {
          splashScreen.style.transition = 'opacity 0.3s ease-out';
          splashScreen.style.opacity = '0';

          setTimeout(() => {
            splashScreen.classList.add('hidden');
            splashScreen.style.opacity = '1';
          }, 300);
        }
      } catch (error) {
        console.warn('[App] Splash screen removal error:', error);
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
          splashScreen.classList.add('hidden');
        }
      }
    };

    hideSplash();
  }, []);

  useEffect(() => {
    try {
      guestDataPersistence.startBackgroundCleanup();
    } catch (error) {
      console.warn('[App] Guest data cleanup initialization error:', error);
    }

    return () => {
      try {
        guestDataPersistence.stopBackgroundCleanup();
      } catch (error) {
        console.warn('[App] Guest data cleanup stop error:', error);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <NavigationProvider>
            <AnimationStateProvider>
              <TabNavigationProvider>
                <AppRoutes />
                <Toaster />
              </TabNavigationProvider>
            </AnimationStateProvider>
          </NavigationProvider>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
