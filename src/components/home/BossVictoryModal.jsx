import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import confetti from 'canvas-confetti';
import { base44 } from '@/api/base44Client';
import { getBadgeForGoal } from '../badgeUtils';
import { useQueryClient } from '@tanstack/react-query';

// phase: 'battle' → 'confirm' → 'result_input' → 'victory' | 'consolation'

export default function BossVictoryModal({ goal, badge, onClose, onNewGoal }) {
  const [phase, setPhase] = useState('battle');
  const [resultNote, setResultNote] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setPhase('confirm'), 2200);
    return () => clearTimeout(t);
  }, []);

  const fireConfetti = () => {
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 }, colors: ['#d97706', '#f59e0b', '#fbbf24', '#fffbeb', '#92400e'] });
    setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.2, y: 0.6 } }), 300);
    setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { x: 0.8, y: 0.6 } }), 500);
  };

  const handleAchieved = () => setPhase('result_input');

  const isTest = goal?.id === 'test-id';

  const handleNotAchieved = async () => {
    setSaving(true);
    if (!isTest) {
      await base44.entities.Goal.update(goal.id, {
        status: 'failed',
        achievement_confirmed: true,
        achievement_success: false,
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
    setSaving(false);
    setPhase('consolation');
  };

  const handleResultSubmit = async () => {
    setSaving(true);
    if (!isTest) {
      await base44.entities.Goal.update(goal.id, {
        status: 'completed',
        achievement_confirmed: true,
        achievement_success: true,
        result_note: resultNote || '',
      });
      // 칭호(Badge) 저장
      const { title, description } = getBadgeForGoal(goal);
      await base44.entities.Badge.create({
        title,
        description: resultNote ? `${description} - "${resultNote}"` : description,
        category: goal.category,
        badge_type: 'result',
        earned_date: new Date().toISOString().split('T')[0],
        goal_id: goal.id,
      });
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
    setSaving(false);
    fireConfetti();
    setPhase('victory');
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AnimatePresence mode="wait">

          {/* ── 마왕 등장 ── */}
          {phase === 'battle' && (
            <motion.div
              key="battle"
              className="flex flex-col items-center text-center px-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="text-8xl mb-4"
                animate={{ scale: [1, 1.1, 1], rotate: [-3, 3, -3, 3, 0] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              >
                👹
              </motion.div>
              <div className="bg-amber-900/80 rounded-2xl px-6 py-4 border border-amber-600/50">
                <p className="text-amber-100 font-bold text-lg">도전 기간이 끝났습니다!</p>
                <p className="text-amber-300/80 text-sm mt-1">{goal?.title}</p>
              </div>
              <motion.div
                className="text-5xl mt-8"
                initial={{ x: -60, opacity: 0, rotate: -45 }}
                animate={{ x: 60, opacity: [0, 1, 1, 0], rotate: 45 }}
                transition={{ delay: 1.2, duration: 0.7 }}
              >
                ⚔️
              </motion.div>
            </motion.div>
          )}

          {/* ── 달성 여부 확인 ── */}
          {phase === 'confirm' && (
            <motion.div
              key="confirm"
              className="w-full max-w-sm mx-4 bg-gradient-to-b from-amber-900 to-amber-800 rounded-3xl p-8 text-center border border-amber-600/50 shadow-2xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div className="text-6xl mb-4" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                🦊
              </motion.div>
              <p className="text-amber-100 font-bold text-lg mb-1">{goal?.duration_days}일의 여정이 끝났어요!</p>
              <p className="text-amber-300/80 text-sm mb-6">목표를 달성하셨나요?</p>

              <div className="bg-amber-800/60 rounded-xl px-4 py-3 mb-6 text-sm text-amber-200 font-semibold">
                🎯 {goal?.title}
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleNotAchieved}
                  disabled={saving}
                  variant="outline"
                  className="flex-1 rounded-xl h-12 border-amber-600/50 text-amber-300 hover:bg-amber-700/50 bg-transparent font-semibold"
                >
                  😔 아쉽지만 아니요
                </Button>
                <Button
                  onClick={handleAchieved}
                  className="flex-1 rounded-xl h-12 bg-amber-500 hover:bg-amber-400 text-amber-900 font-bold"
                >
                  🏆 달성했어요!
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── 결과 입력 ── */}
          {phase === 'result_input' && (
            <motion.div
              key="result_input"
              className="w-full max-w-sm mx-4 bg-gradient-to-b from-amber-900 to-amber-800 rounded-3xl p-8 text-center border border-amber-600/50 shadow-2xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-5xl mb-4">🏅</div>
              <p className="text-amber-100 font-bold text-lg mb-1">대단해요, 용사님!</p>
              <p className="text-amber-300/80 text-sm mb-6">결과를 기록해 두세요</p>

              <div className="text-left mb-4">
                <label className="text-xs font-semibold text-amber-400 mb-2 block">결과 한 줄 메모 (선택)</label>
                <Input
                  value={resultNote}
                  onChange={e => setResultNote(e.target.value)}
                  placeholder={goal?.category === 'study' ? '예: 토익 895점 받았어요!' : '예: 목표 체중 도달!'}
                  className="h-12 rounded-xl bg-amber-800/60 border-amber-600/50 text-amber-100 placeholder:text-amber-500/60"
                />
              </div>

              <Button
                onClick={handleResultSubmit}
                disabled={saving}
                className="w-full rounded-xl h-12 bg-amber-500 hover:bg-amber-400 text-amber-900 font-bold"
              >
                {saving ? '저장 중...' : '🎉 완료 처리하기'}
              </Button>
              <button
                onClick={handleResultSubmit}
                disabled={saving}
                className="mt-3 text-xs text-amber-500/70 underline"
              >
                건너뛰기
              </button>
            </motion.div>
          )}

          {/* ── 달성 축하 ── */}
          {phase === 'victory' && (
            <motion.div
              key="victory"
              className="w-full max-w-sm mx-4 bg-gradient-to-b from-amber-900 to-amber-800 rounded-3xl p-8 text-center border border-amber-600/50 shadow-2xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-amber-700/80 rounded-xl px-4 py-2 mb-6 border border-amber-500/50">
                <p className="text-amber-200 font-bold text-lg tracking-wide">🏆 마왕 처치 성공!</p>
              </div>
              <motion.div className="text-7xl mb-4" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                🦊
              </motion.div>
              <p className="text-amber-100 font-bold text-base mb-1">{goal?.duration_days}일 동안 당신은 포기하지 않았습니다.</p>
              <p className="text-amber-300/80 text-sm mb-5">당신의 루트는 계속됩니다.</p>

              {resultNote && (
                <div className="bg-amber-600/30 rounded-xl p-3 mb-4 border border-amber-500/40">
                  <p className="text-amber-200 text-xs mb-1">나의 결과</p>
                  <p className="text-amber-100 font-semibold text-sm">"{resultNote}"</p>
                </div>
              )}

              {badge && (
                <motion.div
                  className="bg-amber-600/40 rounded-xl p-3 mb-6 border border-amber-500/50"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  <p className="text-amber-200 text-xs mb-1">칭호 획득!</p>
                  <p className="text-amber-100 font-bold">🏅 {badge}</p>
                </motion.div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-11 border-amber-600/50 text-amber-200 hover:bg-amber-700/50 bg-transparent">
                  잠시 쉬기
                </Button>
                <Button onClick={onNewGoal} className="flex-1 rounded-xl h-11 bg-amber-500 hover:bg-amber-400 text-amber-900 font-bold">
                  새 목표 만들기
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── 미달성 위로 ── */}
          {phase === 'consolation' && (
            <motion.div
              key="consolation"
              className="w-full max-w-sm mx-4 bg-gradient-to-b from-slate-800 to-slate-700 rounded-3xl p-8 text-center border border-slate-600/50 shadow-2xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div className="text-7xl mb-4" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
                🦊
              </motion.div>
              <p className="text-slate-100 font-bold text-lg mb-1">괜찮아요, 용사님</p>
              <p className="text-slate-300/80 text-sm mb-5">
                {goal?.duration_days}일을 버텨낸 것만으로도<br />
                당신은 이미 성장했습니다.
              </p>

              <div className="bg-slate-600/40 rounded-xl p-4 mb-6 text-sm text-slate-300 italic">
                "실패는 성공의 어머니다. 다시 도전하라." 🗡️
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-11 border-slate-500/50 text-slate-300 hover:bg-slate-600/50 bg-transparent">
                  나중에 하기
                </Button>
                <Button onClick={onNewGoal} className="flex-1 rounded-xl h-11 bg-amber-500 hover:bg-amber-400 text-amber-900 font-bold">
                  다시 도전! 🔥
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}