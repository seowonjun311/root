import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

// trigger: 'weekly_complete' | 'streak_7' | 'streak_30' | 'streak_100'
const MESSAGES = {
  weekly_complete: { emoji: '🎉', title: '이번 주 목표 완주!', sub: '용사님, 이번 주도 해냈습니다.' },
  streak_7:  { emoji: '🔥', title: '7일 연속 성공!', sub: '일주일을 꾸준히 이어왔어요.' },
  streak_30: { emoji: '⚡', title: '30일 연속 성공!', sub: '한 달의 수련이 쌓였습니다.' },
  streak_100:{ emoji: '👑', title: '100일 연속 성공!', sub: '당신은 진정한 용사입니다.' },
};

export default function CelebrationToast({ trigger, onDone }) {
  const config = MESSAGES[trigger] || MESSAGES.weekly_complete;

  useEffect(() => {
    // Light confetti burst
    confetti({
      particleCount: trigger === 'streak_100' ? 200 : trigger === 'streak_30' ? 150 : 80,
      spread: 70,
      origin: { y: 0.4 },
      colors: ['#d97706', '#f59e0b', '#fbbf24', '#fff7ed', '#92400e'],
      scalar: 1.1,
    });
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed top-6 left-0 right-0 mx-auto z-50 px-4 max-w-md"
        initial={{ y: -80, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -80, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      >
        <div className="bg-gradient-to-r from-amber-800 to-amber-600 rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4 border border-amber-400/40">
          <motion.span
            className="text-4xl flex-shrink-0"
            animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {config.emoji}
          </motion.span>
          <div>
            <p className="font-bold text-amber-50 text-base leading-tight">{config.title}</p>
            <p className="text-amber-200/80 text-xs mt-0.5">{config.sub}</p>
          </div>
          {/* shimmer bar */}
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-amber-300/60 rounded-b-2xl"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 3, ease: 'linear' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}