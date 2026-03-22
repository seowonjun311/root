import React from 'react';

const categories = [
  { id: 'exercise', label: '운동', emoji: '🏃' },
  { id: 'study', label: '공부', emoji: '📚' },
  { id: 'mental', label: '정신', emoji: '🧘' },
  { id: 'daily', label: '일상', emoji: '🏠' },
];

export default function CategoryTabs({ active, onChange, userLevels = {} }) {
  return (
    <div className="px-4 py-2">
      <div className="grid grid-cols-4 gap-2">
        {categories.map(({ id, label, emoji }) => {
          const level = userLevels[`${id}_level`] || 1;
          const xp = userLevels[`${id}_xp`] || 0;
          const currentXp = xp % 30;
          const xpPercent = Math.max(8, Math.min(100, (currentXp / 30) * 100));
          const isActive = active === id;

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-bold transition-all duration-200 relative overflow-hidden"
              style={
                isActive
                  ? {
                      background: 'linear-gradient(180deg, #8b5e20 0%, #6b4010 55%, #5a3008 100%)',
                      border: '2px solid #3d2008',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.35), 0 2px 6px rgba(60,35,5,0.25)',
                      color: '#ffe8a0',
                    }
                  : {
                      background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 55%, #8a6520 100%)',
                      border: '2px solid #6b4e15',
                      boxShadow: 'inset 0 1px 2px rgba(255,220,120,0.35), 0 2px 5px rgba(60,35,5,0.25)',
                      color: '#fff8e8',
                      textShadow: '0 1px 2px rgba(60,30,5,0.4)',
                    }
              }
              aria-pressed={isActive}
            >
              <div className="text-sm leading-none">{emoji}</div>

              <div className="leading-none whitespace-nowrap">
                {label}
              </div>

              <div className="text-[10px] leading-none opacity-90">
                Lv.{level}
              </div>

              <div className="w-full mt-0.5">
                <div className="h-1.5 bg-black/30 rounded-full overflow-hidden border border-amber-600/30">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>

              <div className="text-[9px] leading-none opacity-80">
                {currentXp}/30
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
