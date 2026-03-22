import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Header from './components/layout/Header';
import AppLayout from './components/layout/AppLayout';
import { TabNavigationProvider } from './lib/TabNavigationContext';

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-screen text-sm text-muted-foreground">
    불러오는 중...
  </div>
);

const PageTransition = ({ children }) => <>{children}</>;

const Home = lazy(() => import('./pages/Home'));
const Records = lazy(() => import('./pages/Records'));
const Badges = lazy(() => import('./pages/Badges'));
const AppSettings = lazy(() => import('./pages/AppSettings'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const CreateGoal = lazy(() => import('./pages/CreateGoal'));

const CreateGoalExercise = lazy(() => import('./pages/CreateGoalExercise'));
const CreateGoalStudy = lazy(() => import('./pages/CreateGoalStudy'));
const CreateGoalMental = lazy(() => import('./pages/CreateGoalMental'));
const CreateGoalDaily = lazy(() => import('./pages/CreateGoalDaily'));

function RootLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Outlet />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TabNavigationProvider>
        <Routes>
          <Route element={<RootLayout />}>
            <Route
              path="/Onboarding"
              element={
                <Suspense fallback={<PageFallback />}>
                  <PageTransition>
                    <Onboarding />
                  </PageTransition>
                </Suspense>
              }
            />

            <Route
              path="/CreateGoal"
              element={
                <Suspense fallback={<PageFallback />}>
                  <PageTransition>
                    <Header />
                    <CreateGoal />
                  </PageTransition>
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
              <Route
                path="/Home"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <PageTransition>
                      <Home />
                    </PageTransition>
                  </Suspense>
                }
              />

              <Route
                path="/Records"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <PageTransition>
                      <Records />
                    </PageTransition>
                  </Suspense>
                }
              />

              <Route
                path="/Badges"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <PageTransition>
                      <Badges />
                    </PageTransition>
                  </Suspense>
                }
              />

              <Route
                path="/AppSettings"
                element={
                  <Suspense fallback={<PageFallback />}>
                    <PageTransition>
                      <AppSettings />
                    </PageTransition>
                  </Suspense>
                }
              />

              <Route path="/Record" element={<Navigate to="/Records" replace />} />
              <Route path="/Badge" element={<Navigate to="/Badges" replace />} />
              <Route path="/Settings" element={<Navigate to="/AppSettings" replace />} />
            </Route>

            <Route path="/" element={<Navigate to="/Home" replace />} />
            <Route path="*" element={<Navigate to="/Home" replace />} />
          </Route>
        </Routes>
      </TabNavigationProvider>
    </BrowserRouter>
  );
}
