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

// Header 높이 (px)
const HEADER_HEIGHT = 48;
// BottomNav 높이 (px, safe-area 제외)
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
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      {/* Header: fixed top */}
      <Header />

      {/* Tab panels: top=HEADER_HEIGHT, bottom=NAV_HEIGHT+safe-area, never covers BottomNav */}
      {TAB_PAGES.map(({ path, component: Component }) => {
        const isActive = currentPath === path;
        const isMounted = visibleTabs.has(path);

        return (
          <div
            key={path}
            ref={el => { scrollRefs.current[path] = el; }}
            style={{
              position: 'absolute',
              top: HEADER_HEIGHT,
              left: 0,
              right: 0,
              // BottomNav 높이 + safe-area-inset-bottom 만큼 bottom 확보
              bottom: `calc(${NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
              overflowY: isActive ? 'auto' : 'hidden',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              visibility: isActive ? 'visible' : 'hidden',
              pointerEvents: isActive ? 'auto' : 'none',
              display: isMounted ? 'block' : 'none',
              zIndex: 1,
            }}
          >
            {isMounted && (
              <Suspense fallback={<TabSkeleton />}>
                <Component />
              </Suspense>
            )}
          </div>
        );
      })}

      {/* BottomNav: fixed to bottom, always above tab panels */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <BottomNav />
      </div>
    </div>
  );
}