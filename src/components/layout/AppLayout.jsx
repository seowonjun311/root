import React, { useRef, useEffect, useState, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { navigationStackManager } from '../../lib/NavigationStackManager';
import { useTabNavigation } from '../../lib/TabNavigationContext';
import { tabScrollManager } from '../../lib/TabScrollManager';
import BottomNav from './BottomNav.jsx';
import Header from './Header.jsx';
import Home from '../../pages/Home.jsx';
import Records from '../../pages/Records.jsx';
import Badges from '../../pages/Badges';
import AppSettings from '../../pages/AppSettings';

function TabSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse" aria-hidden="true">
      <div className="h-28 rounded-2xl bg-secondary/60" />
      <div className="flex gap-2">
        {[1,2,3,4].map(i => <div key={i} className="flex-1 h-9 rounded-xl bg-secondary/60" />)}
      </div>
      {[1,2].map(i => <div key={i} className="h-20 rounded-xl bg-secondary/60" />)}
    </div>
  );
}

const TAB_PAGES = [
  { path: '/Home', component: Home },
  { path: '/Records', component: Records },
  { path: '/Badges', component: Badges },
  { path: '/AppSettings', component: AppSettings },
];

// BottomNav 높이 (safe area 제외)
const NAV_HEIGHT = 64;

export default function AppLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const scrollRefs = useRef({});
  const { updateTabState } = useTabNavigation();
  const [visibleTabs, setVisibleTabs] = useState(() => {
    const currentIndex = TAB_PAGES.findIndex(t => t.path === currentPath);
    const initial = new Set([currentPath]);
    if (currentIndex > 0) initial.add(TAB_PAGES[currentIndex - 1].path);
    if (currentIndex < TAB_PAGES.length - 1) initial.add(TAB_PAGES[currentIndex + 1].path);
    return initial;
  });

  useEffect(() => {
    const isTabRoute = TAB_PAGES.some(t => t.path === currentPath);
    if (isTabRoute) {
      navigationStackManager.enforceStackNavigation(currentPath);
    }
  }, [currentPath]);

  useEffect(() => {
    TAB_PAGES.forEach(({ path }) => {
      const el = scrollRefs.current[path];
      if (!el) return;
      if (path === currentPath) {
        tabScrollManager.restoreScrollPosition(path, el);
      } else {
        tabScrollManager.saveScrollPosition(path, el);
        updateTabState(path, { scrollPosition: el.scrollTop });
      }
    });
  }, [currentPath, updateTabState]);

  useEffect(() => {
    const currentIndex = TAB_PAGES.findIndex(t => t.path === currentPath);
    const newVisible = new Set([currentPath]);
    if (currentIndex > 0) newVisible.add(TAB_PAGES[currentIndex - 1].path);
    if (currentIndex < TAB_PAGES.length - 1) newVisible.add(TAB_PAGES[currentIndex + 1].path);
    setVisibleTabs(newVisible);
  }, [currentPath]);

  return (
    <div
      className="bg-background max-w-lg mx-auto"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header: shrinks to its natural size */}
      <Header />

      {/* Tab content area: fills remaining space above BottomNav */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {TAB_PAGES.map(({ path, component: Component }) => {
          const isActive = currentPath === path;
          const isMounted = visibleTabs.has(path);

          return (
            <div
              key={path}
              ref={el => { scrollRefs.current[path] = el; }}
              style={{
                position: 'absolute',
                inset: 0,
                overflowY: isActive ? 'auto' : 'hidden',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                visibility: isActive ? 'visible' : 'hidden',
                // 비활성 탭은 포인터 이벤트 완전 차단
                pointerEvents: isActive ? 'auto' : 'none',
                display: isMounted ? 'block' : 'none',
              }}
            >
              {isMounted && (
                <Suspense fallback={<TabSkeleton />}>
                  <Component />
                  <div style={{ height: '16px' }} />
                </Suspense>
              )}
            </div>
          );
        })}
      </div>

      {/* BottomNav: always rendered as flex child, never covered */}
      <BottomNav />
    </div>
  );
}