import React from 'react';

export default function OnboardingDDay({ value, onChange }) {
  return (
    <div className="px-6 space-y-4">
      <div className="text-center pt-4 pb-2">
        <p className="text-4xl mb-3">📚</p>
        <h2 className="text-xl font-bold text-amber-900">시험 D-day가 있나요?</h2>
        <p className="text-sm text-muted-foreground mt-1">목표 유형에 따라 다르게 설정돼요</p>
      </div>
      <button
        onClick={() => onChange(true)}
        className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
          value === true ? 'border-amber-600 bg-amber-100/80' : 'border-border bg-card hover:border-amber-400/50'}`}
        aria-label="D-day 있음 선택"
        aria-pressed={value === true}
      >
        <p className="font-bold text-amber-900 text-base">📅 D-day 있음</p>
        <p className="text-sm text-amber-700/70 mt-1">시험이나 마감일이 정해져 있어요</p>
      </button>
      <button
        onClick={() => onChange(false)}
        className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
          value === false ? 'border-amber-600 bg-amber-100/80' : 'border-border bg-card hover:border-amber-400/50'}`}
        aria-label="D-day 없음 선택"
        aria-pressed={value === false}
      >
        <p className="font-bold text-foreground text-base">📖 D-day 없음</p>
        <p className="text-sm text-muted-foreground mt-1">꾸준히 공부 습관을 만들고 싶어요</p>
      </button>
    </div>
  );
}