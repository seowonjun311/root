import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getGrade, GRADES } from '../components/badgeUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { usePullToRefreshTabbed } from '../hooks/usePullToRefreshTabbed';
import { RefreshCw } from 'lucide-react';

const CAT_LABELS = { exercise: '운동', study: '공부', mental: '정신', daily: '일상', special: '특별' };
const FILTERS = ['all', 'exercise', 'study', 'mental', 'daily'];

export default function Badges() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();

  const { pullProgress, onTouchStart: handlePullStart } = usePullToRefreshTabbed(async () => {
    await queryClient.invalidateQueries({ queryKey: ['badges'] });
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.Badge.list('-earned_date', 100),
  });

  const filtered = filter === 'all' ? badges : badges.filter(b => b.category === filter);

  return (
    <div className="min-h-screen bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="p-6 pb-3">
        <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
          🏆 명예의 전당
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          획득한 칭호 {badges.length}개
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-4 pb-3">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === f ? 'bg-amber-700 text-amber-50' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {f === 'all' ? '전체' : CAT_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4">
        {filtered.length === 0 ? (
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
            {filtered.map((badge, i) => (
              <BadgeCard key={badge.id} badge={badge} index={i} onClick={() => setSelected(badge)} />
            ))}
          </div>
        )}
      </div>

      {/* Detail dialog */}
      {selected && (
        <BadgeDetailDialog badge={selected} open={!!selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function BadgeCard({ badge, index, onClick }) {
  const grade = getGrade(badge.streak || 0);
  const typeLabel = badge.badge_type === 'result' ? '완주' : badge.badge_type === 'cumulative' ? '연속' : '이벤트';

  return (
    <motion.button
      onClick={onClick}
      className={`p-4 rounded-2xl bg-card border ${grade.border} shadow-sm text-center hover:shadow-md transition-shadow`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      aria-label={`View badge: ${badge.title}`}
    >
      <div className={`w-14 h-14 mx-auto mb-2 rounded-full ${grade.bg} flex items-center justify-center text-2xl`}>
        {grade.emoji}
      </div>
      <p className="font-bold text-sm text-amber-900 leading-tight">{badge.title}</p>

      {/* Grade pill */}
      <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${grade.bg} ${grade.color}`}>
        {grade.emoji} {grade.label}
      </span>

      {/* Type tag */}
      <div className="flex items-center justify-center gap-1 mt-1.5">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
          {typeLabel}
        </span>
        {badge.streak > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">
            🔥{badge.streak}일
          </span>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/60 mt-2">{badge.earned_date}</p>
    </motion.button>
  );
}

function BadgeDetailDialog({ badge, open, onClose }) {
  const grade = getGrade(badge.streak || 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden">
        {/* Header */}
        <div className={`${grade.bg} px-6 pt-8 pb-6 text-center`}>
          <motion.div
            className="text-6xl mb-3"
            animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
          >
            {grade.emoji}
          </motion.div>
          <h2 className={`text-xl font-bold ${grade.color}`}>{badge.title}</h2>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${grade.border} border ${grade.color}`}>
            {grade.label} 등급
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3">
          <p className="text-sm text-muted-foreground text-center">{badge.description}</p>

          <div className="bg-secondary/60 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">획득일</span>
              <span className="font-semibold">{badge.earned_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">카테고리</span>
              <span className="font-semibold">{CAT_LABELS[badge.category] || '기타'}</span>
            </div>
            {badge.streak > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">연속 기록</span>
                <span className="font-semibold text-amber-700">🔥 {badge.streak}일</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">유형</span>
              <span className="font-semibold">
                {badge.badge_type === 'result' ? '목표 완주' : badge.badge_type === 'cumulative' ? '연속 달성' : '이벤트'}
              </span>
            </div>
          </div>

          {/* Grade explanation */}
          <div className="pt-2">
            <p className="text-xs text-muted-foreground mb-2 font-semibold">등급 기준</p>
            <div className="flex flex-wrap gap-1.5">
              {GRADES.map(g => (
                <span
                  key={g.id}
                  className={`text-[10px] px-2 py-1 rounded-full border font-semibold
                    ${grade.id === g.id ? `${g.bg} ${g.color} ${g.border}` : 'bg-secondary/40 text-muted-foreground/50 border-transparent'}`}
                >
                  {g.emoji} {g.label} {g.minStreak > 0 ? `${g.minStreak}일+` : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}