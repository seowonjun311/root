import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const TAB_PATHS = ['/Home', '/Records', '/Badges', '/AppSettings'];

const PAGE_TITLES = {
  '/CreateGoal': '목표 만들기',
  '/NotificationSettings': '알림 설정',
};

const GO_HOME_DIRECTLY = [
  '/CreateGoalExercise',
  '/CreateGoalStudy',
  '/CreateGoalMental',
  '/CreateGoalDaily',
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isTabPage = TAB_PATHS.includes(location.pathname);
  const title = PAGE_TITLES[location.pathname] || '';
  const canGoBack = !isTabPage && location.key !== 'default';

  if (isTabPage) {
    return null;
  }

  return (
    <div
      className="flex items-center px-4 gap-3 shrink-0"
      style={{
        height: 'calc(52px + env(safe-area-inset-top))',
        paddingTop: 'env(safe-area-inset-top)',
        borderBottom: '1px solid hsl(var(--border) / 0.4)',
      }}
    >
      {canGoBack && (
        <button
          onClick={() => GO_HOME_DIRECTLY.includes(location.pathname) ? navigate('/Home') : navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors -ml-1.5"
          aria-label="이전 페이지로 돌아가기"
        >
          <ChevronLeft className="w-5 h-5 text-amber-800" aria-hidden="true" />
        </button>
      )}
      {title && <span className="text-sm font-bold text-amber-900">{title}</span>}
    </div>
  );
}