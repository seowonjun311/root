import React from 'react';
import { Input } from '@/components/ui/input';
import { CalendarDays } from 'lucide-react';

export default function OnboardingDDayDate({ dDay, onDDayChange, examTitle, onExamChange }) {
  const daysLeft = dDay ? Math.ceil((new Date(dDay) - new Date()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="px-6 space-y-5">
      <div className="text-center">
        <h2 className="text-xl font-bold text-amber-900 mb-1">시험 정보를 입력해 주세요</h2>
      </div>
      <div>
        <label className="text-sm font-semibold text-amber-800 mb-2 block flex items-center gap-1">
          <CalendarDays className="w-4 h-4" /> 시험 날짜 (D-day)
        </label>
        <input
          type="date"
          value={dDay}
          min={new Date().toISOString().split('T')[0]}
          onChange={onDDayChange}
          className="w-full h-12 rounded-xl border border-input bg-white/80 px-4 text-sm text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
        />
        {daysLeft !== null && daysLeft > 0 && (
          <p className="text-xs text-amber-700 font-semibold mt-2">🎯 D-{daysLeft} · {daysLeft}일 남았습니다</p>
        )}
      </div>
      <div>
        <label className="text-sm font-semibold text-amber-800 mb-2 block">어떤 시험인가요?</label>
        <Input
          value={examTitle}
          onChange={onExamChange}
          placeholder="예: 토익 900점, 수능, 정보처리기사..."
          className="h-12 rounded-xl bg-white/80 text-amber-900 placeholder:text-amber-300"
        />
      </div>
    </div>
  );
}