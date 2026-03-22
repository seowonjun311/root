import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, Star, Footprints, Swords } from 'lucide-react';

const categoryMeta = {
  exercise: {
    label: '운동 퀘스트 완료',
    sub: '몸이 앞으로 나아갑니다.',
    icon: Footprints,
  },
  study: {
    label: '공부 퀘스트 완료',
    sub: '지식이 쌓이고 있습니다.',
    icon: Sparkles,
  },
  mental: {
    label: '정신 퀘스트 완료',
    sub: '의지가 더 단단해졌어요.',
    icon: Star,
  },
  daily: {
    label: '일상 퀘스트 완료',
    sub: '생활 루트가 정리되고 있어요.',
    icon: Swords,
  },
};

export default function CompletionRewardOverlay({ reward, onDone }) {
  useEffect(() => {
    if (!reward) return;
    const timer = setTimeout(() => {
      onDone?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [reward, onDone]);

  if (!reward) return null;

  const meta = categoryMeta[reward.category] || categoryMeta.daily;
  const Icon = meta.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center px-6"
        style={{ background: 'rgba(20, 12, 4, 0.28)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="w-full max-w-sm rounded-3xl px-5 py-6 text-center"
          style={{
            background: 'linear-gradient(135deg, #fff5de 0%, #f6e7bf 58%, #f0deb0 100%)',
            border: '1.5px solid #d8b978',
            boxShadow: '0 12px 30px rgba(84, 55, 14, 0.22)',
          }}
        >
          <motion.div
            initial={{ scale: 0.7, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.05, type: 'spring', stiffness: 260, damping: 14 }}
            className="mx-auto mb-3 w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(139, 90, 32, 0.10)',
              color: '#7a5020',
            }}
          >
            <Icon className="w-7 h-7" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-sm font-bold mb-1"
            style={{ color: '#8a5a17' }}
          >
            {meta.label}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="text-lg font-extrabold break-words"
            style={{ color: '#3d2408' }}
          >
            {reward.title}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.18 }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.52)',
              border: '1px solid rgba(139, 90, 32, 0.14)',
            }}
          >
            <Sparkles className="w-4 h-4" style={{ color: '#c98a2b' }} />
            <span className="text-base font-extrabold" style={{ color: '#7a5020' }}>
              +{reward.exp} EXP
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.26 }}
            className="mt-3 text-sm"
            style={{ color: '#8f6a33' }}
          >
            {reward.message || meta.sub}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
