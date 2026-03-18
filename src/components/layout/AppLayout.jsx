import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import Header from './Header';
import Home from '../../pages/Home';
import Records from '../../pages/Records';
import Badges from '../../pages/Badges';
import AppSettings from '../../pages/AppSettings';

const pages = [
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
      className="min-h-screen bg-background max-w-lg mx-auto relative overflow-hidden"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <Header />
      <main className="relative pb-safe-nav">
        {/* Keep all pages mounted for state preservation, only animate the visible one */}
        {pages.map(({ path, component: Component }) => (
          <div
            key={path}
            style={{ display: currentPath === path ? 'block' : 'none' }}
          >
            <Component />
          </div>
        ))}
      </main>
      <BottomNav />
    </div>
  );
}