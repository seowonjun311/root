import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Trophy, Settings } from 'lucide-react';

const RouteIcon = () => <span className="text-lg leading-none">🛤️</span>;

const navItems = [
  { path: '/Home', label: '길', icon: RouteIcon },
  { path: '/Records', label: '기록', icon: BookOpen },
  { path: '/Badges', label: '칭호', icon: Trophy },
  { path: '/AppSettings', label: '홈', icon: () => <span className="text-lg leading-none">🏠</span> },
];

export default function BottomNav() {
  const location = useLocation();

  const handleNavClick = (path) => {
    // Scroll to top if already on the same page
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper to determine active path
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom" style={{
      background: 'linear-gradient(180deg, #7a5020 0%, #5a3510 60%, #3d2008 100%)',
      borderTop: '3px solid #a07030',
      boxShadow: '0 -3px 12px rgba(40,20,5,0.5)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* 상단 장식선 */}
      <div className="h-0.5 w-full" style={{
        background: 'linear-gradient(90deg, transparent, #e8c060, #ffd880, #e8c060, transparent)',
        opacity: 0.6,
      }} />
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            onClick={() => handleNavClick(path)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all duration-200 select-none"
            style={isActive(path) ? {
              color: '#ffe8a0',
              textShadow: '0 0 8px rgba(255,200,80,0.6)',
              transform: 'scale(1.05)',
            } : {
              color: 'rgba(220,180,100,0.55)',
            }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-bold">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}