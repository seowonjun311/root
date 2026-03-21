import React from 'react';
import { Dumbbell, BookOpen, Heart, Home as HomeIcon } from 'lucide-react';
import { motion } from 'framer-motion';

const CATEGORY_CONFIG = {
  exercise: {
    label: '운동',
    icon: Dumbbell,
    accent: '#c97a1f',
    bg: 'linear-gradient(180deg, #fff2dc 0%, #f5dfb4 100%)',
    selectedBg: 'linear-gradient(180deg, #f3d28b 0%, #e7ba5c 100%)',
    border: '#d8b06d',
    selectedBorder: '#b67a1d',
  },
  study: {
    label: '공부',
    icon: BookOpen,
    accent: '#7d62d9',
    bg: 'linear-gradient(180deg, #f2edff 0%, #ddd3ff 100%)',
    selectedBg: 'linear-gradient(180deg, #ccbaff 0%, #ae95ff 100%)',
    border: '#c4b5fd',
    selectedBorder: '#7d62d9',
  },
  mental: {
    label: '정신',
    icon: Heart,
    accent: '#2f9b7d',
    bg: 'linear-gradient(180deg, #e8fbf5 0%, #cceee4 100%)',
    selectedBg: 'linear-gradient(180deg, #bce7d9 0%, #8fd2bd 100%)',
    border: '#9ed7c5',
    selectedBorder: '#2f9b7d',
  },
  daily: {
    label: '일상',
    icon: HomeIcon,
    accent: '#8a6a42',
    bg: 'linear-gradient(180deg, #fbf1e3 0%, #edd8b9 100%)',
    selectedBg: 'linear-gradient(180deg, #e9c98d 0%, #d7ae67 100%)',
    border: '#d2b17d',
    selectedBorder: '#8a6a42',
  },
};

const CATEGORY_ORDER = ['exercise', 'study', 'mental', 'daily'];
const XP_PER_LEVEL = 30;

function getXp(category, userLevels = {}) {
  return Number(userLevels?.[`${category}_xp`] || 0);
}

function getLevel(category, userLevels = {}) {
  return Number(userLevels?.[`${category}_level`] || 1);
}

export default function CategoryTabs({ active = 'exercise', onChange, userLevels = {} }) {
  return (
    <div className="px-4 pb-3">
      <div className="grid grid-cols-2 gap-2">
        {CATEGORY_ORDER.map((category) => {
          const config = CATEGORY_CONFIG[category];
          const Icon = config.icon;
          const isActive = active === category;

          const xp = getXp(category, userLevels);
          const level = getLevel(category, userLevels);

          const currentLevelXp = xp % XP_PER_LEVEL;
          const progressPercent = Math.max(
            8,
            Math.min(100, Math.round((currentLevelXp / XP_PER_LEVEL) * 100))
          );

          return (
            <motion.button
              key={category}
              onClick={() => onChange?.(category)}
              whileTap={{ scale: 0.97 }}
              animate={
                isActive
                  ? { y: [0, -1, 0], boxShadow: '0 10px 22px rgba(60, 35, 10, 0.16)' }
                  : { y: 0, boxShadow: '0 5px 12px rgba(60, 35, 10, 0.08)' }
              }
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden rounded-2xl p-3 text-left"
              style={{
                background: isActive ? config.selectedBg : config.bg,
                border: `1.5px solid ${isActive ? config.selectedBorder : config.border}`,
              }}
              aria-pressed={isActive}
            >
              <div
                className="absolute -right-4 -top-4 w-16 h-16 rounded-full"
                style={{
                  background: `${config.accent}22`,
                  filter: 'blur(2px)',
                }}
              />

              <div className="relative z-10">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold"
                      style={{
                        background: isActive ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.48)',
                        color: isActive ? '#3d2408' : config.accent,
                        border: `1px solid ${isActive ? 'rgba(61,36,8,0.12)' : `${config.accent}22`}`,
                      }}
                    >
                      <Icon className="w-3 h-3" />
                      {config.label}
                    </div>

                    <div className="mt-2 flex items-end gap-1">
                      <span
                        className="text-lg font-extrabold leading-none"
                        style={{ color: isActive ? '#3d2408' : '#4b2f14' }}
                      >
                        Lv.{level}
                      </span>
                    </div>
                  </div>

                  {isActive && (
                    <div
                      className="shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold"
                      style={{
                        background: 'rgba(255,255,255,0.45)',
                        color: '#5a3610',
                        border: '1px solid rgba(90,54,16,0.10)',
                      }}
                    >
                      선택됨
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <div
                    className="h-2.5 rounded-full overflow-hidden"
                    style={{
                      background: isActive ? 'rgba(61,36,8,0.12)' : 'rgba(90,54,16,0.10)',
                    }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      style={{
                        background: `linear-gradient(90deg, ${config.accent} 0%, ${config.accent}cc 65%, ${config.accent}88 100%)`,
                      }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between">
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: isActive ? '#6b4719' : '#7a5a32' }}
                    >
                      경험치
                    </span>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: isActive ? '#5a3610' : '#6b4a24' }}
                    >
                      {currentLevelXp}/{XP_PER_LEVEL}
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
