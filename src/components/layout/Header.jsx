import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const ROOT_TABS = ['/Home', '/Records', '/Badges', '/AppSettings'];

export default function Header({ showBrand = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isRootTab = ROOT_TABS.includes(location.pathname);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <header className="flex items-center justify-between h-12 px-4 bg-background border-b border-border/30" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center flex-1">
        {isRootTab ? (
          <h1 className="text-lg font-bold text-amber-900">🦊 Route</h1>
        ) : (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-amber-900 hover:opacity-70 transition-opacity active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-semibold">뒤로</span>
          </button>
        )}
      </div>
    </header>
  );
}