import React from 'react';

const categories = [
  { id: 'exercise', label: '운동', emoji: '🏃' },
  { id: 'study', label: '공부', emoji: '📚' },
  { id: 'mental', label: '정신', emoji: '🧘' },
  { id: 'daily', label: '일상', emoji: '🏠' },
];

export default function CategoryTabs({ active, onChange, userLevels = {} }) {
  return (
    <div className="flex gap-2 px-4 py-3">
      {categories.map(({ id, label, emoji }) => {
        const level = userLevels[`${id}_level`] || 1;
        
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-xs font-bold transition-all duration-200
              ${active === id ? 'wood-btn-active' : 'wood-btn'}`}
            style={active === id ? {
              background: 'linear-gradient(180deg, #8b5e20 0%, #6b4010 50%, #5a3008 100%)',
              border: '2px solid #3d2008',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(60,35,5,0.3)',
              color: '#ffe8a0',
            } : {
              background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 50%, #8a6520 100%)',
              border: '2px solid #6b4e15',
              boxShadow: 'inset 0 1px 2px rgba(255,220,120,0.4), 0 3px 6px rgba(60,35,5,0.4)',
              color: '#fff8e8',
              textShadow: '0 1px 2px rgba(60,30,5,0.5)',
            }}
          >
            <span className="text-sm">{emoji}</span>
            <span>{label} Lv.{level}</span>
          </button>
        );
      })}
    </div>
  );
}