import React, { useMemo } from 'react';
import { CalendarDays, Flag, Target } from 'lucide-react';

const CATEGORY_LABELS = {
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

function formatDate(dateString) {
  if (!dateString) return '-';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';

  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function getGoalDateInfo(goal) {
  if (!goal?.start_date || !goal?.duration_days) {
    return {
      startDate: null,
      endDate: null,
      totalDays: 0,
      elapsedDays: 0,
      remainingDays: null,
      percent: 0,
      isComplete: false,
    };
  }

  const startDate = new Date(goal.start_date);
  if (Number.isNaN(startDate.getTime())) {
    return {
      startDate: null,
      endDate: null,
      totalDays: 0,
      elapsedDays: 0,
      remainingDays: null,
      percent: 0,
      isComplete: false,
    };
  }

  const totalDays = Number(goal.duration_days || 0);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + totalDays);

  const now = new Date();
  const elapsedMs = now.getTime() - startDate.getTime();
  const elapsedDays = Math.max(0, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)));
  const remainingMs = endDate.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
  const isComplete = now >= endDate;

  const percent =
    totalDays > 0 ? Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100))) : 0;

  return {
    startDate,
    endDate,
    totalDays,
    elapsedDays,
    remainingDays,
    percent: isComplete ? 100 : percent,
    isComplete,
  };
}

function getLogProgress(logs = [], goal) {
  if (!goal) {
    return {
      doneCount: 0,
      logPercent: 0,
    };
  }

  const doneCount = logs.filter((log) => log?.completed).length;

  if (!goal?.duration_days || goal.duration_days <= 0) {
    return {
      doneCount,
      logPercent: 0,
    };
  }

  const roughPercent = Math.min(100, Math.round((doneCount / goal.duration_days) * 100));

  return {
    doneCount,
    logPercent: roughPercent,
  };
}

export default function GoalProgress({ goal, logs = [] }) {
  const dateInfo = useMemo(() => getGoalDateInfo(goal), [goal]);
  const logInfo = useMemo(() => getLogProgress(logs, goal), [logs, goal]);

  if (!goal) return null;

  const categoryLabel = CATEGORY_LABELS[goal.category] || '목표';
  const title = goal.title || goal.goal_title || '결과 목표';
  const displayPercent = Math.max(dateInfo.percent, logInfo.logPercent);

  return (
    <div
      className="rounded-3xl px-4 py-4"
      style={{
        background: 'linear-gradient(135deg, #fff5de 0%, #f6e7bf 58%, #f0deb0 100%)',
        border: '1.5px solid #d8b978',
        boxShadow: '0 6px 16px rgba(84, 55, 14, 0.12)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-7 px-2.5 rounded-full text-[11px] font-bold flex items-center"
              style={{
                background: 'rgba(139, 90, 32, 0.12)',
                color: '#7a5020',
                border: '1px solid rgba(139, 90, 32, 0.15)',
              }}
            >
              <Flag className="w-3.5 h-3.5 mr-1" />
              결과목표
            </div>

            <div
              className="h-7 px-2.5 rounded-full text-[11px] font-bold flex items-center"
              style={{
                background: 'rgba(210, 155, 56, 0.16)',
                color: '#8a5a17',
                border: '1px solid rgba(210, 155, 56, 0.18)',
              }}
            >
              {categoryLabel}
            </div>
          </div>

          <h2
            className="text-[17px] leading-snug font-bold break-words"
            style={{ color: '#3d2408' }}
          >
            {title}
          </h2>
        </div>

        <div
          className="shrink-0 rounded-2xl px-3 py-2 text-center min-w-[72px]"
          style={{
            background: 'rgba(255,255,255,0.52)',
            border: '1px solid rgba(139, 90, 32, 0.14)',
          }}
        >
          <div className="text-[10px] font-semibold mb-0.5" style={{ color: '#9a7b47' }}>
            진행률
          </div>
          <div className="text-base font-extrabold" style={{ color: '#7a5020' }}>
            {displayPercent}%
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ background: 'rgba(122, 80, 32, 0.14)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${displayPercent}%`,
              background: 'linear-gradient(90deg, #8b5a20 0%, #cb8d2a 55%, #e7bb55 100%)',
            }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <div
          className="rounded-2xl px-3 py-3 flex items-center gap-3"
          style={{
            background: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(139, 90, 32, 0.12)',
          }}
        >
          <CalendarDays className="w-4 h-4 shrink-0" style={{ color: '#8b5a20' }} />
          <div className="min-w-0">
            <div className="text-[11px] font-semibold" style={{ color: '#9a7b47' }}>
              도전 기간
            </div>
            <div className="text-sm font-bold" style={{ color: '#4d2f0f' }}>
              {formatDate(goal.start_date)} ~ {formatDate(dateInfo.endDate)}
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl px-3 py-3 flex items-center gap-3"
          style={{
            background: 'rgba(255,255,255,0.45)',
            border: '1px solid rgba(139, 90, 32, 0.12)',
          }}
        >
          <Target className="w-4 h-4 shrink-0" style={{ color: '#8b5a20' }} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold" style={{ color: '#9a7b47' }}>
              현재 상태
            </div>

            {dateInfo.isComplete ? (
              <div className="text-sm font-bold" style={{ color: '#4d2f0f' }}>
                도전 기간이 종료되었어요
              </div>
            ) : (
              <div className="text-sm font-bold" style={{ color: '#4d2f0f' }}>
                {dateInfo.remainingDays}일 남음 · {logInfo.doneCount}회 기록
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
