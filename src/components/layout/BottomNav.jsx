import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, BarChart3, Trophy, Settings } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      path: '/Home',
      label: '길',
      icon: Home,
    },
    {
      path: '/Record',
      label: '기록',
      icon: BarChart3,
    },
    {
      path: '/Badge',
      label: '칭호',
      icon: Trophy,
    },
    {
      path: '/AppSettings',
      label: '설정',
      icon: Settings,
    },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: '#fff',
        borderTop: '1px solid #eee',
      }}
    >
      <div className="flex justify-around items-center h-[64px]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center flex-1"
              style={{
                color: isActive ? '#f59e0b' : '#999',
                fontWeight: isActive ? '600' : '400',
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: '11px', marginTop: '4px' }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
