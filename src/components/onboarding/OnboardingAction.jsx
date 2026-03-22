import React from 'react';
import { Input } from '@/components/ui/input';

const ACTION_TYPE_OPTIONS = [
  { value: 'timer', label: '⏱️ 시간형', desc: '얼마나 했는지 시간을 기록해요' },
  { value: 'confirm', label: '✅ 확인형', desc: '완료했는지만 간단히 체크해요' },
  { value: 'abstain', label: '🚫 안하기형', desc: '하지 않으면 성공으로 기록해요' },
];

const ACTION_MODE_OPTIONS = [
  { value: 'routine', label: '🔁 루틴형', desc: '반복해서 쌓는 행동이에요' },
  { value: 'single', label: '🎯 단발형', desc: '정해진 날짜에 한 번 해내는 목표예요' },
];

const getToday = () => new Date().toISOString().split('T')[0];

const getPlaceholder = (category, actionMode) => {
  if (actionMode === 'single') {
    if (category === 'daily') return '예: 방 청소하기, 서류 제출하기, 병원 가기';
    if (category === 'mental') return '예: 상담 예약하기, 디지털 디톡스 하루 하기';
    if (category === 'study') return '예: 모의고사 보기, 과제 제출하기, 시험 접수하기';
    if (category === 'exercise') return '예: 등산 가기, 헬스 OT 받기, 체력측정 하기';
    return '예: 한 번에 끝낼 행동을 입력하세요';
  }

  if (category === 'daily') return '예: 팩하기, 집청소, 빨래, 부모님 연락';
  if (category === 'mental') return '예: 7시 기상, 일기쓰기, 금연, 명상';
  if (category === 'study') return '예: 독해, 듣기, 회화, 전공서, 수학';
  if (category === 'exercise') return '예: 러닝, 등산, 헬스, 야식참기';
  return '예: 러닝, LC 공부, 명상';
};

export default function OnboardingAction({
  category,
  actionMode,
  onActionModeChange,
  actionTitle,
  onActionTitleChange,
  scheduledDate,
  onScheduledDateChange,
  actionType,
  onActionTypeChange,
  frequency,
  onFrequencyChange,
  actionMinutes,
  onActionMinutesChange,
}) {
  return (
    <div className="px-6 pb-24">
      <h2 className="text-lg font-bold text-center text-amber-900 mb-1">
        행동 목표를 정해볼까요?
      </h2>
      <p className="text-xs text-muted-foreground text-center mb-5">
        루틴형은 반복 행동, 단발형은 특정 날짜의 1회 행동이에요
      </p>

      <p className="text-xs font-semibold text-amber-800 mb-2">행동 방식</p>
      <div className="space-y-2 mb-4 relative z-10">
        {ACTION_MODE_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt.value}
            onClick={() => onActionModeChange(opt.value)}
            className={`w-full p-3 rounded-xl border text-left transition-all ${
              actionMode === opt.value
                ? 'border-amber-600 bg-amber-50/80'
                : 'border-border bg-card hover:border-amber-300'
            }`}
            aria-pressed={actionMode === opt.value}
          >
            <p className="text-sm font-semibold">{opt.label}</p>
            <p className="text-xs text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <p className="text-xs font-semibold text-amber-800 mb-2">
          {actionMode === 'single' ? '1회 행동' : '행동 목표'}
        </p>
        <Input
          value={actionTitle}
          onChange={onActionTitleChange}
          placeholder={getPlaceholder(category, actionMode)}
          className="h-11 rounded-xl text-center text-sm border-amber-300 bg-white/80 text-amber-900 placeholder:text-amber-300"
        />
      </div>

      {actionMode === 'routine' ? (
        <>
          <p className="text-xs font-semibold text-amber-800 mb-2">주 횟수</p>
          <div className="grid grid-cols-7 gap-1.5 mb-4 relative z-10">
            {[1, 2, 3, 4, 5, 6, 7].map((f) => (
              <button
                type="button"
                key={f}
                onClick={() => onFrequencyChange(f)}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  frequency === f
                    ? 'bg-amber-700 text-amber-50'
                    : 'bg-secondary text-secondary-foreground'
                }`}
                aria-pressed={frequency === f}
              >
                {f}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mb-4">주 {frequency}회</p>
        </>
      ) : (
        <div className="mb-4">
          <label className="text-xs font-semibold text-amber-800 mb-2 block">날짜 선택</label>
          <input
            type="date"
            min={getToday()}
            value={scheduledDate}
            onChange={onScheduledDateChange}
            className="w-full h-12 rounded-xl border border-input bg-white/80 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          />
          <p className="text-xs text-muted-foreground mt-2">
            오늘 이후 날짜만 선택할 수 있어요
          </p>
        </div>
      )}

      <p className="text-xs font-semibold text-amber-800 mb-2">기록 방식</p>
      <div className="space-y-2 mb-4 relative z-10">
        {ACTION_TYPE_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt.value}
            onClick={() => onActionTypeChange(opt.value)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
              actionType === opt.value
                ? 'border-amber-600 bg-amber-50/80'
                : 'border-border bg-card hover:border-amber-300'
            }`}
            aria-pressed={actionType === opt.value}
          >
            <div>
              <p className="text-sm font-semibold">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {actionType === 'timer' && (
        <>
          <p className="text-xs font-semibold text-amber-800 mb-2">1회 시간</p>
          <div className="flex gap-2 mb-2 relative z-10">
            {[20, 30, 60].map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => onActionMinutesChange(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  actionMinutes === m
                    ? 'bg-amber-700 text-amber-50'
                    : 'bg-secondary text-secondary-foreground'
                }`}
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
              onChange={(e) => onActionMinutesChange(Number(e.target.value))}
              className="flex-1 h-10 rounded-xl border border-input bg-white/80 px-3 text-sm text-center text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            />
            <span className="text-sm font-semibold text-muted-foreground">분</span>
          </div>
        </>
      )}
    </div>
  );
}
