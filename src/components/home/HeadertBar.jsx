import React from 'react';
import { Settings, Gem, Leaf, ScanSearch } from 'lucide-react';

export default function HeaderBar({
  user,
  points = 0,
  gems = 0,
  isOverview = false,
  onToggleOverview,
  onOpenSettings,
}) {
  return (
    <div className="fixed left-0 right-0 top-0 z-[60] px-4 pt-3">
      <div
        className="mx-auto flex h-[64px] max-w-5xl items-center justify-between rounded-2xl px-3 shadow-lg"
        style={{
          background: 'rgba(255, 248, 232, 0.88)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(160,120,64,0.18)',
        }}
      >
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(160,120,64,0.16)',
            color: '#6b4e15',
          }}
        >
          <Settings className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 px-3 text-center">
          {!!user?.title && (
            <div
              className="truncate text-[11px] font-bold"
              style={{ color: '#a56d17' }}
            >
              {user.title}
            </div>
          )}
          <div
            className="truncate text-[15px] font-extrabold"
            style={{ color: '#4a2c08' }}
          >
            {user?.nickname || '용사'}
          </div>
          <div
            className="truncate text-[11px] font-semibold"
            style={{ color: '#8a5a17' }}
          >
            전체 Lv.{user?.level || 1}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-extrabold"
            style={{
              background: 'rgba(220, 248, 220, 0.95)',
              color: '#2f6b2f',
              border: '1px solid rgba(80,140,80,0.15)',
            }}
          >
            <Leaf className="h-3.5 w-3.5" />
            <span>{points}</span>
          </div>

          <div
            className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-extrabold"
            style={{
              background: 'rgba(225, 236, 255, 0.95)',
              color: '#355c9a',
              border: '1px solid rgba(80,120,180,0.15)',
            }}
          >
            <Gem className="h-3.5 w-3.5" />
            <span>{gems}</span>
          </div>

          <button
            type="button"
            onClick={onToggleOverview}
            className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-extrabold"
            style={{
              background: isOverview
                ? 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)'
                : 'rgba(255,255,255,0.78)',
              color: isOverview ? '#fff8e8' : '#6b4e15',
              border: isOverview
                ? '2px solid #6b4e15'
                : '1px solid rgba(160,120,64,0.16)',
            }}
          >
            <ScanSearch className="h-3.5 w-3.5" />
            <span>{isOverview ? '돌아가기' : '전체보기'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
