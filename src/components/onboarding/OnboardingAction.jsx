import React from 'react';
import { Input } from '@/components/ui/input';

const ACTION_TYPE_OPTIONS = [
  { value: 'timer', label: '시간 기록형', desc: '시간을 기록하며 수행합니다', emoji: '⏱️' },
  { value: 'confirm', label: '확인형', desc: '했으면 확인을 누릅니다', emoji: '✅' },
  { value: 'abstain', label: '안하기', desc: '나쁜 습관을 참으며 기록합니다', emoji: '🚫' },
];

export default function OnboardingAction({
  category,
  actionTitle,
  onActionTitleChange,
  actionType,
  onActionTypeChange,
  frequency,
  onFrequencyChange,
  actionMinutes,
  onActionMinutesChange,
}) {
  return (
    <div className="px-6">
      <h2 className="text-lg font-bold text-center text-amber-900 mb-1">이 목표를 위해 어떤 행동을 하시겠습니까?</h2>
      <p className="text-xs text-muted-foreground text-center mb-5">행동 목표를 설정해 주세요</p>
      <div role="status" aria-live="polite" aria-label="선택된 행동 유형 및 주 횟수" className="sr-only">
        선택됨: {actionType === 'timer' ? '시간 기록형' : actionType === 'confirm' ? '확인형' : '안하기'}, 주 {frequency}회
        {actionType === 'timer' && `, 1회 ${actionMinutes}분`}
      </div>
      <Input
        value={actionTitle}
        onChange={onActionTitleChange}
        placeholder="예: 러닝, LC 공부, 명상..."
        className="h-11 rounded-xl text-center text-sm border-amber-300 bg-white/80 mb-4 text-amber-900 placeholder:text-amber-300"
      />
      <p className="text-xs font-semibold text-amber-800 mb-2" id="action-type-label">행동 유형</p>
      <div className="space-y-2 mb-4" role="group" aria-labelledby="action-type-label">
        {ACTION_TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onActionTypeChange(opt.value)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              actionType === opt.value ? 'border-amber-600 bg-amber-50/80' : 'border-border bg-card hover:border-amber-300'}`}
            aria-label={`${opt.label}: ${opt.desc} 선택`}
            aria-pressed={actionType === opt.value}
          >
            <span className="text-xl" aria-hidden="true">{opt.emoji}</span>
            <div>
              <p className="text-sm font-semibold">
                {opt.label}
                {category === 'exercise' && opt.value === 'timer' && ' (GPS 측정 가능)'}
              </p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs font-semibold text-amber-800 mb-2" id="frequency-label">주 횟수</p>
      <div className="grid grid-cols-7 gap-1.5 mb-4" role="group" aria-labelledby="frequency-label">
        {[1, 2, 3, 4, 5, 6, 7].map(f => (
          <button
            key={f}
            onClick={() => onFrequencyChange(f)}
            className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
              frequency === f ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}
            aria-label={`주 ${f}회 선택`}
            aria-pressed={frequency === f}
          >
            {f}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-4" role="status" aria-live="polite">주 {frequency}회</p>
      {actionType === 'timer' && (
        <>
          <p className="text-xs font-semibold text-amber-800 mb-2" id="minutes-label">1회 시간</p>
          <div className="flex gap-2 mb-2" role="group" aria-labelledby="minutes-label">
            {[20, 30, 60].map(m => (
              <button
                key={m}
                onClick={() => onActionMinutesChange(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  actionMinutes === m ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-secondary-foreground'}`}
                aria-label={`${m}분 선택`}
                aria-pressed={actionMinutes === m}
              >
                {m}분
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="300"
              value={actionMinutes}
              onChange={e => onActionMinutesChange(Number(e.target.value))}
              placeholder="직접 입력"
              className="flex-1 h-10 rounded-xl border border-input bg-white/80 px-3 text-sm text-center text-amber-900 placeholder:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            <span className="text-sm font-semibold text-muted-foreground">분</span>
          </div>
        </>
      )}
    </div>
  );
}