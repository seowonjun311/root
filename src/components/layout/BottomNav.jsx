import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Trophy, Settings } from 'lucide-react';

const RouteIcon = () => <span className="text-lg leading-none">🛤️</span>;

const navItems = [
  { path: '/Home', label: '길', icon: RouteIcon },
  { path: '/Records', label: '기록', icon: BookOpen },
  { path: '/Badges', label: '칭호', icon: Trophy },
  { path: '/AppSettings', label: '설정', icon: Settings },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-amber-900/95 to-amber-800/90 backdrop-blur-md border-t border-amber-700/50 safe-area-bottom">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200
                ${isActive
                  ? 'text-amber-200 scale-105'
                  : 'text-amber-100/60 hover:text-amber-200/80'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'drop-shadow-lg' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}