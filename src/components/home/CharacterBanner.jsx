import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { pathImg, characterImg, castleImg } from '../../assets/root/index';

const CATEGORY_THEME = {
  exercise: {
    sky: 'linear-gradient(180deg, #ecd4a8 0%, #e3c37f 100%)',
    glow: 'rgba(255, 190, 90, 0.22)',
    badgeBg: 'rgba(255,248,235,0.82)',
    badgeText: '#6b4719',
    titleBg: 'rgba(255,248,235,0.76)',
    progressBg: 'rgba(90,67,48,0.18)',
    progressFill:
      'linear-gradient(90deg, #8b5a20 0%, #d69a2d 55%, #f1c65e 100%)',
  },
  study: {
    sky: 'linear-gradient(180deg, #eadfbe 0%, #dcc38b 100%)',
    glow: 'rgba(170, 140, 255, 0.16)',
    badgeBg: 'rgba(255,248,235,0.82)',
    badgeText: '#5e4730',
    titleBg: 'rgba(255,248,235,0.76)',
    progressBg: 'rgba(90,67,48,0.18)',
    progressFill:
      'linear-gradient(90deg, #7f6aa8 0%, #a78de2 55%, #d1c0ff 100%)',
  },
  mental: {
    sky: 'linear-gradient(180deg, #e8d9b4 0%, #d8bb7f 100%)',
    glow: 'rgba(110, 205, 180, 0.16)',
    badgeBg: 'rgba(255,248,235,0.82)',
    badgeText: '#4f4a35',
    titleBg: 'rgba(255,248,235,0.76)',
    progressBg: 'rgba(90,67,48,0.18)',
    progressFill:
      'linear-gradient(90deg, #447c70 0%, #68b29e 55%, #9ddbc8 100%)',
  },
  daily: {
    sky: 'linear-gradient(180deg, #ead7aa 0%, #dfbf7b 100%)',
    glow: 'rgba(255, 205, 120, 0.16)',
    badgeBg: 'rgba(255,248,235,0.82)',
    badgeText: '#6a4d2d',
    titleBg: 'rgba(255,248,235,0.76)',
    progressBg: 'rgba(90,67,48,0.18)',
    progressFill:
      'linear-gradient(90deg, #8a6a43 0%, #c89a5d 55%, #efd08a 100%)',
  },
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function CharacterBanner({
  nickname = '귀여운이수',
  title = '첫 걸음을 뗀 자',
  activeCategory = 'daily',
  moveTrigger = 0,
  expText = '+1 EXP',
  progress = 18,
}) {
  const [showReward, setShowReward] = useState(false);

  const theme = useMemo(() => {
    return CATEGORY_THEME[activeCategory] || CATEGORY_THEME.daily;
  }, [activeCategory]);

  const safeProgress = clamp(Number(progress) || 0, 0, 100);

  const characterLeftPercent = useMemo(() => {
    const start = 8;
    const end = 72;
    return start + ((end - start) * safeProgress) / 100;
  }, [safeProgress]);

  useEffect(() => {
    if (!moveTrigger) return;

    setShowReward(true);
    const timer = setTimeout(() => setShowReward(false), 1400);
    return () => clearTimeout(timer);
  }, [moveTrigger]);

  return (
    <div className="px-4 pt-0 pb-0">
      <div
        className="relative overflow-hidden rounded-[26px] px-3 pt-3 pb-3"
        style={{
          background: theme.sky,
          border: '1.5px solid rgba(145,115,60,0.18)',
          boxShadow: '0 8px 18px rgba(60,35,10,0.08)',
        }}
      >
        <div
          className="absolute -top-8 -right-8 h-24 w-24 rounded-full"
          style={{ background: theme.glow, filter: 'blur(10px)' }}
        />

        <div className="relative h-[182px] overflow-hidden rounded-[24px] sm:h-[210px]">
          <img
            src={pathImg}
            alt="루트 길"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-[#fff5df]/10 via-transparent to-[#00000008]" />

          <div className="absolute left-3 right-3 top-3 z-30 flex flex-wrap items-start gap-2">
            <div
              className="inline-flex max-w-full items-center rounded-full px-3 py-1 text-[11px] font-bold shadow-sm sm:text-[12px]"
              style={{
                background: theme.badgeBg,
                color: theme.badgeText,
                border: '1px solid rgba(120,90,40,0.10)',
                backdropFilter: 'blur(4px)',
              }}
            >
              {nickname}
            </div>

            {title ? (
              <div
                className="inline-flex max-w-full items-center rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm sm:text-[12px]"
                style={{
                  background: theme.titleBg,
                  color: theme.badgeText,
                  border: '1px solid rgba(120,90,40,0.10)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {title}
              </div>
            ) : null}
          </div>

          <motion.img
            src={castleImg}
            alt="마왕성"
            className="absolute right-[7%] top-[35%] z-20 h-[88px] w-auto object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.24)] sm:h-[108px]"
            draggable={false}
            animate={{
              y: [0, -2, 0],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          <motion.div
            key={`${moveTrigger}-${safeProgress}`}
            className="absolute bottom-[6px] z-30"
            initial={{
              left: `${characterLeftPercent}%`,
              x: '-50%',
              y: 0,
              scale: 1,
            }}
            animate={{
              left: `${characterLeftPercent}%`,
              x: '-50%',
              y: moveTrigger ? [0, -2, 0] : [0, -1.5, 0],
              scale: moveTrigger ? [1, 1.04, 1] : 1,
            }}
            transition={{
              left: { duration: 0.9, ease: 'easeOut' },
              y: {
                duration: moveTrigger ? 0.5 : 2.2,
                repeat: moveTrigger ? 0 : Infinity,
                ease: 'easeInOut',
              },
              scale: { duration: 0.5, ease: 'easeOut' },
            }}
          >
            <img
              src={characterImg}
              alt="캐릭터"
              className="h-[78px] w-auto object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)] sm:h-[96px]"
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
                className="absolute bottom-[78px] z-40"
                style={{ left: `calc(${characterLeftPercent}% + 12px)` }}
              >
                <div
                  className="rounded-full px-2.5 py-1 text-[10px] font-extrabold"
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
              className="h-2.5 overflow-hidden rounded-full"
              style={{ background: theme.progressBg }}
            >
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${safeProgress}%` }}
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
