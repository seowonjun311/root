import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart2, Trophy, Settings } from 'lucide-react';

const tabs = [
  { id: 'home', label: '홈', icon: Home, path: '/Home' },
  { id: 'records', label: '기록', icon: BarChart2, path: '/Records' },
  { id: 'badges', label: '칭호', icon: Trophy, path: '/Badges' },
  { id: 'settings', label: '설정', icon: Settings, path: '/AppSettings' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white"
      style={{ height: '60px' }}
    >
      <div className="flex h-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={`flex-1 flex flex-col items-center justify-center text-xs ${
                isActive ? 'text-amber-600 font-bold' : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
