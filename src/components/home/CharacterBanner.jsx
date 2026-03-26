import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { characterImg, pathImg, castleImg } from '../../assets/root/index.js';

const CATEGORY_THEME = {
  exercise: {
    sky: 'linear-gradient(180deg, #ffe9c7 0%, #f7d79a 45%, #e5bf76 100%)',
    glow: 'rgba(255, 170, 60, 0.25)',
    badgeBg: 'rgba(255,255,255,0.55)',
    badgeText: '#6b4719',
    text: '#5a3610',
    subText: '#8d6b3b',
    progressBg: 'rgba(80,45,12,0.14)',
    progressFill:
      'linear-gradient(90deg, #8b5a20 0%, #d69a2d 50%, #f1c65e 100%)',
  },
  study: {
    sky: 'linear-gradient(180deg, #efe6ff 0%, #d6c8ff 48%, #b9a4ff 100%)',
    glow: 'rgba(145, 110, 255, 0.22)',
    badgeBg: 'rgba(255,255,255,0.55)',
    badgeText: '#5a3c91',
    text: '#4b3479',
    subText: '#7d66b3',
    progressBg: 'rgba(73,52,111,0.16)',
    progressFill:
      'linear-gradient(90deg, #6f5bb3 0%, #9b85f5 55%, #c8baff 100%)',
  },
  mental: {
    sky: 'linear-gradient(180deg, #dbf6ef 0%, #b8eadf 48%, #8ed6c5 100%)',
    glow: 'rgba(85, 201, 166, 0.20)',
    badgeBg: 'rgba(255,255,255,0.55)',
    badgeText: '#2f6257',
    text: '#254e46',
    subText: '#4c8578',
    progressBg: 'rgba(39,75,67,0.15)',
    progressFill:
      'linear-gradient(90deg, #2c6d60 0%, #49a68f 55%, #84d7c3 100%)',
  },
  daily: {
    sky: 'linear-gradient(180deg, #fff1da 0%, #f7ddaf 50%, #eac27d 100%)',
    glow: 'rgba(235, 186, 90, 0.18)',
    badgeBg: 'rgba(255,255,255,0.55)',
    badgeText: '#6d5332',
    text: '#5c4328',
    subText: '#8c6a41',
    progressBg: 'rgba(90,67,48,0.14)',
    progressFill:
      'linear-gradient(90deg, #8a6a43 0%, #c89a5d 55%, #efd08a 100%)',
  },
};

export default function CharacterBanner({
  nickname = '용사님 · Lv.1',
  title = '',
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
    <div className="px-4 pt-2 pb-2">
      <div
        className="relative overflow-hidden rounded-[24px] px-4 pt-3 pb-3"
        style={{
          background: theme.sky,
          border: '1.5px solid rgba(100,60,20,0.14)',
          boxShadow: '0 8px 18px rgba(60,35,10,0.10)',
        }}
      >
        <div
          className="absolute -top-6 -right-8 h-24 w-24 rounded-full"
          style={{ background: theme.glow, filter: 'blur(8px)' }}
        />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{
                background: theme.badgeBg,
                color: theme.badgeText,
                border: '1px solid rgba(107,71,25,0.10)',
              }}
            >
              {nickname}
            </div>

            {title ? (
              <div
                className="mt-2 inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                style={{
                  background: 'rgba(255,255,255,0.45)',
                  color: theme.badgeText,
                  border: '1px solid rgba(107,71,25,0.10)',
                }}
              >
                {title}
              </div>
            ) : null}

            <p
              className="mt-2 text-sm font-semibold leading-snug"
              style={{ color: theme.text }}
            >
              {message}
            </p>
          </div>

          <div
            className="shrink-0 rounded-2xl px-3 py-2 text-center"
            style={{
              background: 'rgba(255,255,255,0.48)',
              border: '1px solid rgba(107,71,25,0.10)',
              minWidth: '74px',
            }}
          >
            <div className="text-[10px] font-semibold" style={{ color: theme.subText }}>
              현재 길
            </div>
            <div className="text-sm font-extrabold" style={{ color: theme.badgeText }}>
              전진 중
            </div>
          </div>
        </div>

        <div className="relative z-10 mt-3 h-28 sm:h-32">
          <div className="absolute inset-0 overflow-hidden rounded-[20px]">
            <img
              src={pathImg}
              alt="루트 길"
              className="absolute inset-0 h-full w-full object-cover opacity-95"
              draggable={false}
            />
          </div>

          <div className="absolute inset-0 rounded-[20px] bg-white/5" />

          <div className="absolute right-[4%] top-[8%] z-20">
            <motion.img
              src={castleImg}
              alt="마왕성"
              className="h-[60px] w-auto sm:h-[72px] object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.22)]"
              draggable={false}
              animate={{
                y: [0, -1.5, 0],
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 2.4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>

          <motion.div
            key={moveTrigger}
            className="absolute left-[12%] bottom-[18px] z-30"
            initial={{ x: 0, y: 0, scale: 1 }}
            animate={
              moveTrigger
                ? {
                    x: [0, 10, 18, 16],
                    y: [0, -1, -3, 0],
                    scale: [1, 1.02, 1.05, 1],
                  }
                : {
                    y: [0, -1.5, 0],
                  }
            }
            transition={
              moveTrigger
                ? { duration: 0.85, ease: 'easeOut' }
                : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            <img
              src={characterImg}
              alt="캐릭터"
              className="h-[52px] w-auto sm:h-[60px] object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)]"
              draggable={false}
            />
          </motion.div>

          <AnimatePresence>
            {showReward && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: -10, scale: 1 }}
                exit={{ opacity: 0, y: -18, scale: 0.95 }}
                transition={{ duration: 0.6 }}
                className="absolute left-[24%] bottom-[52px] z-40"
              >
                <div
                  className="rounded-full px-2.5 py-1 text-[11px] font-extrabold"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    color: theme.badgeText,
                    border: '1px solid rgba(139,90,32,0.15)',
                    boxShadow: '0 6px 18px rgba(80,50,10,0.12)',
                  }}
                >
                  {expText}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-2 left-[10%] right-[12%] z-20">
            <div
              className="h-2 overflow-hidden rounded-full"
              style={{ background: theme.progressBg }}
            >
              <motion.div
                className="h-full rounded-full"
                initial={{ width: '18%' }}
                animate={moveTrigger ? { width: ['18%', '26%', '33%'] } : { width: '18%' }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                style={{
                  background: theme.progressFill,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}