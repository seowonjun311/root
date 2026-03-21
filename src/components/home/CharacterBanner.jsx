import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORY_THEME = {
  exercise: {
    sky: 'linear-gradient(180deg, #ffe9c7 0%, #f7d79a 45%, #e5bf76 100%)',
    road: 'linear-gradient(180deg, #9a6a35 0%, #7a4d20 100%)',
    castle: '#6b2d1a',
    glow: 'rgba(255, 170, 60, 0.35)',
  },
  study: {
    sky: 'linear-gradient(180deg, #efe6ff 0%, #d6c8ff 48%, #b9a4ff 100%)',
    road: 'linear-gradient(180deg, #7461a8 0%, #5d4a8c 100%)',
    castle: '#49346f',
    glow: 'rgba(145, 110, 255, 0.30)',
  },
  mental: {
    sky: 'linear-gradient(180deg, #dbf6ef 0%, #b8eadf 48%, #8ed6c5 100%)',
    road: 'linear-gradient(180deg, #4b8b7c 0%, #33695d 100%)',
    castle: '#274b43',
    glow: 'rgba(85, 201, 166, 0.28)',
  },
  daily: {
    sky: 'linear-gradient(180deg, #fff1da 0%, #f7ddaf 50%, #eac27d 100%)',
    road: 'linear-gradient(180deg, #92724a 0%, #765733 100%)',
    castle: '#5a4330',
    glow: 'rgba(235, 186, 90, 0.28)',
  },
};

function Castle({ color }) {
  return (
    <div className="relative w-20 h-20">
      <div
        className="absolute bottom-0 left-3 right-3 h-9 rounded-t-md"
        style={{ background: color }}
      />
      <div
        className="absolute bottom-7 left-1 w-5 h-8 rounded-t-md"
        style={{ background: color }}
      />
      <div
        className="absolute bottom-7 right-1 w-5 h-8 rounded-t-md"
        style={{ background: color }}
      />
      <div
        className="absolute bottom-11 left-7 right-7 h-8 rounded-t-md"
        style={{ background: color }}
      />
      <div
        className="absolute bottom-0 left-8 right-8 h-5 rounded-t-full"
        style={{ background: '#2f170d' }}
      />
      <div
        className="absolute bottom-14 left-9 w-2 h-2 rounded-full"
        style={{ background: '#ffd36b' }}
      />
    </div>
  );
}

function Hero() {
  return (
    <div className="relative w-12 h-12">
      <div className="absolute top-0 left-3.5 w-5 h-5 rounded-full bg-[#ffe0bd]" />
      <div className="absolute top-4 left-2 w-8 h-5 rounded-t-xl bg-[#6a4020]" />
      <div className="absolute top-7 left-2.5 w-3 h-4 rounded-b-lg bg-[#3c5aa8]" />
      <div className="absolute top-7 right-2.5 w-3 h-4 rounded-b-lg bg-[#3c5aa8]" />
      <div className="absolute top-5 -left-0.5 w-3 h-1.5 rounded-full bg-[#ffe0bd]" />
      <div className="absolute top-5 right-0 w-3 h-1.5 rounded-full bg-[#ffe0bd]" />
      <div className="absolute top-3 left-3 w-6 h-2 rounded-full bg-[#4b2a12]" />
    </div>
  );
}

export default function CharacterBanner({
  nickname = '용사님 · Lv.1',
  message = '오늘도 한 걸음 전진해볼까요?',
  activeCategory = 'exercise',
  moveTrigger = 0,
  expText = '+1 EXP',
}) {
  const [showReward, setShowReward] = useState(false);

  const theme = useMemo(
    () => CATEGORY_THEME[activeCategory] || CATEGORY_THEME.exercise,
    [activeCategory]
  );

  useEffect(() => {
    if (!moveTrigger) return;

    setShowReward(true);
    const timer = setTimeout(() => setShowReward(false), 1400);
    return () => clearTimeout(timer);
  }, [moveTrigger]);

  return (
    <div className="px-4 pt-4 pb-3">
      <div
        className="relative overflow-hidden rounded-[28px] px-4 pt-4 pb-5"
        style={{
          background: theme.sky,
          border: '1.5px solid rgba(100,60,20,0.14)',
          boxShadow: '0 10px 24px rgba(60,35,10,0.12)',
        }}
      >
        <div
          className="absolute -top-6 -right-8 w-28 h-28 rounded-full"
          style={{ background: theme.glow, filter: 'blur(6px)' }}
        />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{
                background: 'rgba(255,255,255,0.45)',
                color: '#6b4719',
                border: '1px solid rgba(107,71,25,0.10)',
              }}
            >
              {nickname}
            </div>

            <p
              className="mt-2 text-sm font-semibold leading-snug"
              style={{ color: '#5a3610' }}
            >
              {message}
            </p>
          </div>

          <div
            className="shrink-0 rounded-2xl px-3 py-2 text-center"
            style={{
              background: 'rgba(255,255,255,0.48)',
              border: '1px solid rgba(107,71,25,0.10)',
              minWidth: '78px',
            }}
          >
            <div className="text-[10px] font-semibold" style={{ color: '#8d6b3b' }}>
              현재 길
            </div>
            <div className="text-sm font-extrabold" style={{ color: '#6b4719' }}>
              전진 중
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-5 h-32">
          <div className="absolute inset-x-0 top-1 flex justify-end pr-2">
            <motion.div
              animate={{
                y: [0, -2, 0],
                scale: [1, 1.03, 1],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Castle color={theme.castle} />
            </motion.div>
          </div>

          <div className="absolute left-0 right-0 bottom-0 h-16">
            <div
              className="absolute left-[6%] right-[12%] bottom-0 h-14 rounded-[999px]"
              style={{
                background: theme.road,
                clipPath:
                  'polygon(0% 100%, 16% 60%, 28% 52%, 48% 42%, 66% 28%, 100% 0%, 100% 100%)',
                opacity: 0.95,
              }}
            />
          </div>

          <motion.div
            key={moveTrigger}
            className="absolute left-[14%] bottom-4 z-20"
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={
              moveTrigger
                ? {
                    x: [0, 10, 22, 18],
                    y: [0, -2, -5, 0],
                    scale: [1, 1.04, 1.07, 1],
                  }
                : { x: 0, y: [0, -2, 0], scale: 1 }
            }
            transition={
              moveTrigger
                ? { duration: 0.9, ease: 'easeOut' }
                : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            <Hero />
          </motion.div>

          <AnimatePresence>
            {showReward && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: -12, scale: 1 }}
                exit={{ opacity: 0, y: -22, scale: 0.95 }}
                transition={{ duration: 0.6 }}
                className="absolute left-[21%] bottom-14 z-30"
              >
                <div
                  className="rounded-full px-3 py-1 text-xs font-extrabold"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    color: '#8b5a20',
                    border: '1px solid rgba(139,90,32,0.15)',
                    boxShadow: '0 6px 18px rgba(80,50,10,0.12)',
                  }}
                >
                  {expText}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-1 left-[12%] right-[16%]">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'rgba(80,45,12,0.14)' }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: '18%' }}
                animate={moveTrigger ? { width: ['18%', '26%', '33%'] } : { width: '18%' }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{
                  background: 'linear-gradient(90deg, #8b5a20 0%, #d69a2d 50%, #f1c65e 100%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
