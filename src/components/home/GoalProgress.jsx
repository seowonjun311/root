import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Pencil } from 'lucide-react';

export default function GoalProgress({ goal }) {
  if (!goal) return null;

  const startDate = new Date(goal.start_date || goal.created_date);
  const totalDays = goal.duration_days || 90;
  const elapsedDays = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const progressPercent = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  return (
    <div className="mx-4 p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚔️</span>
          <span className="text-sm font-semibold text-foreground">{goal.title}</span>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      
      <div className="flex items-center gap-3">
        <Progress value={progressPercent} className="flex-1 h-2.5 bg-secondary" />
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {elapsedDays}/{totalDays}일
        </span>
      </div>
      
      {goal.target_value && (
        <p className="text-xs text-muted-foreground mt-2">
          {totalDays}일 동안 {goal.target_value}{goal.target_unit || ''} 목표
        </p>
      )}
    </div>
  );
}