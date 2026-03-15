import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function EmptyGoalState({ category, onCreateGoal }) {
  const categoryNames = {
    exercise: '운동',
    study: '공부',
    mental: '정신',
    daily: '일상',
  };

  return (
    <div className="mx-4 mt-6 p-8 rounded-2xl bg-card border border-dashed border-border/80 flex flex-col items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-secondary/80 flex items-center justify-center text-3xl">
        🦊
      </div>
      <div className="text-center">
        <p className="font-semibold text-foreground">아직 목표가 없습니다.</p>
        <p className="text-sm text-muted-foreground mt-1">어떤 목표를 세우시겠습니까?</p>
      </div>
      <Button
        onClick={onCreateGoal}
        className="bg-amber-700 hover:bg-amber-800 text-amber-50 rounded-xl px-6 font-semibold"
      >
        <Plus className="w-4 h-4 mr-2" />
        목표 만들기
      </Button>
    </div>
  );
}