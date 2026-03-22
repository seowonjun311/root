import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Header from './components/Header';
import BottomNav from './components/layout/BottomNav';
import AppLayout from './components/layout/AppLayout';

const PageFallback = () => (
  <div className="flex items-center justify-center min-h-screen text-sm text-muted-foreground">
    불러오는 중...
  </div>
);

const PageTransition = ({ children }) => <>{children}</>;

// 🔥 핵심 페이지들
const Home = lazy(() => import('./pages/Home'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const CreateGoal = lazy(() => import('./pages/CreateGoal'));

// 기존 (혹시 남아있으면 사용)
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

          {/* 🔥 핵심: CreateGoal 통합 페이지 */}
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

          {/* (기존 유지 - 안써도 OK) */}
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

          {/* 앱 메인 영역 */}
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

            <Route path="/Records" element={<div />} />
            <Route path="/Badges" element={<div />} />
            <Route path="/AppSettings" element={<div />} />

            {/* 리다이렉트 */}
            <Route path="/Record" element={<Navigate to="/Records" replace />} />
            <Route path="/Badge" element={<Navigate to="/Badges" replace />} />
            <Route path="/Settings" element={<Navigate to="/AppSettings" replace />} />
          </Route>

          {/* 기본 진입 */}
          <Route path="/" element={<Navigate to="/Home" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
