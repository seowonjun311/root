import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import Header from './Header';
import Home from '../../pages/Home';
import Records from '../../pages/Records';
import Badges from '../../pages/Badges';
import AppSettings from '../../pages/AppSettings';

/**
 * AppLayout mounts ALL tab pages simultaneously so each tab independently
 * preserves its scroll position, state, and navigation stack.
 * Only the active tab is visible (display:block vs display:none).
 */

const TAB_PAGES = [
  { path: '/Home', component: Home },
  { path: '/Records', component: Records },
  { path: '/Badges', component: Badges },
  { path: '/AppSettings', component: AppSettings },
];

export default function AppLayout() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div
      className="bg-background max-w-lg mx-auto flex flex-col"
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        overflow: 'hidden',
      }}
    >
      <Header />

      {/* Each tab gets its own scrollable container — hidden when inactive */}
      <div className="flex-1 relative overflow-hidden">
        {TAB_PAGES.map(({ path, component: Component }) => (
          <TabScrollContainer key={path} active={currentPath === path}>
            <Component />
            {/* Bottom padding so content clears the nav bar */}
            <div style={{ height: 'calc(64px + env(safe-area-inset-bottom))' }} />
          </TabScrollContainer>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}

/** Independent scrollable area per tab. Preserves scroll position while hidden. */
function TabScrollContainer({ active, children }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: active ? 'auto' : 'hidden',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        visibility: active ? 'visible' : 'hidden',
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}