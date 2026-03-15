import React, { useState, useEffect, useRef } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Play, Square, Check } from 'lucide-react';

export default function ActionGoalCard({ actionGoal, weeklyLogs = [], onComplete }) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  const weeklyCount = weeklyLogs.length;
  const targetFreq = actionGoal.weekly_frequency || 7;
  const progressPercent = Math.min(100, Math.round((weeklyCount / targetFreq) * 100));

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleTimerToggle = () => {
    if (isRunning) {
      setIsRunning(false);
      const minutes = Math.round(elapsed / 60);
      if (minutes > 0 || elapsed > 30) {
        onComplete(actionGoal, Math.max(1, minutes));
      }
      setElapsed(0);
    } else {
      setIsRunning(true);
    }
  };

  const handleConfirm = () => {
    onComplete(actionGoal, actionGoal.duration_minutes || 0);
  };

  const typeEmoji = actionGoal.action_type === 'timer' ? '⏱️' : actionGoal.action_type === 'abstain' ? '🚫' : '✅';
  const typeLabel = actionGoal.action_type === 'timer'
    ? (actionGoal.duration_minutes ? `${actionGoal.duration_minutes}분` : '')
    : '';

  return (
    <div className="mx-4 p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base">{typeEmoji}</span>
          <span className="font-semibold text-sm text-foreground truncate">{actionGoal.title}</span>
          {typeLabel && <span className="text-xs text-muted-foreground">{typeLabel}</span>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            {weeklyCount}/{targetFreq}
          </span>

          {actionGoal.action_type === 'timer' ? (
            <Button
              size="sm"
              variant={isRunning ? 'destructive' : 'default'}
              className={`h-8 px-3 text-xs font-semibold rounded-xl ${
                isRunning
                  ? 'bg-red-500/90 hover:bg-red-600'
                  : 'bg-amber-700 hover:bg-amber-800 text-amber-50'
              }`}
              onClick={handleTimerToggle}
            >
              {isRunning ? (
                <>
                  <Square className="w-3 h-3 mr-1" />
                  {formatTime(elapsed)}
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  시작
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 px-3 text-xs font-semibold rounded-xl bg-amber-700 hover:bg-amber-800 text-amber-50"
              onClick={handleConfirm}
            >
              <Check className="w-3 h-3 mr-1" />
              {actionGoal.action_type === 'abstain' ? '성공' : '확인'}
            </Button>
          )}
        </div>
      </div>

      <Progress value={progressPercent} className="h-2 bg-secondary" />
    </div>
  );
}