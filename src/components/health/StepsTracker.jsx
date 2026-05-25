import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Footprints, Star } from 'lucide-react';
import { format } from 'date-fns';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const STEP_MILESTONES = [
  { steps: 3000, label: '3천 걸음', emoji: '🚶', points: 5 },
  { steps: 5000, label: '5천 걸음', emoji: '🏃', points: 10 },
  { steps: 8000, label: '8천 걸음', emoji: '🏃‍♂️', points: 18 },
  { steps: 10000, label: '1만 걸음', emoji: '⚡', points: 25 },
];

function getStepPoints(steps) {
  let pts = 0;
  for (const m of STEP_MILESTONES) {
    if (steps >= m.steps) pts = m.points;
  }
  return pts;
}

export default function StepsTracker({ userEmail }) {
  const qc = useQueryClient();
  const [stepsInput, setStepsInput] = useState('');

  const { data: logs = [] } = useQuery({
    queryKey: ['stepsLogs', TODAY],
    queryFn: () => base44.entities.HealthStepsLog.filter({ log_date: TODAY }),
  });

  const todayLog = logs[0];
  const todaySteps = todayLog?.steps || 0;
  const earnedPoints = getStepPoints(todaySteps);

  const saveMutation = useMutation({
    mutationFn: (steps) => {
      if (todayLog?.id) {
        return base44.entities.HealthStepsLog.update(todayLog.id, { steps });
      }
      return base44.entities.HealthStepsLog.create({ user_email: userEmail, steps, log_date: TODAY });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['stepsLogs', TODAY] });
      setStepsInput('');
    },
  });

  const handleSave = () => {
    const val = parseInt(stepsInput);
    if (!val || val < 0) return;
    saveMutation.mutate(val);
  };

  // 걸음 진행 바 (0~10000)
  const progressPct = Math.min(100, (todaySteps / 10000) * 100);
  const reachedMilestones = STEP_MILESTONES.filter(m => todaySteps >= m.steps);

  return (
    <div className="space-y-3">
      {/* 오늘 걸음수 */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-foreground">{todaySteps.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground">걸음</span>
        </div>
        {earnedPoints > 0 && (
          <div className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 rounded-full px-2.5 py-1">
            <Star className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">+{earnedPoints}pt</span>
          </div>
        )}
      </div>

      {/* 진행 바 */}
      <div className="px-2">
        <div className="w-full h-3 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progressPct}%`,
              background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%)',
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">0</span>
          <span className="text-[10px] text-muted-foreground">10,000</span>
        </div>
      </div>

      {/* 달성 마일스톤 */}
      {reachedMilestones.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-2">
          {reachedMilestones.map(m => (
            <span key={m.steps} className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-semibold">
              {m.emoji} {m.label}
            </span>
          ))}
        </div>
      )}

      {/* 마을 연동 안내 */}
      {todaySteps >= 5000 && (
        <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2">
          <span className="text-base">🏘️</span>
          <span className="text-xs text-green-700 dark:text-green-300 font-semibold">
            {todaySteps >= 10000 ? '마을 활기가 최고조에 달했어요!' : '마을에 활기가 넘쳐요!'}
          </span>
        </div>
      )}

      {/* 입력 */}
      <div className="flex gap-2 px-2">
        <input
          type="number"
          inputMode="numeric"
          value={stepsInput}
          onChange={e => setStepsInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          placeholder="걸음수 입력"
          className="flex-1 p-2.5 rounded-xl border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleSave}
          disabled={!stepsInput || saveMutation.isPending}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-40"
        >
          기록
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center px-2">
        📱 추후 Apple Health · Samsung Health 연동 예정
      </p>
    </div>
  );
}