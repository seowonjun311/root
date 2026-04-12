import React from 'react';
import { ShoppingBag, Backpack, Maximize2, Minimize2 } from 'lucide-react';

export default function VillageOverlayBar({ nickname, level, points, onOpenShop, onOpenBag, onToggleOverview, isOverview }) {
  return (
    <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
      <div
        className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
        style={{ background: 'rgba(255,248,232,0.88)', color: '#4a2c08', backdropFilter: 'blur(4px)' }}
      >
        <span>{nickname}</span>
        <span style={{ color: '#c49a4a' }}>Lv.{level}</span>
        <span className="ml-1" style={{ color: '#8b5a20' }}>✦ {points}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenShop}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,248,232,0.88)', backdropFilter: 'blur(4px)' }}
          aria-label="상점"
        >
          <ShoppingBag className="w-4 h-4" style={{ color: '#8b5a20' }} />
        </button>
        <button
          onClick={onOpenBag}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,248,232,0.88)', backdropFilter: 'blur(4px)' }}
          aria-label="가방"
        >
          <Backpack className="w-4 h-4" style={{ color: '#8b5a20' }} />
        </button>
        <button
          onClick={onToggleOverview}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(255,248,232,0.88)', backdropFilter: 'blur(4px)' }}
          aria-label={isOverview ? '확대' : '전체보기'}
        >
          {isOverview
            ? <Minimize2 className="w-4 h-4" style={{ color: '#8b5a20' }} />
            : <Maximize2 className="w-4 h-4" style={{ color: '#8b5a20' }} />}
        </button>
      </div>
    </div>
  );
}