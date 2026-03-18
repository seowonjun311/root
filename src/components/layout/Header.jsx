import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const ROOT_TABS = ['/Home', '/Records', '/Badges', '/AppSettings'];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const isRootTab = ROOT_TABS.includes(location.pathname);

  // Use React Router's own history stack (location.key changes on every push).
  // 'default' is the key React Router assigns to the very first entry — meaning
  // we arrived here directly (no history to go back to).
  const canGoBack = location.key !== 'default';

  const goBack = () => {
    if (canGoBack) {
      navigate(-1);
    } else {
      navigate('/Home', { replace: true });
    }
  };

  return (
    <header className="flex items-center h-12 px-2 bg-background border-b border-border/30 sticky top-0 z-40">
      <div className="flex items-center flex-1 min-h-[44px]">
        {isRootTab ? (
          <h1 className="text-lg font-bold text-amber-900 px-2">🦊 Route</h1>
        ) : (
          <button
            onClick={goBack}
            className="flex items-center gap-1 text-amber-900 hover:opacity-70 transition-opacity active:scale-95 min-w-[44px] min-h-[44px] px-2"
            aria-label="뒤로"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">뒤로</span>
          </button>
        )}
      </div>
    </header>
  );
}