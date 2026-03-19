import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { BookOpen, Trophy } from 'lucide-react';

const RouteIcon = () => <span className="text-lg leading-none">🛤️</span>;
const HomeIcon = () => <span className="text-lg leading-none">🏠</span>;

const navItems = [
  { path: '/Home', label: '길', icon: RouteIcon },
  { path: '/Records', label: '기록', icon: BookOpen },
  { path: '/Badges', label: '칭호', icon: Trophy },
  { path: '/AppSettings', label: '홈', icon: HomeIcon },
];

export default function BottomNav() {
  const location = useLocation();
  const { triggerHaptic } = useHapticFeedback();
  const [pressed, setPressed] = useState(null);

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (path) => {
    triggerHaptic('impact', 'light');
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav
      style={{
        background: 'linear-gradient(180deg, #7a5020 0%, #5a3510 60%, #3d2008 100%)',
        borderTop: '3px solid #a07030',
        boxShadow: '0 -3px 12px rgba(40,20,5,0.5)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        position: 'relative',
        zIndex: 100,
      }}
    >
      <div className="h-0.5 w-full" style={{
        background: 'linear-gradient(90deg, transparent, #e8c060, #ffd880, #e8c060, transparent)',
        opacity: 0.6,
      }} />
      <div className="flex justify-around items-center max-w-lg mx-auto px-2" style={{ height: '64px' }}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          const isPressed = pressed === path;
          return (
            <Link
              key={path}
              to={path}
              onClick={() => handleNavClick(path)}
              onTouchStart={() => setPressed(path)}
              onTouchEnd={() => setPressed(null)}
              onMouseDown={() => setPressed(path)}
              onMouseUp={() => setPressed(null)}
              className="flex flex-col items-center justify-center gap-0.5 rounded-xl select-none"
              style={{
                minWidth: '64px',
                minHeight: '48px',
                transition: 'transform 0.1s ease, color 0.15s ease',
                transform: isPressed ? 'scale(0.88)' : active ? 'scale(1.08)' : 'scale(1)',
                color: active ? '#ffe8a0' : isPressed ? '#d4b060' : 'rgba(220,180,100,0.55)',
                textShadow: active ? '0 0 8px rgba(255,200,80,0.6)' : 'none',
              }}
              aria-label={`${label} 탭으로 이동`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-[10px] font-bold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}