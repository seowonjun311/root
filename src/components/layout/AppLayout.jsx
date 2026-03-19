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

const TAB_PAGES = [
  { path: '/Home', component: Home },
  { path: '/Records', component: Records },
  { path: '/Badges', component: Badges },
  { path: '/AppSettings', component: AppSettings },
];

export default function AppLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const scrollRefs = useRef({});
  const { updateTabState, getTabState } = useTabNavigation();
  const [visibleTabs, setVisibleTabs] = useState(() => {
    const currentIndex = TAB_PAGES.findIndex(t => t.path === currentPath);
    const initial = new Set([currentPath]);
    
    if (currentIndex > 0) initial.add(TAB_PAGES[currentIndex - 1].path);
    if (currentIndex < TAB_PAGES.length - 1) initial.add(TAB_PAGES[currentIndex + 1].path);
    
    return initial;
  });

  // Enforce stack-based navigation on all tab route changes
  useEffect(() => {
    const isTabRoute = TAB_PAGES.some(t => t.path === currentPath);
    if (isTabRoute) {
      navigationStackManager.enforceStackNavigation(currentPath);
    }
  }, [currentPath]);

  // Save scroll position when leaving a tab, restore when entering
  useEffect(() => {
    TAB_PAGES.forEach(({ path }) => {
      const el = scrollRefs.current[path];
      if (!el) return;
      
      if (path === currentPath) {
        // Restore saved scroll position using TabScrollManager
        tabScrollManager.restoreScrollPosition(path, el);
      } else {
        // Save current scroll position before hiding
        tabScrollManager.saveScrollPosition(path, el);
        updateTabState(path, { scrollPosition: el.scrollTop });
      }
    });
  }, [currentPath, updateTabState]);

  // Dynamic tab visibility: mount current + adjacent tabs, unmount others
  useEffect(() => {
    const currentIndex = TAB_PAGES.findIndex(t => t.path === currentPath);
    const newVisible = new Set([currentPath]);
    
    if (currentIndex > 0) newVisible.add(TAB_PAGES[currentIndex - 1].path);
    if (currentIndex < TAB_PAGES.length - 1) newVisible.add(TAB_PAGES[currentIndex + 1].path);
    
    setVisibleTabs(newVisible);
  }, [currentPath]);

  return (
    <div
      className="bg-background max-w-lg mx-auto flex flex-col"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      <Header />

      <div className="flex-1 relative overflow-hidden">
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
                pointerEvents: isActive ? 'auto' : 'none',
                display: isMounted ? 'block' : 'none',
              }}
            >
              {isMounted && (
                <Suspense fallback={<div />}>
                  <Component />
                  <div style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
                </Suspense>
              )}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}