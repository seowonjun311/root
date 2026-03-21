import React from 'react';

const categories = [
  { id: 'exercise', label: '운동', emoji: '🏃' },
  { id: 'study', label: '공부', emoji: '📚' },
  { id: 'mental', label: '정신', emoji: '🧘' },
  { id: 'daily', label: '일상', emoji: '🏠' },
];

export default function CategoryTabs({ active, onChange, userLevels = {} }) {
  return (
    <div className="px-4 py-3">
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {categories.map(({ id, label, emoji }) => {
          const level = userLevels[`${id}_level`] || 1;
          const xp = userLevels[`${id}_xp`] || 0;
          const currentXp = xp % 30;
          const xpPercent = Math.max(8, (currentXp / 30) * 100);

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="shrink-0 flex flex-col gap-1 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 relative overflow-hidden"
              style={
                active === id
                  ? {
                      width: '132px',
                      minWidth: '132px',
                      background: 'linear-gradient(180deg, #8b5e20 0%, #6b4010 50%, #5a3008 100%)',
                      border: '2px solid #3d2008',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(60,35,5,0.3)',
                      color: '#ffe8a0',
                    }
                  : {
                      width: '132px',
                      minWidth: '132px',
                      background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 50%, #8a6520 100%)',
                      border: '2px solid #6b4e15',
                      boxShadow: 'inset 0 1px 2px rgba(255,220,120,0.4), 0 3px 6px rgba(60,35,5,0.4)',
                      color: '#fff8e8',
                      textShadow: '0 1px 2px rgba(60,30,5,0.5)',
                    }
              }
            >
              <div className="flex items-center justify-center gap-1">
                <span className="text-sm">{emoji}</span>
                <span>{label} Lv.{level}</span>
              </div>

              <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-amber-600/40">
                <div
                  className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full transition-all duration-300"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>

              <span className="text-[9px] opacity-80 text-center">{currentXp}/30</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
