import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function BossVictoryModal({ goal, badge, onClose, onNewGoal }) {
  const [phase, setPhase] = useState('battle'); // battle -> victory

  useEffect(() => {
    const t = setTimeout(() => {
      setPhase('victory');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#d97706', '#f59e0b', '#fbbf24', '#fffbeb', '#92400e'],
      });
    }, 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <AnimatePresence mode="wait">
          {phase === 'battle' ? (
            /* ─── 마왕 등장 ─── */
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
                <p className="text-amber-100 font-bold text-lg">마왕이 나타났습니다!</p>
                <p className="text-amber-300/80 text-sm mt-1">{goal?.title}</p>
              </div>

              {/* Sword slash animation */}
              <motion.div
                className="text-5xl mt-8"
                initial={{ x: -60, opacity: 0, rotate: -45 }}
                animate={{ x: 60, opacity: [0, 1, 1, 0], rotate: 45 }}
                transition={{ delay: 1.2, duration: 0.7 }}
              >
                ⚔️
              </motion.div>
            </motion.div>
          ) : (
            /* ─── 승리 화면 ─── */
            <motion.div
              key="victory"
              className="w-full max-w-sm mx-4 bg-gradient-to-b from-amber-900 to-amber-800 rounded-3xl p-8 text-center border border-amber-600/50 shadow-2xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Banner */}
              <div className="bg-amber-700/80 rounded-xl px-4 py-2 mb-6 border border-amber-500/50">
                <p className="text-amber-200 font-bold text-lg tracking-wide">🏆 마왕 처치 성공</p>
              </div>

              {/* Fox hero */}
              <motion.div
                className="text-7xl mb-4"
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                🦊
              </motion.div>

              {/* Message */}
              <p className="text-amber-100 font-bold text-base mb-1">
                {goal?.duration_days || ''}일 동안 당신은 포기하지 않았습니다.
              </p>
              <p className="text-amber-300/80 text-sm mb-5">당신의 루트는 계속됩니다.</p>

              {/* Goal summary */}
              <div className="bg-amber-800/60 rounded-xl p-4 mb-5 text-sm text-left space-y-1">
                <p className="text-amber-200 font-semibold">🎯 {goal?.title}</p>
                <p className="text-amber-400/80">총 수련 기간 {goal?.duration_days || ''}일 완주</p>
              </div>

              {/* Badge */}
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
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 rounded-xl h-11 border-amber-600/50 text-amber-200 hover:bg-amber-700/50 bg-transparent"
                >
                  잠시 쉬기
                </Button>
                <Button
                  onClick={onNewGoal}
                  className="flex-1 rounded-xl h-11 bg-amber-500 hover:bg-amber-400 text-amber-900 font-bold"
                >
                  새 목표 만들기
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}