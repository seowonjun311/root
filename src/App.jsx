import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import Header from './components/layout/Header';
import AppLayout from './components/layout/AppLayout';
import { TabNavigationProvider } from './lib/TabNavigationContext';

// ✅ React Query 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// 로딩 화면
const PageFallback = () => (
  <div className="flex items-center justify-center min-h-screen text-sm text-muted-foreground">
    불러오는 중...
  </div>
);

const PageTransition = ({ children }) => <>{children}</>;

// 페이지 lazy 로딩
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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TabNavigationProvider>
          <Routes>
            <Route element={<RootLayout />}>
              
              {/* 온보딩 */}
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

              {/* 목표 생성 */}
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

              {/* 메인 앱 영역 */}
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

                {/* 리다이렉트 */}
                <Route path="/Record" element={<Navigate to="/Records" replace />} />
                <Route path="/Badge" element={<Navigate to="/Badges" replace />} />
                <Route path="/Settings" element={<Navigate to="/AppSettings" replace />} />
              </Route>

              {/* 기본 경로 */}
              <Route path="/" element={<Navigate to="/Home" replace />} />
              <Route path="*" element={<Navigate to="/Home" replace />} />

            </Route>
          </Routes>
        </TabNavigationProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}