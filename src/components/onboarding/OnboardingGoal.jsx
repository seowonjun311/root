import React from 'react';
import { Input } from '@/components/ui/input';

export default function OnboardingGoal({ value, onChange }) {
  return (
    <div className="px-6" role="region" aria-label="목표 입력">
      <h2 className="text-xl font-bold text-center text-amber-900 mb-2">어떤 여정을 시작하시겠습니까?</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">자유롭게 입력해 주세요</p>
      <Input
        id="onboarding-goal-input"
        value={value}
        onChange={onChange}
        placeholder="예: 살 빼고 싶어요, 토익 공부..."
        className="h-12 rounded-xl text-center text-base border-amber-300 focus:border-amber-500 bg-white/80 text-amber-900 placeholder:text-amber-300"
        aria-describedby={!value.trim() ? 'goal-helper' : undefined}
      />
      {!value.trim() && (
        <p id="goal-helper" className="text-xs text-amber-600 text-center mt-2">
          목표를 입력해야 다음으로 진행할 수 있습니다.
        </p>
      )}
      <div className="flex flex-wrap gap-2 mt-4 justify-center">
        {['살 빼고 싶어요', '영어 공부를 시작하고 싶어요', '금연하고 싶어요', '생활을 정리하고 싶어요'].map(ex => (
          <button
            key={ex}
            onClick={() => onChange({ target: { value: ex } })}
            className="text-xs px-3 py-1.5 rounded-full bg-amber-100/80 text-amber-700 hover:bg-amber-200/80 transition-colors active:scale-[0.98] active:opacity-80"
            aria-label={`목표 예시: ${ex} 선택`}
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}