import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const CAT_LABELS = { exercise: '운동', study: '공부', mental: '정신', daily: '일상', special: '특별' };

export default function Badges() {
  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list('-earned_date', 100),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 pb-3">
        <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
          🏆 명예의 전당
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          획득한 칭호 {badges.length}개
        </p>
      </div>

      <div className="px-4 pb-4">
        {badges.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-secondary/80 flex items-center justify-center text-4xl">
              🦊
            </div>
            <p className="font-semibold text-foreground">아직 획득한 칭호가 없습니다</p>
            <p className="text-sm text-muted-foreground mt-2">
              목표를 달성하면 칭호가 수여됩니다.<br />
              용사님의 첫 번째 칭호를 기다리고 있어요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {badges.map(badge => (
              <div
                key={badge.id}
                className="p-4 rounded-2xl bg-card border border-amber-300/50 shadow-sm text-center"
              >
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-amber-100 flex items-center justify-center text-2xl">
                  🏅
                </div>
                <p className="font-bold text-sm text-amber-900">{badge.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-2">{badge.earned_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}