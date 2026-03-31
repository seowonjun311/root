import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Coins, Expand, Shrink, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import ActionGoalCard from '@/components/home/ActionGoalCard';

const CATEGORY_KEYS = ['exercise', 'study', 'mental', 'daily'];

const CATEGORY_LABELS = {
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

const CATEGORY_STYLES = {
  exercise: {
    bg: 'linear-gradient(180deg, #eef8ef 0%, #dff2e3 100%)',
    chip: '#2f7d43',
    border: '#a8d7b3',
  },
  study: {
    bg: 'linear-gradient(180deg, #f4f1ff 0%, #e6ddff 100%)',
    chip: '#5b49a8',
    border: '#c6b7ff',
  },
  mental: {
    bg: 'linear-gradient(180deg, #eef9ff 0%, #dff3ff 100%)',
    chip: '#2d6f94',
    border: '#a9d8f0',
  },
  daily: {
    bg: 'linear-gradient(180deg, #fff7ea 0%, #f8ecd3 100%)',
    chip: '#9a6b21',
    border: '#e3c58e',
  },
};

const CATEGORY_ROUTE_MAP = {
  exercise: '/CreateGoalExercise',
  study: '/CreateGoalStudy',
  mental: '/CreateGoalMental',
  daily: '/CreateGoalDaily',
};

const DEFAULT_CHARACTERS = [
  { id: 'fox_1', name: '루', type: 'fox', x: 520, y: 410, size: 42 },
  { id: 'alpaca_1', name: '파카', type: 'alpaca', x: 760, y: 360, size: 46 },
  { id: 'platypus_1', name: '너구', type: 'platypus', x: 930, y: 500, size: 40 },
];

function readGuestData() {
  try {
    if (typeof guestDataPersistence?.getData === 'function') {
      return guestDataPersistence.getData() || {};
    }
    if (typeof guestDataPersistence?.loadOnboardingData === 'function') {
      return guestDataPersistence.loadOnboardingData() || {};
    }
    return {};
  } catch {
    return {};
  }
}

function saveGuestKey(key, value) {
  try {
    if (typeof guestDataPersistence?.saveData === 'function') {
      guestDataPersistence.saveData(key, value);
    }
  } catch (error) {
    console.error('saveGuestKey error:', error);
  }
}

function updateGuestData(updater) {
  try {
    if (typeof guestDataPersistence?.updateData === 'function') {
      return guestDataPersistence.updateData(updater);
    }

    const prev = readGuestData();
    const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };

    Object.entries(next || {}).forEach(([key, value]) => {
      saveGuestKey(key, value);
    });

    return next;
  } catch (error) {
    console.error('updateGuestData error:', error);
    return readGuestData();
  }
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function normalizeGuestGoals(data) {
  if (Array.isArray(data?.goals) && data.goals.length > 0) return data.goals;
  if (data?.goalData) return [data.goalData];
  return [];
}

function normalizeGuestActionGoals(data) {
  if (Array.isArray(data?.actionGoals) && data.actionGoals.length > 0) return data.actionGoals;
  if (data?.actionGoalData) return [data.actionGoalData];
  return [];
}

function sortByCreatedDateDesc(items = []) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a?.created_date || a?.updated_date || 0).getTime();
    const bTime = new Date(b?.created_date || b?.updated_date || 0).getTime();
    return bTime - aTime;
  });
}

function normalizeDateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function getGoalEndDate(goal) {
  if (!goal?.start_date || !goal?.duration_days) return null;
  const start = new Date(goal.start_date);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + Number(goal.duration_days || 0));
  end.setHours(23, 59, 59, 999);
  return end;
}

function getWeekStartString() {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return normalizeDateOnly(monday);
}

function getWeeklyLogsForAction(allLogs, actionGoalId) {
  const weekStart = getWeekStartString();
  return (allLogs || []).filter(
    (log) => log?.action_goal_id === actionGoalId && log?.date && log.date >= weekStart
  );
}

function getAllLogsForAction(allLogs, actionGoalId) {
  return (allLogs || []).filter((log) => log?.action_goal_id === actionGoalId);
}

function getStreakForAction(allLogs, actionGoalId) {
  const dates = (allLogs || [])
    .filter((log) => log?.action_goal_id === actionGoalId && log?.completed && log?.date)
    .map((log) => normalizeDateOnly(log.date))
    .filter(Boolean);

  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const key = normalizeDateOnly(cursor);
    if (!set.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function buildGuestLevelStats(logs = []) {
  const stats = {
    exercise_xp: 0,
    exercise_level: 1,
    study_xp: 0,
    study_level: 1,
    mental_xp: 0,
    mental_level: 1,
    daily_xp: 0,
    daily_level: 1,
  };

  (logs || []).forEach((log) => {
    const category = log?.category;
    if (!category || !CATEGORY_KEYS.includes(category)) return;

    let xp = 1;
    if (Number(log?.duration_minutes || 0) > 0) xp = 1;
    if (log?.meta_action_type === 'one_time') xp = 1;

    stats[`${category}_xp`] += xp;
  });

  CATEGORY_KEYS.forEach((category) => {
    const xp = stats[`${category}_xp`] || 0;
    stats[`${category}_level`] = Math.floor(xp / 30) + 1;
  });

  return stats;
}

function resolveGoalIdForActionGoal(actionGoal, goals = []) {
  if (actionGoal?.goal_id) return actionGoal.goal_id;

  const sameCategory = goals.find(
    (goal) => goal?.status === 'active' && goal?.category === actionGoal?.category
  );

  return sameCategory?.id || goals?.[0]?.id || null;
}

function connectActionGoalsToGoals(goals = [], actionGoals = []) {
  return (actionGoals || []).map((actionGoal) => ({
    ...actionGoal,
    goal_id: resolveGoalIdForActionGoal(actionGoal, goals),
  }));
}

function groupActionGoals(actionGoals, today) {
  const todayItems = [];
  const scheduledItems = [];
  const overdueItems = [];

  (actionGoals || []).forEach((actionGoal) => {
    const isOneTime = actionGoal?.action_type === 'one_time';

    if (isOneTime) {
      const scheduledDate = normalizeDateOnly(actionGoal?.scheduled_date);
      const isCompleted =
        actionGoal?.status === 'completed' || actionGoal?.completed === true;

      if (isCompleted) {
        scheduledItems.push(actionGoal);
        return;
      }

      if (!scheduledDate) {
        scheduledItems.push(actionGoal);
        return;
      }

      if (scheduledDate < today) {
        overdueItems.push(actionGoal);
        return;
      }

      if (scheduledDate === today) {
        todayItems.push(actionGoal);
        return;
      }

      scheduledItems.push(actionGoal);
      return;
    }

    const endDate = getGoalEndDate(actionGoal);
    if (endDate) {
      const compareEnd = new Date(endDate);
      compareEnd.setHours(0, 0, 0, 0);

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      if (compareEnd < todayDate) {
        overdueItems.push(actionGoal);
        return;
      }
    }

    todayItems.push(actionGoal);
  });

  scheduledItems.sort((a, b) =>
    (normalizeDateOnly(a?.scheduled_date) || '9999-12-31').localeCompare(
      normalizeDateOnly(b?.scheduled_date) || '9999-12-31'
    )
  );

  overdueItems.sort((a, b) =>
    (normalizeDateOnly(a?.scheduled_date) || '0000-01-01').localeCompare(
      normalizeDateOnly(b?.scheduled_date) || '0000-01-01'
    )
  );

  return { todayItems, scheduledItems, overdueItems };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function getCharacterEmoji(type) {
  if (type === 'alpaca') return '🦙';
  if (type === 'platypus') return '🦫';
  return '🦊';
}

function getVillageCharacters(source) {
  const raw = Array.isArray(source?.village_characters) && source.village_characters.length > 0
    ? source.village_characters
    : DEFAULT_CHARACTERS;

  return raw.map((character, index) => ({
    id: character?.id || `npc_${index + 1}`,
    name: character?.name || `주민 ${index + 1}`,
    type: character?.type || 'fox',
    x: Number(character?.x ?? randomBetween(260, 1080)),
    y: Number(character?.y ?? randomBetween(210, 620)),
    size: Number(character?.size ?? 42),
  }));
}

function buildWorldBuildings({ activeCategory, userLevels, totalLevel, actionCount }) {
  const level = userLevels?.[`${activeCategory}_level`] || 1;

  const baseBuildings = [
    {
      id: 'town_hall',
      label: totalLevel >= 12 ? '중앙회관 Lv.3' : totalLevel >= 6 ? '중앙회관 Lv.2' : '중앙회관 Lv.1',
      x: 590,
      y: 290,
      w: 150,
      h: 110,
      emoji: '🏠',
    },
    {
      id: 'shop',
      label: actionCount >= 20 ? '상점 Lv.2' : '상점 Lv.1',
      x: 260,
      y: 350,
      w: 118,
      h: 92,
      emoji: '🛍️',
    },
    {
      id: 'garden',
      label: level >= 4 ? '정원 Lv.2' : '정원 Lv.1',
      x: 870,
      y: 270,
      w: 130,
      h: 96,
      emoji: '🌳',
    },
  ];

  const categoryBuildingMap = {
    exercise: {
      label: level >= 7 ? '운동장 Lv.3' : level >= 3 ? '운동장 Lv.2' : '운동장 Lv.1',
      emoji: '🏋️',
      x: 210,
      y: 520,
    },
    study: {
      label: level >= 7 ? '도서관 Lv.3' : level >= 3 ? '도서관 Lv.2' : '도서관 Lv.1',
      emoji: '📚',
      x: 430,
      y: 540,
    },
    mental: {
      label: level >= 7 ? '명상숲 Lv.3' : level >= 3 ? '명상숲 Lv.2' : '명상숲 Lv.1',
      emoji: '🧘',
      x: 700,
      y: 540,
    },
    daily: {
      label: level >= 7 ? '생활공방 Lv.3' : level >= 3 ? '생활공방 Lv.2' : '생활공방 Lv.1',
      emoji: '🧺',
      x: 930,
      y: 520,
    },
  };

  return [
    ...baseBuildings,
    {
      id: 'category_building',
      ...categoryBuildingMap[activeCategory],
      w: 136,
      h: 100,
    },
  ];
}

function HeaderBar({ nickname, totalLevel, points, isZoomedOut, onToggleZoom }) {
  return (
    <div className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[12px] text-muted-foreground">루트 마을</div>
            <div className="truncate text-[17px] font-extrabold">
              {nickname} · Lv.{totalLevel}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-bold">
              <Coins className="w-4 h-4" />
              {points}
            </div>

            <button
              type="button"
              onClick={onToggleZoom}
              className="flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-bold transition active:scale-[0.97]"
            >
              {isZoomedOut ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
              {isZoomedOut ? '기본보기' : '전체보기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryTabs({ activeCategory, onChange, userLevels }) {
  return (
    <div className="sticky top-[65px] z-30 border-b bg-background/95 backdrop-blur">
      <div className="flex gap-2 overflow-x-auto px-4 py-2">
        {CATEGORY_KEYS.map((category) => {
          const isActive = category === activeCategory;
          const level = userLevels?.[`${category}_level`] || 1;
          const xp = userLevels?.[`${category}_xp`] || 0;
          const currentXp = xp % 30;

          return (
            <button
              key={category}
              type="button"
              onClick={() => onChange(category)}
              className={`min-w-[88px] rounded-2xl border px-3 py-2 text-left transition ${
                isActive ? 'shadow-sm' : ''
              }`}
              style={{
                background: isActive ? CATEGORY_STYLES[category].bg : '#ffffff',
                borderColor: isActive ? CATEGORY_STYLES[category].border : '#e5e7eb',
              }}
            >
              <div
                className="text-[12px] font-extrabold"
                style={{ color: isActive ? CATEGORY_STYLES[category].chip : '#374151' }}
              >
                {CATEGORY_LABELS[category]}
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">Lv.{level}</div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/8">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(currentXp / 30) * 100}%`,
                    background: CATEGORY_STYLES[category].chip,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WorldLayer({
  activeCategory,
  userLevels,
  totalLevel,
  actionCount,
  characters,
  setCharacters,
  isZoomedOut,
}) {
  const viewportRef = useRef(null);
  const [worldOffset, setWorldOffset] = useState({ x: -260, y: -160 });
  const dragStateRef = useRef(null);

  const scale = isZoomedOut ? 0.56 : 1;
  const worldWidth = 1300;
  const worldHeight = 860;
  const buildings = useMemo(
    () => buildWorldBuildings({ activeCategory, userLevels, totalLevel, actionCount }),
    [activeCategory, userLevels, totalLevel, actionCount]
  );

  const onPointerDown = (e) => {
    dragStateRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: worldOffset.x,
      originY: worldOffset.y,
    };
  };

  const onPointerMove = useCallback((e) => {
    if (!dragStateRef.current) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    setWorldOffset({
      x: dragStateRef.current.originX + dx,
      y: dragStateRef.current.originY + dy,
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragStateRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCharacters((prev) =>
        prev.map((npc) => {
          const nextX = clamp(npc.x + randomBetween(-90, 90), 120, worldWidth - 120);
          const nextY = clamp(npc.y + randomBetween(-70, 70), 160, worldHeight - 120);
          return { ...npc, x: nextX, y: nextY };
        })
      );
    }, 2600);

    return () => clearInterval(interval);
  }, [setCharacters]);

  return (
    <div className="px-4 pt-3">
      <div
        className="overflow-hidden rounded-[28px] border shadow-sm"
        style={{
          background: CATEGORY_STYLES[activeCategory].bg,
          borderColor: CATEGORY_STYLES[activeCategory].border,
        }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="text-[15px] font-extrabold">
              {CATEGORY_LABELS[activeCategory]} 마을
            </div>
            <div className="text-[12px] text-muted-foreground">
              드래그로 이동 · {isZoomedOut ? '줌아웃 상태' : '기본 확대 상태'}
            </div>
          </div>

          <div
            className="rounded-full px-3 py-1 text-[11px] font-bold"
            style={{
              background: '#ffffffaa',
              color: CATEGORY_STYLES[activeCategory].chip,
              border: `1px solid ${CATEGORY_STYLES[activeCategory].border}`,
            }}
          >
            건물 {buildings.length}개 · 주민 {characters.length}명
          </div>
        </div>

        <div
          ref={viewportRef}
          className="relative h-[340px] touch-none overflow-hidden"
          onPointerDown={onPointerDown}
          style={{
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.08) 100%)',
          }}
        >
          <div
            className="absolute left-0 top-0"
            style={{
              width: worldWidth,
              height: worldHeight,
              transform: `translate(${worldOffset.x}px, ${worldOffset.y}px) scale(${scale})`,
              transformOrigin: 'top left',
              transition: dragStateRef.current ? 'none' : 'transform 300ms ease',
            }}
          >
            <div
              className="absolute inset-0 rounded-[36px]"
              style={{
                background:
                  'radial-gradient(circle at 50% 40%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.2) 38%, rgba(90,120,60,0.05) 100%)',
              }}
            />

            <div
              className="absolute left-[80px] top-[120px] h-[590px] w-[1140px] rounded-[999px]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(111,183,104,0.24) 0%, rgba(98,170,89,0.32) 100%)',
                border: '1px solid rgba(83,140,74,0.18)',
              }}
            />

            <div
              className="absolute left-[170px] top-[220px] h-[340px] w-[960px] rounded-[999px]"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, #d8be85 0%, #cfb376 52%, #c6a767 100%)',
                boxShadow: 'inset 0 10px 30px rgba(255,255,255,0.18)',
              }}
            />

            <div
              className="absolute left-[230px] top-[280px] h-[220px] w-[840px] rounded-[999px]"
              style={{
                background:
                  'radial-gradient(circle at 50% 50%, #7fc36a 0%, #6db65c 65%, #62aa52 100%)',
                opacity: 0.9,
              }}
            />

            {buildings.map((building) => (
              <div
                key={building.id}
                className="absolute select-none rounded-[24px] border bg-white/75 backdrop-blur-sm"
                style={{
                  left: building.x,
                  top: building.y,
                  width: building.w,
                  height: building.h,
                  borderColor: CATEGORY_STYLES[activeCategory].border,
                  boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                }}
              >
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="text-[28px]">{building.emoji}</div>
                  <div className="mt-1 text-[12px] font-extrabold text-slate-700">
                    {building.label}
                  </div>
                </div>
              </div>
            ))}

            {characters.map((npc) => (
              <div
                key={npc.id}
                className="absolute select-none"
                style={{
                  left: npc.x,
                  top: npc.y,
                  width: npc.size,
                  height: npc.size,
                  transform: 'translate(-50%, -50%)',
                  transition: 'left 2200ms ease-in-out, top 2200ms ease-in-out',
                }}
              >
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white/85 shadow">
                  <span style={{ fontSize: npc.size * 0.55 }}>{getCharacterEmoji(npc.type)}</span>
                </div>

                <div
                  className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white"
                >
                  {npc.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActiveGoalCard({ goal, activeCategory }) {
  if (!goal) return null;

  const endDate = getGoalEndDate(goal);
  const dday = goal?.has_d_day && goal?.d_day ? goal.d_day : null;

  return (
    <div className="rounded-[24px] border bg-white px-4 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div
            className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold"
            style={{
              background: CATEGORY_STYLES[activeCategory].bg,
              color: CATEGORY_STYLES[activeCategory].chip,
              border: `1px solid ${CATEGORY_STYLES[activeCategory].border}`,
            }}
          >
            결과목표
          </div>
          <div className="mt-2 text-[17px] font-extrabold leading-snug">{goal.title}</div>
          <div className="mt-2 text-[12px] text-muted-foreground">
            {dday ? `D-DAY ${dday}` : ''}
            {dday && endDate ? ' · ' : ''}
            {endDate ? `종료 ${normalizeDateOnly(endDate)}` : ''}
          </div>
        </div>

        <div className="shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold">
          {CATEGORY_LABELS[activeCategory]}
        </div>
      </div>
    </div>
  );
}

function Section({ title, count, emptyText, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[16px] font-extrabold">{title}</div>
        <div className="rounded-full border px-2.5 py-1 text-[11px] font-bold">{count}</div>
      </div>

      {count === 0 ? (
        <div className="rounded-2xl border bg-white px-4 py-4 text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [guestVersion, setGuestVersion] = useState(0);
  const [activeCategory, setActiveCategory] = useState('exercise');
  const [isZoomedOut, setIsZoomedOut] = useState(false);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 1000 * 30,
  });

  const isGuest = !isUserLoading && !user;

  useEffect(() => {
    const handle = () => setGuestVersion((v) => v + 1);
    window.addEventListener('root-home-data-updated', handle);
    return () => window.removeEventListener('root-home-data-updated', handle);
  }, []);

  const { data: guestData = {} } = useQuery({
    queryKey: ['guest-home-data', guestVersion],
    queryFn: () => readGuestData(),
    staleTime: 0,
    enabled: isGuest,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', isGuest, guestVersion],
    enabled: !isUserLoading,
    staleTime: 1000 * 60,
    queryFn: async () => {
      if (isGuest) {
        return normalizeGuestGoals(readGuestData());
      }

      const resultGoals = await base44.entities.Goal.filter({
        status: 'active',
        goal_type: 'result',
      });

      return Array.isArray(resultGoals) ? resultGoals : [];
    },
  });

  const { data: actionGoals = [] } = useQuery({
    queryKey: ['actionGoals', isGuest, guestVersion],
    enabled: !isUserLoading,
    staleTime: 1000 * 30,
    queryFn: async () => {
      if (isGuest) {
        return normalizeGuestActionGoals(readGuestData());
      }

      const result = await base44.entities.ActionGoal.filter({ status: 'active' });
      return Array.isArray(result) ? result : [];
    },
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allLogs', isGuest, guestVersion],
    enabled: !isUserLoading,
    staleTime: 1000 * 15,
    queryFn: async () => {
      if (isGuest) {
        const data = readGuestData();
        return Array.isArray(data?.actionLogs) ? data.actionLogs : [];
      }

      const result = await base44.entities.ActionLog.list('-created_date', 200);
      return Array.isArray(result) ? result : [];
    },
  });

  useEffect(() => {
    if (isUserLoading) return;

    if (user) {
      if (!user?.onboarding_complete) {
        navigate('/Onboarding', { replace: true });
        return;
      }

      if (CATEGORY_KEYS.includes(user?.active_category)) {
        setActiveCategory(user.active_category);
      }
      return;
    }

    const data = readGuestData();
    const done = data?.onboardingComplete === true;

    if (!done) {
      navigate('/Onboarding', { replace: true });
      return;
    }

    if (CATEGORY_KEYS.includes(data?.activeCategory)) {
      setActiveCategory(data.activeCategory);
    }
  }, [isUserLoading, user, navigate]);

  const connectedActionGoals = useMemo(() => {
    return connectActionGoalsToGoals(goals, actionGoals);
  }, [goals, actionGoals]);

  const guestLevels = useMemo(() => buildGuestLevelStats(allLogs), [allLogs]);

  const userLevels = useMemo(() => {
    if (isGuest) return guestLevels;

    return {
      exercise_xp: user?.exercise_xp || 0,
      exercise_level: user?.exercise_level || 1,
      study_xp: user?.study_xp || 0,
      study_level: user?.study_level || 1,
      mental_xp: user?.mental_xp || 0,
      mental_level: user?.mental_level || 1,
      daily_xp: user?.daily_xp || 0,
      daily_level: user?.daily_level || 1,
    };
  }, [isGuest, guestLevels, user]);

  const totalLevel = useMemo(() => {
    return (
      (userLevels.exercise_level || 1) +
      (userLevels.study_level || 1) +
      (userLevels.mental_level || 1) +
      (userLevels.daily_level || 1)
    );
  }, [userLevels]);

  const nickname = isGuest
    ? guestData?.nickname || '용사님'
    : user?.nickname || '용사님';

  const points = isGuest
    ? Number(guestData?.points || guestData?.village_points || 0)
    : Number(user?.points || user?.village_points || 0);

  const [characters, setCharacters] = useState(() => getVillageCharacters({}));

  useEffect(() => {
    const source = isGuest ? guestData : user;
    setCharacters(getVillageCharacters(source || {}));
  }, [isGuest, guestData, user]);

  const activeGoal = useMemo(() => {
    const filtered = sortByCreatedDateDesc(
      goals.filter((goal) => goal?.category === activeCategory && goal?.status === 'active')
    );
    return filtered[0] || null;
  }, [goals, activeCategory]);

  const categoryActionGoals = useMemo(() => {
    const filtered = connectedActionGoals.filter((actionGoal) => {
      if (actionGoal?.category !== activeCategory) return false;
      if (actionGoal?.status !== 'active') return false;
      if (activeGoal?.id) return actionGoal?.goal_id === activeGoal.id;
      return true;
    });

    return sortByCreatedDateDesc(filtered);
  }, [connectedActionGoals, activeCategory, activeGoal]);

  const grouped = useMemo(() => {
    return groupActionGoals(categoryActionGoals, getTodayString());
  }, [categoryActionGoals]);

  const handleCategoryChange = async (nextCategory) => {
    setActiveCategory(nextCategory);

    if (isGuest) {
      saveGuestKey('activeCategory', nextCategory);
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    await base44.auth.updateMe({ active_category: nextCategory }).catch(() => {});
  };

  const handleCreateGoal = () => {
    const route = CATEGORY_ROUTE_MAP[activeCategory] || '/CreateGoalExercise';
    if (activeGoal?.id) {
      navigate(`${route}?goalId=${activeGoal.id}`);
      return;
    }
    navigate(route);
  };

  const handleActionComplete = async (actionGoal, minutes = 0, extra = {}) => {
    try {
      const now = new Date().toISOString();
      const todayStr = getTodayString();

      const logPayload = {
        id: `log_${Date.now()}`,
        action_goal_id: actionGoal.id,
        goal_id: actionGoal.goal_id || activeGoal?.id || null,
        category: actionGoal.category,
        title: actionGoal.title || '',
        completed: true,
        date: todayStr,
        duration_minutes: Number(minutes || 0),
        gps_enabled: !!extra?.gpsEnabled,
        distance_km: extra?.distance ?? null,
        route_coordinates: extra?.coords ? JSON.stringify(extra.coords) : null,
        photo_url: extra?.photo || null,
        memo: extra?.memo || '',
        meta_action_type: actionGoal.action_type || 'confirm',
        created_date: now,
        updated_date: now,
      };

      if (isGuest) {
        updateGuestData((prev) => {
          const prevLogs = Array.isArray(prev?.actionLogs) ? prev.actionLogs : [];
          const prevActionGoals = Array.isArray(prev?.actionGoals) ? prev.actionGoals : [];

          const nextLogs = [...prevLogs, logPayload];

          const nextActionGoals =
            actionGoal.action_type === 'one_time'
              ? prevActionGoals.map((goal) =>
                  goal.id === actionGoal.id
                    ? {
                        ...goal,
                        status: 'completed',
                        completed: true,
                        completed_date: todayStr,
                        updated_date: now,
                      }
                    : goal
                )
              : prevActionGoals;

          return {
            ...prev,
            actionLogs: nextLogs,
            actionGoals: nextActionGoals,
          };
        });

        window.dispatchEvent(new Event('root-home-data-updated'));
      } else {
        const createPayload = { ...logPayload };
        delete createPayload.id;

        await base44.entities.ActionLog.create(createPayload);

        if (actionGoal.action_type === 'one_time') {
          await base44.entities.ActionGoal.update(actionGoal.id, {
            status: 'completed',
            completed: true,
            completed_date: todayStr,
          });
        }

        const currentXp = user?.[`${actionGoal.category}_xp`] || 0;
        const newXp = currentXp + 1;
        const newLevel = Math.floor(newXp / 30) + 1;

        await base44.auth
          .updateMe({
            [`${actionGoal.category}_xp`]: newXp,
            [`${actionGoal.category}_level`]: newLevel,
          })
          .catch(() => {});
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
        queryClient.invalidateQueries({ queryKey: ['actionGoals'] }),
        queryClient.invalidateQueries({ queryKey: ['allLogs'] }),
        queryClient.invalidateQueries({ queryKey: ['guest-home-data'] }),
      ]);
    } catch (error) {
      console.error('handleActionComplete error:', error);
    }
  };

  const actionCount = allLogs.filter((log) => log?.completed).length;

  return (
    <div className="min-h-screen bg-background pb-28">
      <HeaderBar
        nickname={nickname}
        totalLevel={totalLevel}
        points={points}
        isZoomedOut={isZoomedOut}
        onToggleZoom={() => setIsZoomedOut((prev) => !prev)}
      />

      <CategoryTabs
        activeCategory={activeCategory}
        onChange={handleCategoryChange}
        userLevels={userLevels}
      />

      <WorldLayer
        activeCategory={activeCategory}
        userLevels={userLevels}
        totalLevel={totalLevel}
        actionCount={actionCount}
        characters={characters}
        setCharacters={setCharacters}
        isZoomedOut={isZoomedOut}
      />

      <div className="px-4 pt-4">
        {activeGoal ? (
          <ActiveGoalCard goal={activeGoal} activeCategory={activeCategory} />
        ) : (
          <div className="rounded-[24px] border bg-white px-4 py-5 shadow-sm">
            <div className="text-[16px] font-extrabold">
              아직 {CATEGORY_LABELS[activeCategory]} 결과목표가 없어요
            </div>
            <div className="mt-1 text-[13px] text-muted-foreground">
              먼저 결과목표를 만들면 이 카테고리 마을이 더 크게 자라나기 시작해요.
            </div>

            <button
              type="button"
              onClick={handleCreateGoal}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-extrabold transition active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              결과/행동목표 만들기
            </button>
          </div>
        )}
      </div>

      <div className="space-y-6 px-4 pt-5">
        <Section
          title="오늘 해야 할 것"
          count={grouped.todayItems.length}
          emptyText="오늘 해야 할 행동목표가 없습니다."
        >
          {grouped.todayItems.map((actionGoal) => (
            <ActionGoalCard
              key={actionGoal.id}
              actionGoal={actionGoal}
              weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)}
              allLogs={getAllLogsForAction(allLogs, actionGoal.id)}
              streak={getStreakForAction(allLogs, actionGoal.id)}
              onComplete={handleActionComplete}
            />
          ))}
        </Section>

        <Section
          title="예정된 목표"
          count={grouped.scheduledItems.length}
          emptyText="예정된 목표가 없습니다."
        >
          {grouped.scheduledItems.map((actionGoal) => (
            <ActionGoalCard
              key={actionGoal.id}
              actionGoal={actionGoal}
              weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)}
              allLogs={getAllLogsForAction(allLogs, actionGoal.id)}
              streak={getStreakForAction(allLogs, actionGoal.id)}
              onComplete={handleActionComplete}
            />
          ))}
        </Section>

        <Section
          title="기한 지난 목표"
          count={grouped.overdueItems.length}
          emptyText="기한 지난 목표가 없습니다."
        >
          {grouped.overdueItems.map((actionGoal) => (
            <ActionGoalCard
              key={actionGoal.id}
              actionGoal={actionGoal}
              weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)}
              allLogs={getAllLogsForAction(allLogs, actionGoal.id)}
              streak={getStreakForAction(allLogs, actionGoal.id)}
              onComplete={handleActionComplete}
            />
          ))}
        </Section>
      </div>

      <div className="px-4 pt-5">
        <button
          type="button"
          onClick={handleCreateGoal}
          className="w-full h-12 rounded-2xl font-bold text-sm"
          style={{
            background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 50%, #8a6520 100%)',
            border: '2px solid #6b4e15',
            color: '#fff8e8',
            boxShadow: 'inset 0 1px 2px rgba(255,220,120,0.4), 0 3px 6px rgba(60,35,5,0.3)',
          }}
        >
          + 행동목표 추가
        </button>
      </div>
    </div>
  );
}
