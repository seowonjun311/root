import React from 'react';

const CATEGORY_OPTIONS = [
  { id: 'exercise', label: '운동', emoji: '🏃' },
  { id: 'study', label: '공부', emoji: '📚' },
  { id: 'mental', label: '정신', emoji: '🧘' },
  { id: 'daily', label: '일상', emoji: '🏠' },
];

export default function OnboardingCategory({ value, onChange }) {
  return (
    <div className="px-6">
      <h2 className="text-xl font-bold text-center text-amber-900 mb-6">이 목표는 어떤 영역인가요?</h2>
      <div className="grid grid-cols-2 gap-3">
        {CATEGORY_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center
              ${value === opt.id ? 'border-amber-600 bg-amber-100/80 shadow-md scale-[1.02]' : 'border-border bg-card hover:border-amber-400/50'}`}
            aria-label={`${opt.label} 선택`}
            aria-pressed={value === opt.id}
          >
            <span className="text-3xl block mb-2" aria-hidden="true">{opt.emoji}</span>
            <span className="font-semibold text-sm">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}