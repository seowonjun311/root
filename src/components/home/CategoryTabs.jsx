import React from 'react';

const categories = [
  { id: 'exercise', label: '운동', emoji: '🏃' },
  { id: 'study', label: '공부', emoji: '📚' },
  { id: 'mental', label: '정신', emoji: '🧘' },
  { id: 'daily', label: '일상', emoji: '🏠' },
];

export default function CategoryTabs({ active, onChange }) {
  return (
    <div className="flex gap-1.5 px-4 py-3">
      {categories.map(({ id, label, emoji }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
            ${active === id
              ? 'bg-amber-700 text-amber-50 shadow-md shadow-amber-800/30 scale-[1.02]'
              : 'bg-secondary/70 text-muted-foreground hover:bg-secondary'}`}
        >
          <span className="text-base">{emoji}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}