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

export default function AppLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const scrollRefs = useRef({});
  const { updateTabState } = useTabNavigation();
  const [visibleTabs, setVisibleTabs] = useState(() => new Set([currentPath]));

  useEffect(() => {
    const isTabRoute = TAB_PAGES.some(t => t.path === currentPath);
    if (isTabRoute) navigationStackManager.enforceStackNavigation(currentPath);
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
    setVisibleTabs(prev => new Set([...prev, currentPath]));
  }, [currentPath]);

  return (
    // 최상위: flex column, 전체 화면 고정
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      backgroundColor: 'hsl(var(--background))',
    }}>
      {/* 헤더 - flex child */}
      <Header />

      {/* 탭 콘텐츠 - flex grow */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {TAB_PAGES.map(({ path, component: Component }) => {
          const isActive = currentPath === path;
          const isMounted = visibleTabs.has(path);
          if (!isMounted) return null;

          return (
            <div
              key={path}
              ref={el => { scrollRefs.current[path] = el; }}
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                // 비활성 탭: 완전히 뒤로 숨김 + 클릭 차단
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
                zIndex: isActive ? 1 : 0,
              }}
            >
              <Suspense fallback={<TabSkeleton />}>
                <Component />
              </Suspense>
            </div>
          );
        })}
      </div>

      {/* BottomNav - flex child, 항상 맨 아래 */}
      <BottomNav />
    </div>
  );
}