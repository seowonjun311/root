import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import { toast } from 'sonner';

import CategoryTabs from '@/components/home/CategoryTabs';
import GoalProgress from '@/components/home/GoalProgress';
import ActionGoalCard from '@/components/home/ActionGoalCard';
import EmptyGoalState from '@/components/home/EmptyGoalState';

import { getBackground } from '@/assets/root/backgrounds';
import { getBuilding } from '@/assets/root/buildings';
import { foxImg, alpacaImg, platypusImg } from '@/assets/root/characters';
import { grassImg, treeImg, flowerImg } from '@/assets/root/decorations';

const CATEGORY_ROUTE_MAP = {
  exercise: '/CreateGoalExercise',
  study: '/CreateGoalStudy',
  mental: '/CreateGoalMental',
  daily: '/CreateGoalDaily',
};

const CATEGORY_LABELS = {
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

const CATEGORY_ALIASES = {
  exercise: 'exercise',
  study: 'study',
  mental: 'mental',
  daily: 'daily',
  운동: 'exercise',
  공부: 'study',
  정신: 'mental',
  일상: 'daily',
};

const VALID_CATEGORIES = Object.keys(CATEGORY_LABELS);

const WORLD_WIDTH = 700;
const WORLD_HEIGHT = 450;
const VIEWPORT_HEIGHT = 300;

const SHOP_ITEMS = [
  { id: 'fox_1', label: '여우', type: 'character', subtype: 'fox', price: 15, image: foxImg },
  { id: 'alpaca_1', label: '알파카', type: 'character', subtype: 'alpaca', price: 18, image: alpacaImg },
  { id: 'platypus_1', label: '오리너구리', type: 'character', subtype: 'platypus', price: 20, image: platypusImg },

  { id: 'grass_1', label: '잔디', type: 'decoration', subtype: 'grass', price: 3, image: grassImg },
  { id: 'tree_1', label: '나무', type: 'decoration', subtype: 'tree', price: 8, image: treeImg },
  { id: 'flower_1', label: '꽃', type: 'decoration', subtype: 'flower', price: 5, image: flowerImg },
];

const DEFAULT_BUILDINGS = [
  { id: 'exercise_building', category: 'exercise', x: 88, y: 246, flipped: false },
  { id: 'study_building', category: 'study', x: 210, y: 278, flipped: false },
  { id: 'mental_building', category: 'mental', x: 390, y: 264, flipped: false },
  { id: 'daily_building', category: 'daily', x: 548, y: 222, flipped: false },
];

const DEFAULT_VILLAGE_DATA = {
  village_points: 0,
  village_decorations: [],
  village_characters: [
    { id: 'starter_fox', name: '루', type: 'fox', x: 310, y: 235, size: 52, flipped: false },
  ],
  village_buildings: DEFAULT_BUILDINGS,
  owned_characters: [
    { id: 'owned_starter_fox', shop_item_id: 'fox_1', type: 'fox', label: '여우', image: foxImg, placed: true },
  ],
  owned_decorations: [],
};

function readGuestData() {
  try {
    if (typeof guestDataPersistence?.getData === 'function') {
      return guestDataPersistence.getData() || {};
    }
    if (typeof guestDataPersistence?.loadOnboardingData === 'function') {
      return guestDataPersistence.loadOnboardingData() || {};
    }
    return {};
  } catch (error) {
    console.error('readGuestData error:', error);
    return {};
  }
}

function writeGuestDataPatch(patchOrUpdater) {
  try {
    if (typeof guestDataPersistence?.updateData === 'function') {
      return guestDataPersistence.updateData((prev) => {
        const draft =
          typeof patchOrUpdater === 'function'
            ? patchOrUpdater(prev)
            : { ...prev, ...(patchOrUpdater || {}) };

        const normalizedDraft = { ...(draft || {}) };

        if (Object.prototype.hasOwnProperty.call(normalizedDraft, 'local_action_logs')) {
          normalizedDraft.actionLogs = normalizedDraft.local_action_logs;
          delete normalizedDraft.local_action_logs;
        }

        return normalizedDraft;
      });
    }

    const prev = readGuestData();
    const next =
      typeof patchOrUpdater === 'function'
        ? patchOrUpdater(prev)
        : { ...prev, ...(patchOrUpdater || {}) };

    Object.entries(next || {}).forEach(([key, value]) => {
      const normalizedKey = key === 'local_action_logs' ? 'actionLogs' : key;
      if (typeof guestDataPersistence?.saveData === 'function') {
        guestDataPersistence.saveData(normalizedKey, value);
      }
    });

    return next;
  } catch (error) {
    console.error('writeGuestDataPatch error:', error);
    return readGuestData();
  }
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function normalizeDateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function normalizeCategoryValue(category, fallback = 'exercise') {
  const normalized = CATEGORY_ALIASES[category];
  if (normalized && VALID_CATEGORIES.includes(normalized)) return normalized;
  return fallback;
}

function resolveCategoryKey(category, fallback = '') {
  const rawCategory = typeof category === 'string' ? category.trim() : '';
  if (!rawCategory) return fallback;
  return CATEGORY_ALIASES[rawCategory] || rawCategory;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
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

function getMonday(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getSunday(date = new Date()) {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

function getWeeklyLogsForAction(logs, actionGoalId) {
  const monday = getMonday();
  const sunday = getSunday();

  return (logs || []).filter((log) => {
    if (log?.action_goal_id !== actionGoalId) return false;
    if (!log?.date) return false;
    const logDate = new Date(log.date);
    if (Number.isNaN(logDate.getTime())) return false;
    return logDate >= monday && logDate <= sunday;
  });
}

function getAllLogsForAction(logs, actionGoalId) {
  return (logs || []).filter((log) => log?.action_goal_id === actionGoalId);
}

function resolveGoalIdForActionGoal(actionGoal, goals = [], fallbackCategory = 'exercise') {
  if (actionGoal?.goal_id) return actionGoal.goal_id;

  const categoryKey = resolveCategoryKey(actionGoal?.category, fallbackCategory);
  const safeGoals = Array.isArray(goals) ? goals.filter(Boolean) : [];

  const byCategory = safeGoals.find((goal) => {
    if (!goal?.id) return false;
    if (goal?.status && goal.status !== 'active') return false;
    return resolveCategoryKey(goal?.category, '') === categoryKey;
  });

  if (byCategory?.id) return byCategory.id;
  return safeGoals[0]?.id || null;
}

function connectActionGoalsToGoals(goals = [], actionGoals = []) {
  const safeGoals = Array.isArray(goals) ? goals.filter(Boolean) : [];
  const safeActionGoals = Array.isArray(actionGoals) ? actionGoals.filter(Boolean) : [];

  return safeActionGoals.map((actionGoal) => {
    const categoryKey = resolveCategoryKey(actionGoal?.category, 'exercise');
    const resolvedGoalId = resolveGoalIdForActionGoal(actionGoal, safeGoals, categoryKey);

    return {
      ...actionGoal,
      category: categoryKey,
      goal_id: resolvedGoalId,
    };
  });
}

function normalizeGuestGoals(rawGoals, fallbackCategory = 'exercise') {
  return (Array.isArray(rawGoals) ? rawGoals : [])
    .filter(Boolean)
    .map((goal, index) => ({
      ...goal,
      id: goal?.id || `local_goal_${index + 1}`,
      category: normalizeCategoryValue(goal?.category, fallbackCategory),
      status: goal?.status || 'active',
    }));
}

function normalizeGuestActionGoals(rawActionGoals, goals = [], fallbackCategory = 'exercise') {
  const safeActionGoals = Array.isArray(rawActionGoals) ? rawActionGoals : [];

  return safeActionGoals
    .filter(Boolean)
    .map((actionGoal, index) => {
      const category = normalizeCategoryValue(actionGoal?.category, fallbackCategory);
      const tempGoalId =
        actionGoal?.goal_id ||
        goals.find((goal) => normalizeCategoryValue(goal?.category, '') === category)?.id ||
        goals[0]?.id ||
        null;

      return {
        ...actionGoal,
        id: actionGoal?.id || `local_ag_${index + 1}`,
        category,
        status: actionGoal?.status || 'active',
        goal_id: tempGoalId,
      };
    });
}

function getStreakForAction(logs, actionGoalId) {
  const completedDates = (logs || [])
    .filter((log) => log?.action_goal_id === actionGoalId && log?.completed && log?.date)
    .map((log) => normalizeDateOnly(log.date))
    .filter(Boolean);

  const dateSet = new Set(completedDates);
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const dateStr = normalizeDateOnly(cursor);
    if (!dateSet.has(dateStr)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getDefaultUserLevels(logs = []) {
  const result = {
    exercise_level: 1,
    exercise_xp: 0,
    study_level: 1,
    study_xp: 0,
    mental_level: 1,
    mental_xp: 0,
    daily_level: 1,
    daily_xp: 0,
  };

  (logs || []).forEach((log) => {
    const category = log?.category;
    if (!category) return;

    let addXp = 10;
    if (log?.duration_minutes && Number(log.duration_minutes) > 0) addXp = 15;
    if (log?.meta_action_type === 'one_time') addXp = 20;

    if (!Object.prototype.hasOwnProperty.call(result, `${category}_xp`)) return;
    result[`${category}_xp`] += addXp;
  });

  ['exercise', 'study', 'mental', 'daily'].forEach((category) => {
    const xp = result[`${category}_xp`] || 0;
    result[`${category}_level`] = Math.max(1, Math.floor(xp / 30) + 1);
  });

  return result;
}

function groupActionGoals(actionGoals, today) {
  const todayItems = [];
  const scheduledItems = [];
  const overdueItems = [];

  (actionGoals || []).forEach((actionGoal) => {
    const isOneTime = actionGoal?.action_type === 'one_time';

    if (isOneTime) {
      const scheduledDate = normalizeDateOnly(
        actionGoal?.scheduled_date ||
          actionGoal?.scheduledDate ||
          actionGoal?.date ||
          actionGoal?.target_date ||
          actionGoal?.targetDate
      );

      const isCompleted =
        actionGoal?.status === 'completed' || actionGoal?.completed === true;

      if (isCompleted) return;

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
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const compareEnd = new Date(endDate);
      compareEnd.setHours(0, 0, 0, 0);

      if (compareEnd < todayDate) {
        overdueItems.push(actionGoal);
        return;
      }
    }

    todayItems.push(actionGoal);
  });

  scheduledItems.sort((a, b) => {
    const aDate =
      normalizeDateOnly(
        a?.scheduled_date || a?.scheduledDate || a?.date || a?.target_date || a?.targetDate
      ) || '9999-12-31';

    const bDate =
      normalizeDateOnly(
        b?.scheduled_date || b?.scheduledDate || b?.date || b?.target_date || b?.targetDate
      ) || '9999-12-31';

    return aDate.localeCompare(bDate);
  });

  overdueItems.sort((a, b) => {
    const aDate =
      normalizeDateOnly(
        a?.scheduled_date || a?.scheduledDate || a?.date || a?.target_date || a?.targetDate
      ) || '0000-01-01';

    const bDate =
      normalizeDateOnly(
        b?.scheduled_date || b?.scheduledDate || b?.date || b?.target_date || b?.targetDate
      ) || '0000-01-01';

    return aDate.localeCompare(bDate);
  });

  return { todayItems, scheduledItems, overdueItems };
}

function calculateExp(actionGoal, minutes = 0) {
  if (actionGoal?.action_type === 'one_time') return 20;
  if (actionGoal?.action_type === 'timer' || Number(minutes || 0) > 0) return 15;
  return 10;
}

function calculateVillagePointReward(actionGoal, minutes = 0) {
  if (actionGoal?.action_type === 'one_time') return 5;
  if (actionGoal?.action_type === 'timer' || Number(minutes || 0) > 0) return 3;
  return 2;
}

function getCharacterImage(type) {
  if (type === 'alpaca') return alpacaImg;
  if (type === 'platypus') return platypusImg;
  return foxImg;
}

function getDecorationImage(type) {
  if (type === 'tree') return treeImg;
  if (type === 'flower') return flowerImg;
  return grassImg;
}

function getVillageState(source) {
  return {
    village_points: Number(source?.village_points ?? DEFAULT_VILLAGE_DATA.village_points),
    village_decorations: Array.isArray(source?.village_decorations)
      ? source.village_decorations
      : DEFAULT_VILLAGE_DATA.village_decorations,
    village_characters:
      Array.isArray(source?.village_characters) && source.village_characters.length > 0
        ? source.village_characters
        : DEFAULT_VILLAGE_DATA.village_characters,
    village_buildings:
      Array.isArray(source?.village_buildings) && source.village_buildings.length > 0
        ? source.village_buildings
        : DEFAULT_VILLAGE_DATA.village_buildings,
    owned_characters: Array.isArray(source?.owned_characters)
      ? source.owned_characters
      : DEFAULT_VILLAGE_DATA.owned_characters,
    owned_decorations: Array.isArray(source?.owned_decorations)
      ? source.owned_decorations
      : DEFAULT_VILLAGE_DATA.owned_decorations,
  };
}

function createDecoration(subtype, worldWidth = WORLD_WIDTH, worldHeight = WORLD_HEIGHT) {
  const sizeMap = { grass: 24, tree: 48, flower: 22 };

  return {
    id: `${subtype}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    type: subtype,
    image: getDecorationImage(subtype),
    x: randomBetween(70, worldWidth - 70),
    y: randomBetween(75, worldHeight - 55),
    flipped: false,
    size: sizeMap[subtype] || 24,
  };
}

function createCharacter(type) {
  return {
    id: `${type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    name: type === 'alpaca' ? '파카' : type === 'platypus' ? '너구' : '루',
    type,
    image: getCharacterImage(type),
    x: randomBetween(90, WORLD_WIDTH - 90),
    y: randomBetween(80, WORLD_HEIGHT - 70),
    size: type === 'alpaca' ? 52 : 46,
    flipped: false,
  };
}

function buildWorldBuildings({ userLevels, buildingLayout }) {
  const exerciseLevel = Number(userLevels?.exercise_level || 1);
  const studyLevel = Number(userLevels?.study_level || 1);
  const mentalLevel = Number(userLevels?.mental_level || 1);
  const dailyLevel = Number(userLevels?.daily_level || 1);

  const getStage = (level) => (level >= 7 ? 3 : level >= 3 ? 2 : 1);
  const layoutMap = Object.fromEntries((buildingLayout || []).map((b) => [b.category, b]));

  return [
    {
      id: 'exercise_building',
      category: 'exercise',
      label: `체육관 Lv.${getStage(exerciseLevel)}`,
      image: getBuilding('exercise', getStage(exerciseLevel)),
      x: layoutMap.exercise?.x ?? 88,
      y: layoutMap.exercise?.y ?? 246,
      flipped: !!layoutMap.exercise?.flipped,
      w: 92,
      h: 74,
    },
    {
      id: 'study_building',
      category: 'study',
      label: `도서관 Lv.${getStage(studyLevel)}`,
      image: getBuilding('study', getStage(studyLevel)),
      x: layoutMap.study?.x ?? 210,
      y: layoutMap.study?.y ?? 278,
      flipped: !!layoutMap.study?.flipped,
      w: 92,
      h: 74,
    },
    {
      id: 'mental_building',
      category: 'mental',
      label: `명상숲 Lv.${getStage(mentalLevel)}`,
      image: getBuilding('mental', getStage(mentalLevel)),
      x: layoutMap.mental?.x ?? 390,
      y: layoutMap.mental?.y ?? 264,
      flipped: !!layoutMap.mental?.flipped,
      w: 92,
      h: 74,
    },
    {
      id: 'daily_building',
      category: 'daily',
      label: `생활공방 Lv.${getStage(dailyLevel)}`,
      image: getBuilding('daily', getStage(dailyLevel)),
      x: layoutMap.daily?.x ?? 548,
      y: layoutMap.daily?.y ?? 222,
      flipped: !!layoutMap.daily?.flipped,
      w: 92,
      h: 74,
    },
  ];
}

function buildBuildingHitboxes(buildings = []) {
  return buildings.map((building) => ({
    id: building.id,
    left: building.x - building.w * 0.45,
    right: building.x + building.w * 0.45,
    top: building.y - building.h * 0.25,
    bottom: building.y + building.h * 0.35,
  }));
}

function pointInRect(x, y, rect, padding = 0) {
  return (
    x >= rect.left - padding &&
    x <= rect.right + padding &&
    y >= rect.top - padding &&
    y <= rect.bottom + padding
  );
}

function isBlockedByBuildings(x, y, buildings = [], padding = 16) {
  return buildings.some((rect) => pointInRect(x, y, rect, padding));
}

function findSafeRandomPoint(buildings = [], worldWidth = WORLD_WIDTH, worldHeight = WORLD_HEIGHT) {
  for (let i = 0; i < 80; i += 1) {
    const x = randomBetween(58, worldWidth - 58);
    const y = randomBetween(62, worldHeight - 52);

    if (!isBlockedByBuildings(x, y, buildings, 20)) {
      return { x, y };
    }
  }

  return { x: worldWidth / 2, y: worldHeight / 2 };
}

function moveNpcAvoidingBuildings(npc, buildingHitboxes) {
  for (let i = 0; i < 20; i += 1) {
    const nextX = clamp(npc.x + randomBetween(-34, 34), 48, WORLD_WIDTH - 48);
    const nextY = clamp(npc.y + randomBetween(-28, 28), 50, WORLD_HEIGHT - 48);

    if (!isBlockedByBuildings(nextX, nextY, buildingHitboxes, 18)) {
      return {
        ...npc,
        x: nextX,
        y: nextY,
        flipped: nextX < npc.x ? true : nextX > npc.x ? false : npc.flipped,
      };
    }
  }

  return npc;
}

function Section({ title, count, emptyText, children }) {
  const hasItems = React.Children.count(children) > 0;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold" style={{ color: '#4a2c08' }}>
          {title}
        </h2>
        <div
          className="rounded-full px-2 py-1 text-[11px] font-bold"
          style={{
            background: 'rgba(196,154,74,0.14)',
            color: '#8a5a17',
            border: '1px solid rgba(196,154,74,0.18)',
          }}
        >
          {count}개
        </div>
      </div>

      {hasItems ? (
        <div className="space-y-3">{children}</div>
      ) : (
        <div
          className="rounded-2xl px-4 py-4 text-sm"
          style={{
            background: '#fffaf0',
            border: '1px solid rgba(160,120,64,0.16)',
            color: '#8f6a33',
          }}
        >
          {emptyText}
        </div>
      )}
    </section>
  );
}

function ExpPopup({ exp }) {
  return (
    <div
      className="animate-[fadeInOut_1.4s_ease-in-out_forwards] fixed left-1/2 top-24 z-[80] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-extrabold shadow-lg"
      style={{
        background: 'linear-gradient(180deg, #f6d98c 0%, #d9a83e 100%)',
        color: '#4a2c08',
        border: '2px solid #8a6520',
      }}
    >
      +{exp} EXP
    </div>
  );
}

function PointPopup({ points }) {
  return (
    <div
      className="animate-[fadeInOut_1.4s_ease-in-out_forwards] fixed left-1/2 top-40 z-[80] -translate-x-1/2 rounded-full px-4 py-2 text-sm font-extrabold shadow-lg"
      style={{
        background: 'linear-gradient(180deg, #fff0bf 0%, #efc75f 100%)',
        color: '#4a2c08',
        border: '2px solid #8a6520',
      }}
    >
      +{points} 포인트
    </div>
  );
}

function AddActionGoalButton({ onClick, categoryLabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl px-4 py-3 text-left"
      style={{
        background: 'linear-gradient(180deg, #fff7e8 0%, #f6e4bd 100%)',
        border: '1px solid rgba(160,120,64,0.22)',
        boxShadow: '0 8px 18px rgba(80,50,10,0.08)',
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[14px] font-extrabold" style={{ color: '#4a2c08' }}>
            + 행동목표 추가
          </div>
          <div className="mt-1 text-[12px]" style={{ color: '#8a5a17' }}>
            {categoryLabel} 루트에 새로운 행동목표를 추가해요
          </div>
        </div>

        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-extrabold"
          style={{
            background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)',
            color: '#fff8e8',
            border: '2px solid #6b4e15',
            flexShrink: 0,
          }}
        >
          +
        </div>
      </div>
    </button>
  );
}

function VillageShopModal({ open, activeTab, onTabChange, points, onClose, onBuy }) {
  if (!open) return null;

  const items = SHOP_ITEMS.filter((item) =>
    activeTab === 'character' ? item.type === 'character' : item.type === 'decoration'
  );

  return (
    <div className="fixed inset-0 z-[95] bg-black/45 px-4 py-8">
      <div
        className="mx-auto w-full max-w-md rounded-[28px] p-4"
        style={{
          background: 'linear-gradient(180deg, #fff7e8 0%, #f7e9cb 100%)',
          border: '1px solid rgba(160,120,64,0.18)',
          boxShadow: '0 18px 36px rgba(0,0,0,0.18)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[17px] font-extrabold" style={{ color: '#4a2c08' }}>
              마을 상점
            </div>
            <div className="mt-1 text-[12px]" style={{ color: '#8a5a17' }}>
              보유 포인트 {points}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-[12px] font-extrabold"
            style={{
              background: '#fff',
              border: '1px solid rgba(160,120,64,0.14)',
              color: '#4a2c08',
            }}
          >
            닫기
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onTabChange('character')}
            className="h-11 flex-1 rounded-2xl text-sm font-extrabold"
            style={{
              background:
                activeTab === 'character'
                  ? 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)'
                  : '#fff',
              color: activeTab === 'character' ? '#fff8e8' : '#4a2c08',
              border:
                activeTab === 'character'
                  ? '2px solid #6b4e15'
                  : '1px solid rgba(160,120,64,0.14)',
            }}
          >
            캐릭터
          </button>

          <button
            type="button"
            onClick={() => onTabChange('decoration')}
            className="h-11 flex-1 rounded-2xl text-sm font-extrabold"
            style={{
              background:
                activeTab === 'decoration'
                  ? 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)'
                  : '#fff',
              color: activeTab === 'decoration' ? '#fff8e8' : '#4a2c08',
              border:
                activeTab === 'decoration'
                  ? '2px solid #6b4e15'
                  : '1px solid rgba(160,120,64,0.14)',
            }}
          >
            꾸미기
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {items.map((item) => {
            const disabled = points < item.price;

            return (
              <div
                key={item.id}
                className="rounded-2xl p-3"
                style={{
                  background: '#fffdf8',
                  border: '1px solid rgba(160,120,64,0.14)',
                }}
              >
                <div className="flex h-[68px] items-center justify-center">
                  <img
                    src={item.image}
                    alt={item.label}
                    draggable={false}
                    style={{
                      maxHeight: '64px',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      background: 'transparent',
                      backgroundColor: 'transparent',
                      border: 'none',
                      boxShadow: 'none',
                    }}
                  />
                </div>

                <div className="mt-2 text-[14px] font-extrabold" style={{ color: '#4a2c08' }}>
                  {item.label}
                </div>
                <div className="text-[12px]" style={{ color: '#8a5a17' }}>
                  {item.price} 포인트
                </div>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onBuy(item)}
                  className="mt-3 h-10 w-full rounded-2xl text-sm font-extrabold"
                  style={{
                    background: disabled
                      ? '#ede5d2'
                      : 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)',
                    color: disabled ? '#9a8f7b' : '#fff8e8',
                    border: disabled ? '1px solid #d4c8b0' : '2px solid #6b4e15',
                  }}
                >
                  구매
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function VillageBagModal({
  open,
  activeTab,
  onTabChange,
  ownedCharacters,
  ownedDecorations,
  onClose,
  onPlaceCharacter,
  onPlaceDecoration,
}) {
  if (!open) return null;

  const items = activeTab === 'character' ? ownedCharacters : ownedDecorations;

  return (
    <div className="fixed inset-0 z-[96] bg-black/45 px-4 py-8">
      <div
        className="mx-auto w-full max-w-md rounded-[28px] p-4"
        style={{
          background: 'linear-gradient(180deg, #fff7e8 0%, #f7e9cb 100%)',
          border: '1px solid rgba(160,120,64,0.18)',
          boxShadow: '0 18px 36px rgba(0,0,0,0.18)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[17px] font-extrabold" style={{ color: '#4a2c08' }}>
              가방
            </div>
            <div className="mt-1 text-[12px]" style={{ color: '#8a5a17' }}>
              구매한 아이템을 마을에 배치할 수 있어요
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-[12px] font-extrabold"
            style={{
              background: '#fff',
              border: '1px solid rgba(160,120,64,0.14)',
              color: '#4a2c08',
            }}
          >
            닫기
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => onTabChange('character')}
            className="h-11 flex-1 rounded-2xl text-sm font-extrabold"
            style={{
              background:
                activeTab === 'character'
                  ? 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)'
                  : '#fff',
              color: activeTab === 'character' ? '#fff8e8' : '#4a2c08',
              border:
                activeTab === 'character'
                  ? '2px solid #6b4e15'
                  : '1px solid rgba(160,120,64,0.14)',
            }}
          >
            내 캐릭터
          </button>

          <button
            type="button"
            onClick={() => onTabChange('decoration')}
            className="h-11 flex-1 rounded-2xl text-sm font-extrabold"
            style={{
              background:
                activeTab === 'decoration'
                  ? 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)'
                  : '#fff',
              color: activeTab === 'decoration' ? '#fff8e8' : '#4a2c08',
              border:
                activeTab === 'decoration'
                  ? '2px solid #6b4e15'
                  : '1px solid rgba(160,120,64,0.14)',
            }}
          >
            내 꾸미기
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div
              className="rounded-2xl px-4 py-6 text-center text-sm"
              style={{
                background: '#fffaf0',
                border: '1px solid rgba(160,120,64,0.16)',
                color: '#8f6a33',
              }}
            >
              아직 가방에 아이템이 없어요
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-2xl p-3"
                style={{
                  background: '#fffdf8',
                  border: '1px solid rgba(160,120,64,0.14)',
                }}
              >
                <div className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl bg-white">
                  <img
                    src={item.image}
                    alt={item.label}
                    draggable={false}
                    style={{
                      maxHeight: '52px',
                      maxWidth: '52px',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-extrabold" style={{ color: '#4a2c08' }}>
                    {item.label}
                  </div>
                  <div className="mt-1 text-[12px]" style={{ color: '#8a5a17' }}>
                    {item.placed ? '이미 배치됨' : '가방에 보관 중'}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={item.placed}
                  onClick={() =>
                    activeTab === 'character'
                      ? onPlaceCharacter(item)
                      : onPlaceDecoration(item)
                  }
                  className="h-10 shrink-0 rounded-2xl px-4 text-sm font-extrabold"
                  style={{
                    background: item.placed
                      ? '#ede5d2'
                      : 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)',
                    color: item.placed ? '#9a8f7b' : '#fff8e8',
                    border: item.placed ? '1px solid #d4c8b0' : '2px solid #6b4e15',
                  }}
                >
                  배치하기
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function EditToolbar({
  isEditMode,
  selectedObject,
  onToggleEditMode,
  onFlip,
  onSave,
  onCancel,
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleEditMode}
          className="pointer-events-auto rounded-full px-3 py-2 text-[12px] font-extrabold"
          style={{
            background: isEditMode
              ? 'linear-gradient(180deg, #d97a5c 0%, #c25c3c 100%)'
              : 'rgba(255,248,232,0.92)',
            color: isEditMode ? '#fff8e8' : '#4a2c08',
            border: isEditMode ? '2px solid #7f321d' : '1px solid rgba(107,78,21,0.14)',
            boxShadow: '0 8px 16px rgba(50,30,0,0.08)',
          }}
        >
          {isEditMode ? '편집 종료' : '편집모드'}
        </button>

        {isEditMode ? (
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              type="button"
              disabled={!selectedObject}
              onClick={onFlip}
              className="rounded-full px-3 py-2 text-[12px] font-extrabold"
              style={{
                background: !selectedObject ? '#efe7d8' : '#fff',
                color: !selectedObject ? '#a19380' : '#4a2c08',
                border: '1px solid rgba(107,78,21,0.14)',
                boxShadow: '0 8px 16px rgba(50,30,0,0.08)',
              }}
            >
              좌우반전
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="rounded-full px-3 py-2 text-[12px] font-extrabold"
              style={{
                background: '#fff',
                color: '#4a2c08',
                border: '1px solid rgba(107,78,21,0.14)',
                boxShadow: '0 8px 16px rgba(50,30,0,0.08)',
              }}
            >
              취소
            </button>

            <button
              type="button"
              onClick={onSave}
              className="rounded-full px-3 py-2 text-[12px] font-extrabold"
              style={{
                background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)',
                color: '#fff8e8',
                border: '2px solid #6b4e15',
                boxShadow: '0 8px 16px rgba(50,30,0,0.08)',
              }}
            >
              저장
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VillageOverlayBar({
  nickname,
  level,
  points,
  isOverview,
  onToggleOverview,
  onOpenShop,
  onOpenBag,
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3">
      <div className="flex items-start justify-between gap-2">
        <div
          className="pointer-events-auto rounded-2xl px-3 py-2"
          style={{
            background: 'rgba(255,248,232,0.82)',
            border: '1px solid rgba(107,78,21,0.14)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 8px 16px rgba(50,30,0,0.08)',
          }}
        >
          <div className="text-[11px] font-bold" style={{ color: '#8a5a17' }}>
            {nickname}
          </div>
          <div className="text-[14px] font-extrabold" style={{ color: '#4a2c08' }}>
            전체 Lv.{level}
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div
            className="rounded-full px-3 py-2 text-[12px] font-extrabold"
            style={{
              background: 'rgba(255,248,232,0.9)',
              color: '#4a2c08',
              border: '1px solid rgba(107,78,21,0.14)',
              boxShadow: '0 8px 16px rgba(50,30,0,0.08)',
            }}
          >
            포인트 {points}
          </div>

          <button
            type="button"
            onClick={onOpenBag}
            className="rounded-full px-3 py-2 text-[12px] font-extrabold"
            style={{
              background: '#fff',
              color: '#4a2c08',
              border: '1px solid rgba(107,78,21,0.14)',
              boxShadow: '0 8px 16px rgba(50,30,0,0.08)',
            }}
          >
            가방
          </button>

          <button
            type="button"
            onClick={onOpenShop}
            className="rounded-full px-3 py-2 text-[12px] font-extrabold"
            style={{
              background: '#fff',
              color: '#4a2c08',
              border: '1px solid rgba(107,78,21,0.14)',
              boxShadow: '0 8px 16px rgba(50,30,0,0.08)',
            }}
          >
            상점
          </button>

          <button
            type="button"
            onClick={onToggleOverview}
            className="rounded-full px-3 py-2 text-[12px] font-extrabold"
            style={{
              background: isOverview
                ? 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)'
                : 'rgba(255,248,232,0.9)',
              color: isOverview ? '#fff8e8' : '#4a2c08',
              border: isOverview
                ? '2px solid #6b4e15'
                : '1px solid rgba(107,78,21,0.14)',
              boxShadow: '0 8px 16px rgba(50,30,0,0.08)',
            }}
          >
            {isOverview ? '기본보기' : '전체보기'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DecorationSprite({ item }) {
  return (
    <img
      src={item.image}
      alt={item.type}
      draggable={false}
      style={{
        width: item.size,
        height: item.size,
        objectFit: 'contain',
        display: 'block',
        background: 'transparent',
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        userSelect: 'none',
        WebkitUserDrag: 'none',
        pointerEvents: 'none',
      }}
    />
  );
}

function getOffsetBounds(viewportWidth, viewportHeight, worldWidth, worldHeight, scale) {
  const scaledWidth = worldWidth * scale;
  const scaledHeight = worldHeight * scale;

  const centeredX = (viewportWidth - scaledWidth) / 2;
  const centeredY = (viewportHeight - scaledHeight) / 2;

  let minX;
  let maxX;
  let minY;
  let maxY;

  if (scaledWidth <= viewportWidth) {
    minX = centeredX;
    maxX = centeredX;
  } else {
    minX = viewportWidth - scaledWidth;
    maxX = 0;
  }

  if (scaledHeight <= viewportHeight) {
    minY = centeredY;
    maxY = centeredY;
  } else {
    minY = viewportHeight - scaledHeight;
    maxY = 0;
  }

  return { minX, maxX, minY, maxY };
}

function VillageWorldLayer({
  activeCategory,
  isOverview,
  nickname,
  totalLevel,
  points,
  userLevels,
  decorations,
  setDecorations,
  characters,
  setCharacters,
  buildingLayout,
  setBuildingLayout,
  isEditMode,
  selectedObject,
  setSelectedObject,
  onToggleOverview,
  onOpenShop,
  onOpenBag,
  onToggleEditMode,
  onFlipSelected,
  onSaveEdit,
  onCancelEdit,
}) {
  const dragRef = useRef(null);
  const viewportRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  const scale = isOverview ? 0.9 : 1;

  const initialBounds = getOffsetBounds(
    viewportWidth || 1,
    VIEWPORT_HEIGHT,
    WORLD_WIDTH,
    WORLD_HEIGHT,
    scale
  );

  const [offset, setOffset] = useState({
    x: initialBounds.maxX,
    y: initialBounds.maxY,
  });

  const buildings = useMemo(
    () => buildWorldBuildings({ userLevels, buildingLayout }),
    [userLevels, buildingLayout]
  );

  const buildingHitboxes = useMemo(() => buildBuildingHitboxes(buildings), [buildings]);

  const backgroundImage = getBackground(activeCategory, 'day');

  useEffect(() => {
    const updateSize = () => {
      if (!viewportRef.current) return;
      setViewportWidth(viewportRef.current.clientWidth);
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!viewportWidth) return;
    const bounds = getOffsetBounds(
      viewportWidth,
      VIEWPORT_HEIGHT,
      WORLD_WIDTH,
      WORLD_HEIGHT,
      scale
    );
    setOffset((prev) => ({
      x: clamp(prev.x, bounds.minX, bounds.maxX),
      y: clamp(prev.y, bounds.minY, bounds.maxY),
    }));
  }, [viewportWidth, scale]);

  const handleWorldPointerDown = (e) => {
    if (isEditMode) return;

    dragRef.current = {
      mode: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  const startObjectDrag = (e, objType, objId) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();

    setSelectedObject({ type: objType, id: objId });

    dragRef.current = {
      mode: 'object',
      objectType: objType,
      objectId: objId,
      startX: e.clientX,
      startY: e.clientY,
    };
  };

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragRef.current) return;

      if (dragRef.current.mode === 'pan') {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;

        const bounds = getOffsetBounds(
          viewportWidth || 1,
          VIEWPORT_HEIGHT,
          WORLD_WIDTH,
          WORLD_HEIGHT,
          scale
        );

        const nextX = dragRef.current.originX + dx;
        const nextY = dragRef.current.originY + dy;

        setOffset({
          x: clamp(nextX, bounds.minX, bounds.maxX),
          y: clamp(nextY, bounds.minY, bounds.maxY),
        });
        return;
      }

      if (dragRef.current.mode === 'object') {
        const dx = (e.clientX - dragRef.current.startX) / scale;
        const dy = (e.clientY - dragRef.current.startY) / scale;
        const margin = 40;

        if (dragRef.current.objectType === 'decoration') {
          setDecorations((prev) =>
            prev.map((item) =>
              item.id === dragRef.current.objectId
                ? {
                    ...item,
                    x: clamp(item.x + dx, margin, WORLD_WIDTH - margin),
                    y: clamp(item.y + dy, margin, WORLD_HEIGHT - margin),
                  }
                : item
            )
          );
        }

        if (dragRef.current.objectType === 'character') {
          setCharacters((prev) =>
            prev.map((item) =>
              item.id === dragRef.current.objectId
                ? {
                    ...item,
                    x: clamp(item.x + dx, margin, WORLD_WIDTH - margin),
                    y: clamp(item.y + dy, margin, WORLD_HEIGHT - margin),
                  }
                : item
            )
          );
        }

        if (dragRef.current.objectType === 'building') {
          setBuildingLayout((prev) =>
            prev.map((item) =>
              item.category === dragRef.current.objectId
                ? {
                    ...item,
                    x: clamp(item.x + dx, 56, WORLD_WIDTH - 56),
                    y: clamp(item.y + dy, 56, WORLD_HEIGHT - 56),
                  }
                : item
            )
          );
        }

        dragRef.current.startX = e.clientX;
        dragRef.current.startY = e.clientY;
      }
    },
    [scale, setDecorations, setCharacters, setBuildingLayout, viewportWidth]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    if (isEditMode) return;

    const timer = setInterval(() => {
      setCharacters((prev) => prev.map((npc) => moveNpcAvoidingBuildings(npc, buildingHitboxes)));
    }, 2600);

    return () => clearInterval(timer);
  }, [isEditMode, setCharacters, buildingHitboxes]);

  return (
    <div
      className="sticky top-0 z-40 overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, rgba(248,241,223,0.98) 0%, rgba(245,232,201,0.95) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="px-4 pt-3 pb-2">
        <div
          ref={viewportRef}
          className="relative overflow-hidden rounded-[28px]"
          style={{
            height: VIEWPORT_HEIGHT,
            border: '1px solid rgba(160,120,64,0.18)',
            boxShadow: '0 12px 24px rgba(80,50,10,0.08)',
          }}
        >
          <VillageOverlayBar
            nickname={nickname}
            level={totalLevel}
            points={points}
            isOverview={isOverview}
            onToggleOverview={onToggleOverview}
            onOpenShop={onOpenShop}
            onOpenBag={onOpenBag}
          />

          <EditToolbar
            isEditMode={isEditMode}
            selectedObject={selectedObject}
            onToggleEditMode={onToggleEditMode}
            onFlip={onFlipSelected}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
          />

          <div
            className="absolute inset-0 touch-none overflow-hidden"
            onPointerDown={handleWorldPointerDown}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: WORLD_WIDTH,
                height: WORLD_HEIGHT,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: 'top left',
                transition: dragRef.current ? 'none' : 'transform 300ms ease',
              }}
            >
              {backgroundImage ? (
                <img
                  src={backgroundImage}
                  alt="village background"
                  className="absolute inset-0 h-full w-full object-cover"
                  draggable={false}
                  style={{ pointerEvents: 'none' }}
                />
              ) : (
                <div className="absolute inset-0 bg-[#d8e8b0]" />
              )}

              {decorations.map((item) => {
                const isSelected =
                  selectedObject?.type === 'decoration' && selectedObject?.id === item.id;

                return (
                  <div
                    key={item.id}
                    className="absolute"
                    onPointerDown={(e) => startObjectDrag(e, 'decoration', item.id)}
                    style={{
                      left: item.x,
                      top: item.y,
                      transform: `translate(-50%, -50%) scaleX(${item.flipped ? -1 : 1})`,
                      outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none',
                      outlineOffset: '3px',
                      borderRadius: '999px',
                      cursor: isEditMode ? 'grab' : 'default',
                      zIndex: 12,
                      pointerEvents: 'auto',
                    }}
                  >
                    <DecorationSprite item={item} />
                  </div>
                );
              })}

              {buildings.map((building) => {
                const isSelected =
                  selectedObject?.type === 'building' &&
                  selectedObject?.id === building.category;

                return (
                  <div
                    key={building.id}
                    className="absolute"
                    onPointerDown={(e) => startObjectDrag(e, 'building', building.category)}
                    style={{
                      left: building.x,
                      top: building.y,
                      width: building.w,
                      height: building.h,
                      transform: `translate(-50%, -50%) scaleX(${building.flipped ? -1 : 1})`,
                      outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none',
                      outlineOffset: '4px',
                      borderRadius: '20px',
                      cursor: isEditMode ? 'grab' : 'default',
                      zIndex: 13,
                      pointerEvents: 'auto',
                    }}
                  >
                    <img
                      src={building.image}
                      alt={building.label}
                      className="h-full w-full object-contain"
                      draggable={false}
                      style={{ pointerEvents: 'none' }}
                    />
                  </div>
                );
              })}

              {characters.map((npc) => {
                const isSelected =
                  selectedObject?.type === 'character' && selectedObject?.id === npc.id;

                return (
                  <div
                    key={npc.id}
                    className="absolute"
                    onPointerDown={(e) => startObjectDrag(e, 'character', npc.id)}
                    style={{
                      left: npc.x,
                      top: npc.y,
                      width: npc.size,
                      height: npc.size,
                      transform: `translate(-50%, -50%) scaleX(${npc.flipped ? -1 : 1})`,
                      transition: isEditMode
                        ? 'none'
                        : 'left 2200ms ease-in-out, top 2200ms ease-in-out',
                      outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none',
                      outlineOffset: '3px',
                      borderRadius: '999px',
                      cursor: isEditMode ? 'grab' : 'default',
                      zIndex: 14,
                      pointerEvents: 'auto',
                    }}
                  >
                    <img
                      src={npc.image || foxImg}
                      alt={npc.name}
                      draggable={false}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                        background: 'transparent',
                        backgroundColor: 'transparent',
                        border: 'none',
                        boxShadow: 'none',
                        userSelect: 'none',
                        WebkitUserDrag: 'none',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [guestVersion, setGuestVersion] = useState(0);
  const [isOverview, setIsOverview] = useState(false);

  const [activeCategory, setActiveCategory] = useState(() => {
    try {
      const raw = guestDataPersistence.getData?.() || {};
      const cat =
        raw?.activeCategory ||
        raw?.guest_active_category ||
        raw?.category ||
        raw?.goals?.[0]?.category;
      return normalizeCategoryValue(cat, 'exercise');
    } catch {
      return 'exercise';
    }
  });

  const [expPopup, setExpPopup] = useState(null);
  const [pointPopup, setPointPopup] = useState(null);

  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState('character');

  const [isBagOpen, setIsBagOpen] = useState(false);
  const [bagTab, setBagTab] = useState('character');

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);

  const [decorations, setDecorations] = useState([]);
  const [characters, setCharacters] = useState(DEFAULT_VILLAGE_DATA.village_characters);
  const [buildingLayout, setBuildingLayout] = useState(DEFAULT_BUILDINGS);
  const [ownedCharacters, setOwnedCharacters] = useState(DEFAULT_VILLAGE_DATA.owned_characters);
  const [ownedDecorations, setOwnedDecorations] = useState(DEFAULT_VILLAGE_DATA.owned_decorations);

  const originalVillageRef = useRef(null);
  const expPopupTimerRef = useRef(null);
  const pointPopupTimerRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => setGuestVersion((prev) => prev + 1);
    window.addEventListener('root-home-data-updated', handleUpdate);
    return () => window.removeEventListener('root-home-data-updated', handleUpdate);
  }, []);

  const guestData = useMemo(() => readGuestData(), [guestVersion]);

  const { data: me } = useQuery({
    queryKey: ['root-home-me'],
    queryFn: async () => {
      try {
        return await base44.auth.me();
      } catch {
        return null;
      }
    },
    staleTime: 30 * 1000,
  });

  const { data: serverGoals = [] } = useQuery({
    queryKey: ['root-home-goals'],
    queryFn: async () => {
      try {
        return await base44.entities.Goal.list('-created_date', 200);
      } catch {
        return [];
      }
    },
    staleTime: 15 * 1000,
  });

  const { data: serverActionGoals = [] } = useQuery({
    queryKey: ['root-home-action-goals'],
    queryFn: async () => {
      try {
        return await base44.entities.ActionGoal.list('-created_date', 300);
      } catch {
        return [];
      }
    },
    staleTime: 15 * 1000,
  });

  const isLoggedIn = !!me?.id;

  const goals = useMemo(() => {
    if (isLoggedIn) {
      return (Array.isArray(serverGoals) ? serverGoals : []).map((goal) => ({
        ...goal,
        category: normalizeCategoryValue(goal?.category, 'exercise'),
      }));
    }
    return normalizeGuestGoals(guestData?.goals || [], activeCategory);
  }, [isLoggedIn, serverGoals, guestData, activeCategory]);

  const connectedActionGoals = useMemo(() => {
    const source = isLoggedIn
      ? (Array.isArray(serverActionGoals) ? serverActionGoals : [])
      : normalizeGuestActionGoals(guestData?.actionGoals || [], goals, activeCategory);

    return connectActionGoalsToGoals(goals, source).filter(
      (item) => resolveCategoryKey(item?.category, 'exercise') === activeCategory
    );
  }, [isLoggedIn, serverActionGoals, guestData, goals, activeCategory]);

  const allConnectedActionGoals = useMemo(() => {
    const source = isLoggedIn
      ? (Array.isArray(serverActionGoals) ? serverActionGoals : [])
      : normalizeGuestActionGoals(guestData?.actionGoals || [], goals, activeCategory);

    return connectActionGoalsToGoals(goals, source);
  }, [isLoggedIn, serverActionGoals, guestData, goals, activeCategory]);

  const logs = useMemo(() => {
    const localLogs = Array.isArray(guestData?.actionLogs)
      ? guestData.actionLogs
      : Array.isArray(guestData?.local_action_logs)
      ? guestData.local_action_logs
      : [];
    return localLogs;
  }, [guestData]);

  const userLevels = useMemo(() => {
    const saved = guestData?.userLevels;
    if (saved && typeof saved === 'object') return saved;
    return getDefaultUserLevels(logs);
  }, [guestData, logs]);

  const totalLevel = useMemo(() => {
    return (
      Number(userLevels.exercise_level || 1) +
      Number(userLevels.study_level || 1) +
      Number(userLevels.mental_level || 1) +
      Number(userLevels.daily_level || 1)
    );
  }, [userLevels]);

  const nickname = guestData?.nickname || me?.nickname || me?.name || '루트 용사';

  const villageState = useMemo(() => getVillageState(guestData), [guestData]);

  useEffect(() => {
    setDecorations(villageState.village_decorations || []);
    setCharacters(villageState.village_characters || DEFAULT_VILLAGE_DATA.village_characters);
    setBuildingLayout(villageState.village_buildings || DEFAULT_BUILDINGS);
    setOwnedCharacters(villageState.owned_characters || DEFAULT_VILLAGE_DATA.owned_characters);
    setOwnedDecorations(villageState.owned_decorations || []);
  }, [villageState]);

  useEffect(() => {
    if (!guestData?.activeCategory && activeCategory) return;
    if (typeof guestDataPersistence?.saveData === 'function') {
      guestDataPersistence.saveData('activeCategory', activeCategory);
    }
  }, [activeCategory, guestData]);

  const points = Number(guestData?.village_points ?? 0);
  const today = getTodayString();

  const { todayItems, scheduledItems, overdueItems } = useMemo(
    () => groupActionGoals(connectedActionGoals, today),
    [connectedActionGoals, today]
  );

  const activeGoal = useMemo(() => {
    return goals.find((goal) => resolveCategoryKey(goal?.category) === activeCategory) || null;
  }, [goals, activeCategory]);

  const progress = useMemo(() => {
    if (!activeGoal) return 0;

    const goalActionGoals = allConnectedActionGoals.filter((ag) => ag.goal_id === activeGoal.id);
    if (goalActionGoals.length === 0) return 0;

    const totalCompleted = goalActionGoals.reduce((acc, actionGoal) => {
      const actionLogs = getAllLogsForAction(logs, actionGoal.id).filter((log) => log?.completed);
      return acc + actionLogs.length;
    }, 0);

    const target = goalActionGoals.reduce((acc, actionGoal) => {
      if (actionGoal?.action_type === 'one_time') return acc + 1;
      return acc + Number(actionGoal?.weekly_frequency || 1);
    }, 0);

    if (target <= 0) return 0;
    return Math.min(100, Math.round((totalCompleted / target) * 100));
  }, [activeGoal, allConnectedActionGoals, logs]);

  const persistVillageState = useCallback(
    (patch = {}) => {
      writeGuestDataPatch((prev) => ({
        ...prev,
        village_points: patch.village_points ?? points,
        village_decorations: patch.village_decorations ?? decorations,
        village_characters: patch.village_characters ?? characters,
        village_buildings: patch.village_buildings ?? buildingLayout,
        owned_characters: patch.owned_characters ?? ownedCharacters,
        owned_decorations: patch.owned_decorations ?? ownedDecorations,
      }));
      window.dispatchEvent(new Event('root-home-data-updated'));
    },
    [points, decorations, characters, buildingLayout, ownedCharacters, ownedDecorations]
  );

  const handleSaveEdit = useCallback(() => {
    persistVillageState();
    originalVillageRef.current = null;
    setIsEditMode(false);
    setSelectedObject(null);
    toast.success('마을 배치를 저장했어');
  }, [persistVillageState]);

  const handleCancelEdit = useCallback(() => {
    if (originalVillageRef.current) {
      setDecorations(originalVillageRef.current.decorations);
      setCharacters(originalVillageRef.current.characters);
      setBuildingLayout(originalVillageRef.current.buildingLayout);
    }
    setIsEditMode(false);
    setSelectedObject(null);
    toast('편집을 취소했어');
  }, []);

  const handleToggleEditMode = useCallback(() => {
    if (!isEditMode) {
      originalVillageRef.current = {
        decorations: JSON.parse(JSON.stringify(decorations)),
        characters: JSON.parse(JSON.stringify(characters)),
        buildingLayout: JSON.parse(JSON.stringify(buildingLayout)),
      };
      setIsEditMode(true);
      return;
    }

    handleSaveEdit();
  }, [isEditMode, decorations, characters, buildingLayout, handleSaveEdit]);

  const handleFlipSelected = useCallback(() => {
    if (!selectedObject) return;

    if (selectedObject.type === 'decoration') {
      setDecorations((prev) =>
        prev.map((item) =>
          item.id === selectedObject.id ? { ...item, flipped: !item.flipped } : item
        )
      );
      return;
    }

    if (selectedObject.type === 'character') {
      setCharacters((prev) =>
        prev.map((item) =>
          item.id === selectedObject.id ? { ...item, flipped: !item.flipped } : item
        )
      );
      return;
    }

    if (selectedObject.type === 'building') {
      setBuildingLayout((prev) =>
        prev.map((item) =>
          item.category === selectedObject.id ? { ...item, flipped: !item.flipped } : item
        )
      );
    }
  }, [selectedObject]);

  const handleBuy = useCallback(
    (item) => {
      if (points < item.price) {
        toast.error('포인트가 부족해');
        return;
      }

      const nextPoints = points - item.price;

      if (item.type === 'character') {
        const newOwned = [
          ...ownedCharacters,
          {
            id: `owned_character_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
            shop_item_id: item.id,
            type: item.subtype,
            label: item.label,
            image: item.image,
            placed: false,
          },
        ];

        setOwnedCharacters(newOwned);
        persistVillageState({
          village_points: nextPoints,
          owned_characters: newOwned,
        });
        toast.success(`${item.label} 구매 완료! 가방에 들어갔어`);
        return;
      }

      const newOwned = [
        ...ownedDecorations,
        {
          id: `owned_decoration_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          shop_item_id: item.id,
          type: item.subtype,
          label: item.label,
          image: item.image,
          placed: false,
        },
      ];

      setOwnedDecorations(newOwned);
      persistVillageState({
        village_points: nextPoints,
        owned_decorations: newOwned,
      });
      toast.success(`${item.label} 구매 완료! 가방에 들어갔어`);
    },
    [points, ownedCharacters, ownedDecorations, persistVillageState]
  );

  const handlePlaceCharacter = useCallback(
    (ownedItem) => {
      const buildingHitboxes = buildBuildingHitboxes(
        buildWorldBuildings({ userLevels, buildingLayout })
      );
      const safePoint = findSafeRandomPoint(buildingHitboxes, WORLD_WIDTH, WORLD_HEIGHT);

      const newCharacter = {
        ...createCharacter(ownedItem.type),
        id: `placed_${ownedItem.id}`,
        name: ownedItem.label,
        image: ownedItem.image,
        x: safePoint.x,
        y: safePoint.y,
      };

      const nextCharacters = [...characters, newCharacter];
      const nextOwned = ownedCharacters.map((item) =>
        item.id === ownedItem.id ? { ...item, placed: true } : item
      );

      setCharacters(nextCharacters);
      setOwnedCharacters(nextOwned);
      persistVillageState({
        village_characters: nextCharacters,
        owned_characters: nextOwned,
      });
      toast.success(`${ownedItem.label}을(를) 마을에 배치했어`);
    },
    [characters, ownedCharacters, persistVillageState, userLevels, buildingLayout]
  );

  const handlePlaceDecoration = useCallback(
    (ownedItem) => {
      const newDecoration = {
        ...createDecoration(ownedItem.type),
        id: `placed_${ownedItem.id}`,
        image: ownedItem.image,
        type: ownedItem.type,
      };

      const nextDecorations = [...decorations, newDecoration];
      const nextOwned = ownedDecorations.map((item) =>
        item.id === ownedItem.id ? { ...item, placed: true } : item
      );

      setDecorations(nextDecorations);
      setOwnedDecorations(nextOwned);
      persistVillageState({
        village_decorations: nextDecorations,
        owned_decorations: nextOwned,
      });
      toast.success(`${ownedItem.label}을(를) 마을에 배치했어`);
    },
    [decorations, ownedDecorations, persistVillageState]
  );

  const showExp = useCallback((exp) => {
    setExpPopup(exp);
    if (expPopupTimerRef.current) clearTimeout(expPopupTimerRef.current);
    expPopupTimerRef.current = setTimeout(() => setExpPopup(null), 1400);
  }, []);

  const showPoints = useCallback((value) => {
    setPointPopup(value);
    if (pointPopupTimerRef.current) clearTimeout(pointPopupTimerRef.current);
    pointPopupTimerRef.current = setTimeout(() => setPointPopup(null), 1400);
  }, []);

  useEffect(() => {
    return () => {
      if (expPopupTimerRef.current) clearTimeout(expPopupTimerRef.current);
      if (pointPopupTimerRef.current) clearTimeout(pointPopupTimerRef.current);
    };
  }, []);

  const handleCompleteActionGoal = useCallback(
    async (actionGoal, payload = {}) => {
      const todayString = getTodayString();
      const addedExp = calculateExp(actionGoal, payload?.duration_minutes || 0);
      const addedPoints = calculateVillagePointReward(actionGoal, payload?.duration_minutes || 0);

      const nextLog = {
        id: `log_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        action_goal_id: actionGoal.id,
        goal_id: actionGoal.goal_id,
        category: actionGoal.category,
        completed: true,
        date: todayString,
        duration_minutes: Number(payload?.duration_minutes || 0),
        distance_km: Number(payload?.distance_km || 0),
        meta_action_type: actionGoal?.action_type || 'confirm',
        photo_url: payload?.photo_url || '',
      };

      const nextLogs = [...logs, nextLog];

      const nextUserLevels = {
        ...(guestData?.userLevels || getDefaultUserLevels(logs)),
      };

      const category = actionGoal.category || activeCategory;
      const xpKey = `${category}_xp`;
      const lvKey = `${category}_level`;

      nextUserLevels[xpKey] = Number(nextUserLevels[xpKey] || 0) + addedExp;
      nextUserLevels[lvKey] = Math.max(1, Math.floor(Number(nextUserLevels[xpKey] || 0) / 30) + 1);

      let nextActionGoals = Array.isArray(guestData?.actionGoals)
        ? [...guestData.actionGoals]
        : [];

      if (actionGoal?.action_type === 'one_time') {
        nextActionGoals = nextActionGoals.map((item) =>
          item.id === actionGoal.id
            ? {
                ...item,
                status: 'completed',
                completed: true,
                completed_date: todayString,
              }
            : item
        );
      }

      writeGuestDataPatch((prev) => ({
        ...prev,
        actionLogs: nextLogs,
        userLevels: nextUserLevels,
        actionGoals: nextActionGoals.length > 0 ? nextActionGoals : prev.actionGoals,
        village_points: Number(prev?.village_points || 0) + addedPoints,
      }));

      queryClient.invalidateQueries({ queryKey: ['root-home-goals'] });
      queryClient.invalidateQueries({ queryKey: ['root-home-action-goals'] });
      window.dispatchEvent(new Event('root-home-data-updated'));

      showExp(addedExp);
      showPoints(addedPoints);
      toast.success('행동목표 완료!');
    },
    [logs, guestData, activeCategory, queryClient, showExp, showPoints]
  );

  const renderActionGoalCard = (actionGoal) => {
    const weeklyLogs = getWeeklyLogsForAction(logs, actionGoal.id);
    const allLogs = getAllLogsForAction(logs, actionGoal.id);
    const streak = getStreakForAction(logs, actionGoal.id);

    return (
      <ActionGoalCard
        key={actionGoal.id}
        actionGoal={actionGoal}
        weeklyLogs={weeklyLogs}
        allLogs={allLogs}
        streak={streak}
        onComplete={(payload) => handleCompleteActionGoal(actionGoal, payload)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f0df] pb-28">
      {expPopup ? <ExpPopup exp={expPopup} /> : null}
      {pointPopup ? <PointPopup points={pointPopup} /> : null}

      <VillageShopModal
        open={isShopOpen}
        activeTab={shopTab}
        onTabChange={setShopTab}
        points={points}
        onClose={() => setIsShopOpen(false)}
        onBuy={handleBuy}
      />

      <VillageBagModal
        open={isBagOpen}
        activeTab={bagTab}
        onTabChange={setBagTab}
        ownedCharacters={ownedCharacters}
        ownedDecorations={ownedDecorations}
        onClose={() => setIsBagOpen(false)}
        onPlaceCharacter={handlePlaceCharacter}
        onPlaceDecoration={handlePlaceDecoration}
      />

      <VillageWorldLayer
        activeCategory={activeCategory}
        isOverview={isOverview}
        nickname={nickname}
        totalLevel={totalLevel}
        points={points}
        userLevels={userLevels}
        decorations={decorations}
        setDecorations={setDecorations}
        characters={characters}
        setCharacters={setCharacters}
        buildingLayout={buildingLayout}
        setBuildingLayout={setBuildingLayout}
        isEditMode={isEditMode}
        selectedObject={selectedObject}
        setSelectedObject={setSelectedObject}
        onToggleOverview={() => setIsOverview((prev) => !prev)}
        onOpenShop={() => setIsShopOpen(true)}
        onOpenBag={() => setIsBagOpen(true)}
        onToggleEditMode={handleToggleEditMode}
        onFlipSelected={handleFlipSelected}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
      />

      <div className="sticky top-[314px] z-30 px-4 pt-1 pb-2 bg-[#f7f0df]/95 backdrop-blur-sm">
        <CategoryTabs
          active={activeCategory}
          onChange={setActiveCategory}
          userLevels={userLevels}
        />
      </div>

      <div className="px-4 pt-3">
        {activeGoal ? (
          <div className="mb-4">
            <GoalProgress goal={activeGoal} progress={progress} />
          </div>
        ) : (
          <div className="mb-4">
            <EmptyGoalState
              category={activeCategory}
              onCreateGoal={() => navigate(CATEGORY_ROUTE_MAP[activeCategory])}
            />
          </div>
        )}

        <div className="space-y-6">
          <Section
            title="오늘 해야 할 것"
            count={todayItems.length}
            emptyText="오늘 해야 할 행동목표가 아직 없어"
          >
            {todayItems.map(renderActionGoalCard)}
          </Section>

          <Section
            title="예정된 목표"
            count={scheduledItems.length}
            emptyText="예정된 행동목표가 없어"
          >
            {scheduledItems.map(renderActionGoalCard)}
          </Section>

          <Section
            title="기한 지난 목표"
            count={overdueItems.length}
            emptyText="기한 지난 행동목표가 없어"
          >
            {overdueItems.map(renderActionGoalCard)}
          </Section>

          <AddActionGoalButton
            categoryLabel={CATEGORY_LABELS[activeCategory]}
            onClick={() => navigate(CATEGORY_ROUTE_MAP[activeCategory])}
          />
        </div>
      </div>
    </div>
  );
}
