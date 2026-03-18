import React, { useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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

// Per-tab scroll position memory
const scrollPositions = {};

export default function AppLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const scrollRefs = useRef({});

  // Save scroll position when leaving a tab, restore when entering
  useEffect(() => {
    TAB_PAGES.forEach(({ path }) => {
      const el = scrollRefs.current[path];
      if (!el) return;
      if (path === currentPath) {
        // Restore saved scroll position
        el.scrollTop = scrollPositions[path] ?? 0;
      } else {
        // Save current scroll position before hiding
        scrollPositions[path] = el.scrollTop;
      }
    });
  }, [currentPath]);

  return (
    <div
      className="bg-background max-w-lg mx-auto flex flex-col"
      style={{
        position: 'absolute',
        inset: 0,
        paddingTop: 'env(safe-area-inset-top)',
        overflow: 'hidden',
      }}
    >
      <Header />

      <div className="flex-1 relative overflow-hidden">
        {TAB_PAGES.map(({ path, component: Component }) => {
          const isActive = currentPath === path;
          return (
            <div
              key={path}
              ref={el => { scrollRefs.current[path] = el; }}
              style={{
                position: 'absolute',
                inset: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                visibility: isActive ? 'visible' : 'hidden',
                pointerEvents: isActive ? 'auto' : 'none',
                // Keep inactive tabs rendered but visually hidden
                contentVisibility: isActive ? 'visible' : 'hidden',
              }}
            >
              <Component />
              <div style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}