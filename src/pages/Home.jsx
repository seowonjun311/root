import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import guestDataPersistence from '@/lib/GuestDataPersistence';
import {
  addOwnedTitle,
  ensureValidEquippedTitle,
  getOwnedTitleIds,
  setEquippedTitle,
} from '@/lib/titleStorage';
import { toast } from 'sonner';

import CategoryTabs from '@/components/home/CategoryTabs';
import GoalProgress from '@/components/home/GoalProgress';
import ActionGoalCard from '@/components/home/ActionGoalCard';
import EmptyGoalState from '@/components/home/EmptyGoalState';

import { getBuilding } from '@/assets/root/buildings';
import { foxImg, alpacaImg, platypusImg } from '@/assets/root/characters';
import { grassImg, treeImg, flowerImg } from '@/assets/root/decorations';

import { baseGrassTileImg, variantGrassTileImg, pathTileImg } from '@/assets/root/tiles/index.js';
import { borderTree1Img, borderTree2Img, borderTree3Img } from '@/assets/root/borderTrees/index.js';
import { borderBush1Img } from '@/assets/root/borderBushes/index.js';

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

const TITLES = [
  { id: 'common_first_step', name: '첫 걸음을 뗀 자', description: '첫 행동목표를 완료한 용사', metric: 'total_actions', value: 1, category: 'common' },
  { id: 'common_route_walker', name: '루트를 걷는 자', description: '전체 행동목표 100회 달성', metric: 'total_actions', value: 100, category: 'common' },

  { id: 'exercise_001', name: '몸을 깨운 자', description: '운동 행동목표 10회 달성', metric: 'total_exercise_count', value: 10, category: 'exercise' },
  { id: 'exercise_002', name: '꾸준함의 전사', description: '운동 행동목표 50회 달성', metric: 'total_exercise_count', value: 50, category: 'exercise' },
  { id: 'exercise_003', name: '바람을 걷는 자', description: '러닝 거리 50km 누적', metric: 'total_running_km', value: 50, category: 'exercise' },
  { id: 'exercise_004', name: '운동의 장인', description: '운동 행동목표 200회 달성', metric: 'total_exercise_count', value: 200, category: 'exercise' },

  { id: 'study_001', name: '집중 입문자', description: '공부 10시간 누적', metric: 'total_study_minutes', value: 600, category: 'study' },
  { id: 'study_002', name: '집중 수련생', description: '공부 30시간 누적', metric: 'total_study_minutes', value: 1800, category: 'study' },
  { id: 'study_003', name: '몰입의 실천가', description: '공부 100시간 누적', metric: 'total_study_minutes', value: 6000, category: 'study' },
  { id: 'study_004', name: '집중의 장인', description: '공부 300시간 누적', metric: 'total_study_minutes', value: 18000, category: 'study' },

  { id: 'mental_001', name: '마음을 들여다본 자', description: '정신 행동목표 10회 달성', metric: 'total_mental_count', value: 10, category: 'mental' },
  { id: 'mental_002', name: '유혹 저항가', description: '금연/금주 7일 누적', metric: 'total_no_smoking_days', value: 7, category: 'mental' },
  { id: 'mental_003', name: '절제의 기사', description: '금연/금주 30일 누적', metric: 'total_no_smoking_days', value: 30, category: 'mental' },
  { id: 'mental_004', name: '내면의 관리자', description: '정신 행동목표 100회 달성', metric: 'total_mental_count', value: 100, category: 'mental' },

  { id: 'daily_001', name: '하루를 시작한 자', description: '일상 행동목표 5회 달성', metric: 'total_daily_count', value: 5, category: 'daily' },
  { id: 'daily_002', name: '생활의 입문자', description: '일상 행동목표 30회 달성', metric: 'total_daily_count', value: 30, category: 'daily' },
  { id: 'daily_003', name: '생활의 관리자', description: '일상 행동목표 100회 달성', metric: 'total_daily_count', value: 100, category: 'daily' },
  { id: 'daily_004', name: '삶을 다듬는 자', description: '일상 행동목표 200회 달성', metric: 'total_daily_count', value: 200, category: 'daily' },
];

const SHOP_ITEMS = [
  { id: 'fox_1', label: '여우', type: 'character', subtype: 'fox', price: 15, image: foxImg },
  { id: 'alpaca_1', label: '알파카', type: 'character', subtype: 'alpaca', price: 18, image: alpacaImg },
  { id: 'platypus_1', label: '오리너구리', type: 'character', subtype: 'platypus', price: 20, image: platypusImg },

  { id: 'grass_1', label: '잔디', type: 'decoration', subtype: 'grass', price: 3, image: grassImg },
  { id: 'tree_1', label: '나무', type: 'decoration', subtype: 'tree', price: 8, image: treeImg },
  { id: 'flower_1', label: '꽃', type: 'decoration', subtype: 'flower', price: 5, image: flowerImg },
];

/* =========================
   타일맵 기본 설정
========================= */
const TILE_W = 128;
const TILE_H = 64;

const GRID_COLS = 20;
const GRID_ROWS = 20;

const GRID_ORIGIN_X = 1280;
const GRID_ORIGIN_Y = 220;

const WORLD_WIDTH = 2560;
const WORLD_HEIGHT = 1700;
const OUTER_TILE_PADDING = 5;
const WORLD_VIEWPORT_HEIGHT = 300;
const WORLD_EDGE_MARGIN_LEFT = 110;
const WORLD_EDGE_MARGIN_RIGHT = 110;
const WORLD_EDGE_MARGIN_TOP = 40;
const WORLD_EDGE_MARGIN_BOTTOM = -300;

const VIEW_DIAMOND_CORNER_LIMIT_X = 500;
const VIEW_DIAMOND_CORNER_LIMIT_Y = 500;

const TILE_KIND = {
  BASE_GRASS: 'base_grass',
  VARIANT_GRASS: 'variant_grass',
  PATH: 'path',
};

const BORDER_TREE_IMAGES = [borderTree1Img, borderTree2Img, borderTree3Img];
const BORDER_BUSH_IMAGES = [borderBush1Img];

const DEFAULT_BUILDINGS = [
  { id: 'exercise_building', category: 'exercise', col: 6, row: 10, flipped: false },
  { id: 'study_building', category: 'study', col: 9, row: 11, flipped: false },
  { id: 'mental_building', category: 'mental', col: 12, row: 9, flipped: false },
  { id: 'daily_building', category: 'daily', col: 15, row: 8, flipped: false },
];

const DEFAULT_VILLAGE_DATA = {
  village_points: 0,
  village_decorations: [],
  village_characters: [
    { id: 'starter_fox', name: '루', type: 'fox', col: 10, row: 12, size: 52, flipped: false },
  ],
  village_buildings: DEFAULT_BUILDINGS,
};

const DEFAULT_VILLAGE_INVENTORY = {
  village_inventory_characters: [],
  village_inventory_decorations: [],
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

function pseudoRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

/* =========================
   마름모 좌표 유틸
========================= */
function gridToScreen(col, row) {
  return {
    x: GRID_ORIGIN_X + (col - row) * (TILE_W / 2),
    y: GRID_ORIGIN_Y + (col + row) * (TILE_H / 2),
  };
}

function screenToGrid(x, y) {
  const localX = x - GRID_ORIGIN_X;
  const localY = y - GRID_ORIGIN_Y;

  const col = Math.round(localY / TILE_H + localX / TILE_W);
  const row = Math.round(localY / TILE_H - localX / TILE_W);

  return {
    col: clamp(col, 0, GRID_COLS - 1),
    row: clamp(row, 0, GRID_ROWS - 1),
  };
}

function getObjectTileSize(item, kind) {
  if (kind === 'building') return { cols: 2, rows: 2 };
  return { cols: 1, rows: 1 };
}

function getOccupiedTiles(item, kind, nextCol = item?.col, nextRow = item?.row) {
  const { cols, rows } = getObjectTileSize(item, kind);
  const tiles = [];

  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      tiles.push({
        col: nextCol + c,
        row: nextRow + r,
      });
    }
  }

  return tiles;
}

function isInsideGrid(col, row) {
  return col >= 0 && row >= 0 && col < GRID_COLS && row < GRID_ROWS;
}

function canPlaceObject({
  movingType,
  movingItem,
  nextCol,
  nextRow,
  decorations = [],
  characters = [],
  buildings = [],
}) {
  const nextTiles = getOccupiedTiles(movingItem, movingType, nextCol, nextRow);

  for (const tile of nextTiles) {
    if (!isInsideGrid(tile.col, tile.row)) return false;
  }

  const taken = new Map();

  const registerTiles = (items, kind) => {
    items.forEach((item) => {
      let isSame = false;

      if (kind === 'building') {
        isSame =
          movingType === 'building' &&
          ((movingItem?.id && item?.id && movingItem.id === item.id) ||
            (movingItem?.category &&
              item?.category &&
              movingItem.category === item.category));
      }

      if (kind === 'decoration') {
        isSame =
          movingType === 'decoration' &&
          movingItem?.id &&
          item?.id &&
          movingItem.id === item.id;
      }

      if (kind === 'character') {
        isSame =
          movingType === 'character' &&
          movingItem?.id &&
          item?.id &&
          movingItem.id === item.id;
      }

      if (isSame) return;

      const occupied = getOccupiedTiles(item, kind);
      occupied.forEach((tile) => {
        taken.set(`${tile.col},${tile.row}`, item.id);
      });
    });
  };

  registerTiles(buildings, 'building');
  registerTiles(decorations, 'decoration');
  registerTiles(characters, 'character');

  for (const tile of nextTiles) {
    if (taken.has(`${tile.col},${tile.row}`)) return false;
  }

  return true;
}

function getObjectScreenPosition(item, kind) {
  const { x, y } = gridToScreen(item.col, item.row);

  if (kind === 'building') return { x, y: y + 22 };
  if (kind === 'character') return { x, y: y + 10 };
  return { x, y: y + 14 };
}

function getPreviewTiles(item, kind, col, row) {
  return getOccupiedTiles(item, kind, col, row);
}

function getPreviewColor(valid) {
  return valid
    ? {
        border: '2px solid rgba(34,197,94,0.95)',
        background: 'rgba(34,197,94,0.18)',
      }
    : {
        border: '2px solid rgba(239,68,68,0.95)',
        background: 'rgba(239,68,68,0.18)',
      };
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

function buildDerivedStats(logs = [], actionGoals = []) {
  const stats = {
    total_actions: 0,
    total_exercise_count: 0,
    total_study_minutes: 0,
    total_mental_count: 0,
    total_daily_count: 0,
    total_running_km: 0,
    total_no_smoking_days: 0,
  };

  (logs || []).forEach((log) => {
    if (!log?.completed) return;

    stats.total_actions += 1;

    if (log.category === 'exercise') {
      stats.total_exercise_count += 1;
      stats.total_running_km += Number(log.distance_km || 0);
    }
    if (log.category === 'study') {
      stats.total_study_minutes += Number(log.duration_minutes || 0);
      if (!log.duration_minutes || Number(log.duration_minutes) === 0) {
        stats.total_study_minutes += 10;
      }
    }
    if (log.category === 'mental') stats.total_mental_count += 1;
    if (log.category === 'daily') stats.total_daily_count += 1;
  });

  const abstainGoalIds = new Set(
    (actionGoals || [])
      .filter((goal) => goal?.category === 'mental' && goal?.action_type === 'abstain')
      .map((goal) => goal.id)
  );

  stats.total_no_smoking_days = (logs || []).filter(
    (log) => log?.completed && abstainGoalIds.has(log?.action_goal_id)
  ).length;

  return stats;
}

function getNewlyUnlockedTitle(stats, ownedTitleIds = []) {
  const ownedSet = new Set(ownedTitleIds);
  return TITLES.find(
    (title) => !ownedSet.has(title.id) && Number(stats?.[title.metric] || 0) >= title.value
  );
}

function validateGoalActionLogChain(goals = [], actionGoals = [], logs = []) {
  const goalIds = new Set((goals || []).map((goal) => goal?.id).filter(Boolean));
  const actionGoalIds = new Set((actionGoals || []).map((goal) => goal?.id).filter(Boolean));

  return {
    actionGoalsWithoutGoalId: (actionGoals || []).filter((goal) => !goal?.goal_id).length,
    logsWithoutGoalId: (logs || []).filter((log) => !log?.goal_id).length,
    logsWithUnknownActionGoal: (logs || []).filter(
      (log) => log?.action_goal_id && !actionGoalIds.has(log.action_goal_id)
    ).length,
    actionGoalsWithUnknownGoal: (actionGoals || []).filter(
      (goal) => goal?.goal_id && !goalIds.has(goal.goal_id)
    ).length,
  };
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

function createInventoryItem(item) {
  return {
    id: `${item.type}_${item.subtype}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    shop_item_id: item.id,
    type: item.type,
    subtype: item.subtype,
    label: item.label,
  };
}

function createPlacedObjectFromInventory(inventoryItem) {
  if (inventoryItem?.type === 'character') {
    return createCharacter(inventoryItem.subtype);
  }
  return createDecoration(inventoryItem?.subtype || 'grass');
}

function getVillageState(source) {
  return {
    village_points: Number(source?.village_points ?? DEFAULT_VILLAGE_DATA.village_points),
    village_decorations: Array.isArray(source?.village_decorations)
      ? source.village_decorations
      : DEFAULT_VILLAGE_DATA.village_decorations,
    village_characters: relocateCharactersToVillageCore(
      Array.isArray(source?.village_characters) && source.village_characters.length > 0
        ? source.village_characters
        : DEFAULT_VILLAGE_DATA.village_characters
    ),
    village_buildings:
      Array.isArray(source?.village_buildings) && source.village_buildings.length > 0
        ? source.village_buildings
        : DEFAULT_VILLAGE_DATA.village_buildings,
    village_inventory_characters: Array.isArray(source?.village_inventory_characters)
      ? source.village_inventory_characters
      : DEFAULT_VILLAGE_INVENTORY.village_inventory_characters,
    village_inventory_decorations: Array.isArray(source?.village_inventory_decorations)
      ? source.village_inventory_decorations
      : DEFAULT_VILLAGE_INVENTORY.village_inventory_decorations,
  };
}

function getCharacterSpawnSlots() {
  return [
    { col: 10, row: 12 },
    { col: 11, row: 12 },
    { col: 9, row: 12 },
    { col: 10, row: 11 },
    { col: 11, row: 11 },
    { col: 9, row: 11 },
    { col: 12, row: 12 },
    { col: 8, row: 12 },
  ];
}

function isCharacterTooFarFromVillageCore(character) {
  const col = Number(character?.col ?? 0);
  const row = Number(character?.row ?? 0);
  return col < 6 || col > 14 || row < 8 || row > 14;
}

function relocateCharactersToVillageCore(rawCharacters = []) {
  const slots = getCharacterSpawnSlots();
  const used = new Set();

  return (Array.isArray(rawCharacters) ? rawCharacters : []).map((character, index) => {
    const next = { ...character };
    const currentKey = `${next.col},${next.row}`;

    if (!isCharacterTooFarFromVillageCore(next) && !used.has(currentKey)) {
      used.add(currentKey);
      return next;
    }

    const fallback = slots[index % slots.length];
    let chosen = fallback;

    for (const slot of slots) {
      const key = `${slot.col},${slot.row}`;
      if (!used.has(key)) {
        chosen = slot;
        break;
      }
    }

    next.col = chosen.col;
    next.row = chosen.row;
    used.add(`${chosen.col},${chosen.row}`);
    return next;
  });
}

function createDecoration(subtype) {
  const sizeMap = { grass: 34, tree: 62, flower: 30 };

  return {
    id: `${subtype}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    type: subtype,
    image: getDecorationImage(subtype),
    col: Math.floor(randomBetween(1, GRID_COLS - 2)),
    row: Math.floor(randomBetween(1, GRID_ROWS - 2)),
    flipped: false,
    size: sizeMap[subtype] || 32,
  };
}

function createCharacter(type) {
  const spawnSlots = getCharacterSpawnSlots();
  const spawn = spawnSlots[Math.floor(randomBetween(0, spawnSlots.length))] || { col: 10, row: 12 };

  return {
    id: `${type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    name: type === 'alpaca' ? '파카' : type === 'platypus' ? '너구' : '루',
    type,
    image: getCharacterImage(type),
    col: spawn.col,
    row: spawn.row,
    size: type === 'alpaca' ? 56 : 52,
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
      col: layoutMap.exercise?.col ?? 6,
      row: layoutMap.exercise?.row ?? 10,
      flipped: !!layoutMap.exercise?.flipped,
      w: 112,
      h: 90,
    },
    {
      id: 'study_building',
      category: 'study',
      label: `도서관 Lv.${getStage(studyLevel)}`,
      image: getBuilding('study', getStage(studyLevel)),
      col: layoutMap.study?.col ?? 9,
      row: layoutMap.study?.row ?? 11,
      flipped: !!layoutMap.study?.flipped,
      w: 112,
      h: 90,
    },
    {
      id: 'mental_building',
      category: 'mental',
      label: `명상숲 Lv.${getStage(mentalLevel)}`,
      image: getBuilding('mental', getStage(mentalLevel)),
      col: layoutMap.mental?.col ?? 12,
      row: layoutMap.mental?.row ?? 9,
      flipped: !!layoutMap.mental?.flipped,
      w: 112,
      h: 90,
    },
    {
      id: 'daily_building',
      category: 'daily',
      label: `생활공방 Lv.${getStage(dailyLevel)}`,
      image: getBuilding('daily', getStage(dailyLevel)),
      col: layoutMap.daily?.col ?? 15,
      row: layoutMap.daily?.row ?? 8,
      flipped: !!layoutMap.daily?.flipped,
      w: 112,
      h: 90,
    },
  ];
}

/* =========================
   타일 / 경계숲 생성
========================= */
function getTileImageByKind(kind) {
  if (kind === TILE_KIND.PATH) return pathTileImg;
  if (kind === TILE_KIND.VARIANT_GRASS) return variantGrassTileImg;
  return baseGrassTileImg;
}

function isPathTile(col, row) {
  const pathA = Math.abs((col - row) - 1) <= 0;
  const pathB = row >= 9 && row <= 12 && col >= 8 && col <= 11;
  const pathC = row >= 4 && row <= 8 && col - row === 3;
  return pathA || pathB || pathC;
}

function getGrassVariant(col, row) {
  const seed = (col * 17 + row * 29) % 7;
  return seed === 0 || seed === 3 ? TILE_KIND.VARIANT_GRASS : TILE_KIND.BASE_GRASS;
}

function buildTileMap(cols, rows, padding = OUTER_TILE_PADDING) {
  const tiles = [];

  for (let row = -padding; row < rows + padding; row += 1) {
    for (let col = -padding; col < cols + padding; col += 1) {
      const isMainGrid = col >= 0 && row >= 0 && col < cols && row < rows;
      const kind = isMainGrid && isPathTile(col, row) ? TILE_KIND.PATH : getGrassVariant(col, row);

      tiles.push({
        id: `tile-${col}-${row}`,
        col,
        row,
        kind,
      });
    }
  }

  return tiles;
}

function buildBorderTrees() {
  const result = [];
  let idCounter = 0;

  const treeSizeFromSeed = (seed, depth = 0) => {
    const r = pseudoRandom(seed + depth * 17);
    return Math.round(228 + r * 108 - depth * 6);
  };

  const bushWidthFromSeed = (seed, depth = 0) => {
    const r = pseudoRandom(seed + depth * 23);
    return Math.round(92 + r * 42 - depth * 3);
  };

  const treeImageFromSeed = (seed) => {
    const idx =
      Math.floor(pseudoRandom(seed + 11) * BORDER_TREE_IMAGES.length) %
      BORDER_TREE_IMAGES.length;
    return BORDER_TREE_IMAGES[idx];
  };

  const bushImageFromSeed = (seed) => {
    const idx =
      Math.floor(pseudoRandom(seed + 13) * BORDER_BUSH_IMAGES.length) %
      BORDER_BUSH_IMAGES.length;
    return BORDER_BUSH_IMAGES[idx];
  };

  const flipFromSeed = (seed) => pseudoRandom(seed + 33) > 0.5;
  const opacityFromSeed = (seed) => 0.9 + pseudoRandom(seed + 57) * 0.1;
  const rotationFromSeed = (seed, amount = 5) =>
    (pseudoRandom(seed + 71) - 0.5) * amount;

  const pushTree = (col, row, options = {}) => {
    const {
      offsetX = 0,
      offsetY = 0,
      depth = 0,
      extraWidth = 0,
      zBoost = 0,
      region = '',
    } = options;

    const seed = col * 1000 + row * 100 + depth * 17 + extraWidth + zBoost;
    const pos = gridToScreen(col, row);

    result.push({
      id: `border-tree-${idCounter++}`,
      kind: 'tree',
      region,
      col,
      row,
      x: pos.x + offsetX + (pseudoRandom(seed + 5) - 0.5) * 34,
      y: pos.y + offsetY + (pseudoRandom(seed + 9) - 0.5) * 26,
      width: treeSizeFromSeed(seed, depth) + extraWidth,
      image: treeImageFromSeed(seed),
      flipped: flipFromSeed(seed),
      opacity: opacityFromSeed(seed),
      rotation: rotationFromSeed(seed, 5),
      zIndex: 60 + (row + OUTER_TILE_PADDING + 10) * 10 + depth * 4 + col + zBoost,
    });
  };

  const pushBush = (col, row, options = {}) => {
    const {
      offsetX = 0,
      offsetY = 0,
      depth = 0,
      extraWidth = 0,
      zBoost = 0,
      region = '',
    } = options;

    const seed = col * 1200 + row * 140 + depth * 19 + extraWidth + zBoost;
    const pos = gridToScreen(col, row);

    result.push({
      id: `border-bush-${idCounter++}`,
      kind: 'bush',
      region,
      col,
      row,
      x: pos.x + offsetX + (pseudoRandom(seed + 3) - 0.5) * 18,
      y: pos.y + offsetY + (pseudoRandom(seed + 7) - 0.5) * 10,
      width: bushWidthFromSeed(seed, depth) + extraWidth,
      image: bushImageFromSeed(seed),
      flipped: flipFromSeed(seed),
      opacity: 0.92 + pseudoRandom(seed + 29) * 0.08,
      rotation: rotationFromSeed(seed, 2.2),
      zIndex: 120 + (row + OUTER_TILE_PADDING + 10) * 10 + depth * 4 + col + zBoost,
    });
  };

  const pushTreeCluster = (
    centerCol,
    centerRow,
    radius = 3,
    depthBase = 0,
    spreadX = 18,
    spreadY = 12,
    region = ''
  ) => {
    for (let row = centerRow - radius; row <= centerRow + radius; row += 1) {
      for (let col = centerCol - radius; col <= centerCol + radius; col += 1) {
        const distance = Math.abs(col - centerCol) + Math.abs(row - centerRow);
        if (distance > radius + 1) continue;

        pushTree(col, row, {
          offsetX: (col - centerCol) * spreadX,
          offsetY: (row - centerRow) * spreadY,
          depth: depthBase + distance,
          extraWidth: Math.max(0, 34 - distance * 7),
          zBoost: radius - distance,
          region,
        });
      }
    }
  };

  const pushBushCluster = (
    centerCol,
    centerRow,
    radius = 3,
    depthBase = 0,
    spreadX = 14,
    spreadY = 8,
    region = ''
  ) => {
    for (let row = centerRow - radius; row <= centerRow + radius; row += 1) {
      for (let col = centerCol - radius; col <= centerCol + radius; col += 1) {
        const distance = Math.abs(col - centerCol) + Math.abs(row - centerRow);
        if (distance > radius + 1) continue;

        pushBush(col, row, {
          offsetX: (col - centerCol) * spreadX,
          offsetY: (row - centerRow) * spreadY,
          depth: depthBase + distance,
          extraWidth: Math.max(0, 18 - distance * 4),
          zBoost: radius - distance,
          region,
        });
      }
    }
  };

  for (let col = -OUTER_TILE_PADDING - 2; col <= GRID_COLS + OUTER_TILE_PADDING + 1; col += 1) {
    pushTree(col, -4, { offsetY: -96, depth: 0, extraWidth: 58, region: 'top' });
    pushTree(col, -3, { offsetY: -56, depth: 1, extraWidth: 36, region: 'top' });
    pushTree(col, -2, { offsetY: -16, depth: 2, extraWidth: 16, region: 'top' });

    if (col % 2 === 0) {
      pushTree(col, -5, {
        offsetX: 24,
        offsetY: -132,
        depth: 3,
        extraWidth: 18,
        region: 'top',
      });
    }
  }

  for (let row = -OUTER_TILE_PADDING - 2; row <= GRID_ROWS + OUTER_TILE_PADDING + 1; row += 1) {
    pushTree(-5, row, { offsetX: -164, offsetY: -12, depth: 0, extraWidth: 64, region: 'left' });
    pushTree(-4, row, { offsetX: -118, offsetY: -6, depth: 1, extraWidth: 42, region: 'left' });
    pushTree(-3, row, { offsetX: -72, depth: 2, extraWidth: 20, region: 'left' });
    pushTree(-2, row, { offsetX: -26, depth: 3, extraWidth: 8, region: 'left' });
  }

  for (let row = -OUTER_TILE_PADDING - 2; row <= GRID_ROWS + OUTER_TILE_PADDING + 1; row += 1) {
    const isBottomRightZone = row >= GRID_ROWS - 12;

    if (isBottomRightZone) {
      pushBush(GRID_COLS + 1, row, {
        offsetX: 18,
        offsetY: 18,
        depth: 0,
        extraWidth: 28,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 2, row, {
        offsetX: 64,
        offsetY: 34,
        depth: 1,
        extraWidth: 26,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 3, row, {
        offsetX: 112,
        offsetY: 54,
        depth: 2,
        extraWidth: 24,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 4, row, {
        offsetX: 164,
        offsetY: 78,
        depth: 3,
        extraWidth: 20,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 5, row, {
        offsetX: 214,
        offsetY: 102,
        depth: 4,
        extraWidth: 16,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 6, row, {
        offsetX: 262,
        offsetY: 126,
        depth: 5,
        extraWidth: 12,
        zBoost: 3,
        region: 'right-bottom',
      });
    } else {
      pushTree(GRID_COLS + 1, row, { offsetX: 30, depth: 0, extraWidth: 12, region: 'right' });
      pushTree(GRID_COLS + 2, row, { offsetX: 78, depth: 1, extraWidth: 26, region: 'right' });
      pushTree(GRID_COLS + 3, row, { offsetX: 126, depth: 2, extraWidth: 42, region: 'right' });
      pushTree(GRID_COLS + 4, row, {
        offsetX: 172,
        offsetY: -10,
        depth: 3,
        extraWidth: 62,
        region: 'right',
      });
    }
  }

  for (let col = -OUTER_TILE_PADDING - 2; col <= GRID_COLS + OUTER_TILE_PADDING + 1; col += 1) {
    pushBush(col, GRID_ROWS + 1, { offsetY: 26, depth: 0, extraWidth: 24, region: 'bottom' });
    pushBush(col, GRID_ROWS + 2, { offsetY: 54, depth: 1, extraWidth: 16, region: 'bottom' });

    if (col % 2 === 0) {
      pushBush(col, GRID_ROWS + 3, {
        offsetX: 12,
        offsetY: 80,
        depth: 2,
        extraWidth: 8,
        region: 'bottom',
      });
    }
  }

  pushTreeCluster(-6, -6, 5, 0, 24, 16, 'top-left');
  pushTreeCluster(GRID_COLS + 5, -6, 5, 0, 24, 16, 'top-right');
  pushBushCluster(-6, GRID_ROWS + 5, 5, 0, 20, 12, 'bottom-left');
  pushBushCluster(GRID_COLS + 5, GRID_ROWS + 5, 5, 0, 20, 12, 'bottom-right');
  pushBushCluster(GRID_COLS + 7, GRID_ROWS + 6, 6, 0, 22, 14, 'bottom-right');
  pushBushCluster(GRID_COLS + 8, GRID_ROWS + 3, 5, 1, 20, 12, 'bottom-right');
  pushBushCluster(GRID_COLS + 9, GRID_ROWS + 7, 5, 1, 22, 14, 'bottom-right');
  pushBushCluster(GRID_COLS + 10, GRID_ROWS + 4, 4, 2, 18, 10, 'bottom-right');

  pushTreeCluster(-7, -1, 4, 1, 20, 14, 'top-left-side');
  pushTreeCluster(GRID_COLS + 6, -1, 4, 1, 20, 14, 'top-right-side');
  pushBushCluster(-7, GRID_ROWS + 1, 4, 1, 18, 10, 'bottom-left-side');
  pushBushCluster(GRID_COLS + 6, GRID_ROWS + 1, 4, 1, 18, 10, 'bottom-right-side');
  pushBushCluster(GRID_COLS + 8, GRID_ROWS + 2, 5, 1, 20, 12, 'bottom-right-side');
  pushBushCluster(GRID_COLS + 11, GRID_ROWS + 1, 6, 0, 22, 12, 'bottom-right-side');
  pushBushCluster(GRID_COLS + 12, GRID_ROWS + 4, 5, 1, 22, 12, 'bottom-right-side');
  pushBushCluster(GRID_COLS + 13, GRID_ROWS - 1, 4, 1, 20, 10, 'bottom-right-side');
  pushBushCluster(GRID_COLS + 9, GRID_ROWS - 2, 4, 1, 18, 10, 'bottom-right-side');

  for (let col = -OUTER_TILE_PADDING - 4; col <= 2; col += 1) {
    pushBush(col, GRID_ROWS + 4, {
      offsetX: -8,
      offsetY: 98,
      depth: 2,
      extraWidth: 12,
      region: 'bottom-left-fill',
    });
  }

  for (let col = GRID_COLS - 2; col <= GRID_COLS + OUTER_TILE_PADDING + 4; col += 1) {
    pushBush(col, GRID_ROWS + 4, {
      offsetX: 8,
      offsetY: 98,
      depth: 2,
      extraWidth: 12,
      region: 'bottom-right-fill',
    });
  }

  const bottomRightStart = gridToScreen(GRID_COLS - 5, GRID_ROWS - 11);
  const bottomRightHardStart = gridToScreen(GRID_COLS - 2, GRID_ROWS - 8);
  const bottomRightDeepStart = gridToScreen(GRID_COLS + 1, GRID_ROWS - 5);

  const cleaned = result.filter((item) => {
    if (item.kind !== 'tree') return true;

    const isRightVisualZone =
      item.x >= bottomRightStart.x - 10 &&
      item.y >= bottomRightStart.y - 150;

    const isHardBottomRight =
      item.x >= bottomRightHardStart.x - 60 &&
      item.y >= bottomRightHardStart.y - 220;

    const isDeepBottomRight =
      item.x >= bottomRightDeepStart.x - 120 &&
      item.y >= bottomRightDeepStart.y - 260;

    if (isRightVisualZone) return false;
    if (isHardBottomRight) return false;
    if (isDeepBottomRight) return false;

    return true;
  });

  return cleaned.sort((a, b) => a.zIndex - b.zIndex);
}

function getWorldPanBounds(viewportWidth, viewportHeight, scale) {
  const minVisibleX = -WORLD_EDGE_MARGIN_LEFT;
  const maxVisibleX = WORLD_WIDTH + WORLD_EDGE_MARGIN_RIGHT;
  const minVisibleY = -WORLD_EDGE_MARGIN_TOP;
  const maxVisibleY = WORLD_HEIGHT + WORLD_EDGE_MARGIN_BOTTOM;

  const minOffsetX = viewportWidth - maxVisibleX * scale;
  const maxOffsetX = -minVisibleX * scale;
  const minOffsetY = viewportHeight - maxVisibleY * scale;
  const maxOffsetY = -minVisibleY * scale;

  return { minOffsetX, maxOffsetX, minOffsetY, maxOffsetY };
}

function getPlayableDiamondBounds() {
  const top = gridToScreen(0, 0);
  const right = gridToScreen(GRID_COLS - 1, 0);
  const left = gridToScreen(0, GRID_ROWS - 1);
  const bottom = gridToScreen(GRID_COLS - 1, GRID_ROWS - 1);

  return {
    centerX: GRID_ORIGIN_X,
    centerY: (top.y + bottom.y) / 2,
    radiusX: GRID_ORIGIN_X - left.x + VIEW_DIAMOND_CORNER_LIMIT_X,
    radiusY: ((bottom.y - top.y) / 2) + VIEW_DIAMOND_CORNER_LIMIT_Y,
  };
}

function projectPointIntoDiamond(point, diamond) {
  const dx = point.x - diamond.centerX;
  const dy = point.y - diamond.centerY;
  const normalized = Math.abs(dx) / diamond.radiusX + Math.abs(dy) / diamond.radiusY;

  if (normalized <= 1) return null;

  const scaleDown = 1 / normalized;
  return {
    x: diamond.centerX + dx * scaleDown,
    y: diamond.centerY + dy * scaleDown,
  };
}

function getViewportWorldCorners(offset, viewportWidth, viewportHeight, scale) {
  return [
    { x: (0 - offset.x) / scale, y: (0 - offset.y) / scale },
    { x: (viewportWidth - offset.x) / scale, y: (0 - offset.y) / scale },
    { x: (viewportWidth - offset.x) / scale, y: (viewportHeight - offset.y) / scale },
    { x: (0 - offset.x) / scale, y: (viewportHeight - offset.y) / scale },
  ];
}

function clampWorldOffsetToDiamond(nextOffset, viewportWidth, viewportHeight, scale) {
  let corrected = { ...nextOffset };
  const diamond = getPlayableDiamondBounds();

  for (let i = 0; i < 10; i += 1) {
    const corners = getViewportWorldCorners(corrected, viewportWidth, viewportHeight, scale);
    const corrections = [];

    corners.forEach((corner) => {
      const projected = projectPointIntoDiamond(corner, diamond);
      if (!projected) return;

      corrections.push({
        x: -(projected.x - corner.x) * scale,
        y: -(projected.y - corner.y) * scale,
      });
    });

    if (!corrections.length) break;

    const avgCorrection = corrections.reduce(
      (acc, item) => ({
        x: acc.x + item.x / corrections.length,
        y: acc.y + item.y / corrections.length,
      }),
      { x: 0, y: 0 }
    );

    corrected = {
      x: corrected.x + avgCorrection.x,
      y: corrected.y + avgCorrection.y,
    };

    const rectBounds = getWorldPanBounds(viewportWidth, viewportHeight, scale);
    corrected = {
      x: clamp(corrected.x, rectBounds.minOffsetX, rectBounds.maxOffsetX),
      y: clamp(corrected.y, rectBounds.minOffsetY, rectBounds.maxOffsetY),
    };
  }

  return corrected;
}

function clampWorldOffset(nextOffset, viewportWidth, viewportHeight, scale) {
  const { minOffsetX, maxOffsetX, minOffsetY, maxOffsetY } = getWorldPanBounds(
    viewportWidth,
    viewportHeight,
    scale
  );

  const rectClamped = {
    x: clamp(nextOffset.x, minOffsetX, maxOffsetX),
    y: clamp(nextOffset.y, minOffsetY, maxOffsetY),
  };

  return clampWorldOffsetToDiamond(rectClamped, viewportWidth, viewportHeight, scale);
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

function TitleUnlockModal({ title, onClose, onEquip }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 px-5">
      <div
        className="w-full max-w-sm rounded-3xl p-5 shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #fff6df 0%, #f5e3b8 100%)',
          border: '2px solid #c89b45',
        }}
      >
        <div className="text-center">
          <div className="mb-2 text-sm font-bold" style={{ color: '#8a5a17' }}>
            ✨ 새로운 칭호 획득
          </div>

          <div
            className="mb-3 inline-flex rounded-full px-4 py-2 text-lg font-extrabold"
            style={{
              background: 'rgba(255,255,255,0.55)',
              color: '#4a2c08',
              border: '1px solid rgba(138,90,23,0.15)',
            }}
          >
            {title.name}
          </div>

          <p className="mb-5 text-sm" style={{ color: '#7a5020' }}>
            {title.description}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-2xl text-sm font-bold"
              style={{
                background: '#fff',
                border: '1px solid #d8c08e',
                color: '#7a5020',
              }}
            >
              닫기
            </button>

            <button
              type="button"
              onClick={onEquip}
              className="h-11 flex-1 rounded-2xl text-sm font-bold"
              style={{
                background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)',
                color: '#fff8e8',
                border: '2px solid #6b4e15',
              }}
            >
              대표 칭호 장착
            </button>
          </div>
        </div>
      </div>
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
  inventoryCharacters,
  inventoryDecorations,
  onClose,
  onPlaceItem,
}) {
  if (!open) return null;

  const items = activeTab === 'character' ? inventoryCharacters : inventoryDecorations;

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
              보관 중인 캐릭터와 꾸미기
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-[12px] font-extrabold"
            style={{ background: '#fff', border: '1px solid rgba(160,120,64,0.14)', color: '#4a2c08' }}
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
              background: activeTab === 'character' ? 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)' : '#fff',
              color: activeTab === 'character' ? '#fff8e8' : '#4a2c08',
              border: activeTab === 'character' ? '2px solid #6b4e15' : '1px solid rgba(160,120,64,0.14)',
            }}
          >
            캐릭터 {inventoryCharacters.length}
          </button>
          <button
            type="button"
            onClick={() => onTabChange('decoration')}
            className="h-11 flex-1 rounded-2xl text-sm font-extrabold"
            style={{
              background: activeTab === 'decoration' ? 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)' : '#fff',
              color: activeTab === 'decoration' ? '#fff8e8' : '#4a2c08',
              border: activeTab === 'decoration' ? '2px solid #6b4e15' : '1px solid rgba(160,120,64,0.14)',
            }}
          >
            꾸미기 {inventoryDecorations.length}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {items.length === 0 ? (
            <div className="col-span-2 rounded-2xl px-4 py-6 text-center text-sm" style={{ background: '#fffdf8', border: '1px solid rgba(160,120,64,0.14)', color: '#8a5a17' }}>
              가방에 보관된 아이템이 없어요.
            </div>
          ) : items.map((item) => {
            const itemImage = item.type === 'character' ? getCharacterImage(item.subtype) : getDecorationImage(item.subtype);
            return (
              <div key={item.id} className="rounded-2xl p-3" style={{ background: '#fffdf8', border: '1px solid rgba(160,120,64,0.14)' }}>
                <div className="flex h-[68px] items-center justify-center">
                  <img src={itemImage} alt={item.label} draggable={false} style={{ maxHeight: '64px', maxWidth: '100%', objectFit: 'contain', display: 'block', background: 'transparent' }} />
                </div>
                <div className="mt-2 text-[14px] font-extrabold" style={{ color: '#4a2c08' }}>{item.label}</div>
                <div className="text-[12px]" style={{ color: '#8a5a17' }}>{item.type === 'character' ? '캐릭터' : '꾸미기'}</div>
                <button
                  type="button"
                  onClick={() => onPlaceItem(item)}
                  className="mt-3 h-10 w-full rounded-2xl text-sm font-extrabold"
                  style={{ background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)', color: '#fff8e8', border: '2px solid #6b4e15' }}
                >
                  마을에 꺼내기
                </button>
              </div>
            );
          })}
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
  onStoreSelected,
  canSave = true,
}) {
  const canStore =
    selectedObject &&
    (selectedObject.type === 'character' || selectedObject.type === 'decoration');

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={isEditMode && !canSave}
          onClick={isEditMode ? onSave : onToggleEditMode}
          className="pointer-events-auto rounded-full px-3 py-2 text-[12px] font-extrabold"
          style={{
            background: isEditMode
              ? canSave
                ? 'linear-gradient(180deg, #d97a5c 0%, #c25c3c 100%)'
                : '#d9d1c4'
              : 'rgba(255,248,232,0.92)',
            color: isEditMode ? '#fff8e8' : '#4a2c08',
            border: isEditMode ? '2px solid #7f321d' : '1px solid rgba(107,78,21,0.14)',
            boxShadow: '0 8px 16px rgba(50,30,0,0.08)',
            opacity: isEditMode && !canSave ? 0.65 : 1,
          }}
        >
          {isEditMode ? (canSave ? '저장' : '배치 불가') : '편집모드'}
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
              disabled={!canStore}
              onClick={onStoreSelected}
              className="rounded-full px-3 py-2 text-[12px] font-extrabold"
              style={{
                background: !canStore ? '#efe7d8' : '#fff',
                color: !canStore ? '#a19380' : '#4a2c08',
                border: '1px solid rgba(107,78,21,0.14)',
                boxShadow: '0 8px 16px rgba(50,30,0,0.08)',
              }}
            >
              가방에 넣기
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
  onOpenShop,
  onOpenBag,
  onToggleOverview,
  isOverview,
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
          <div className="flex items-center gap-2">
            <div className="text-[11px] font-bold" style={{ color: '#8a5a17' }}>{nickname}</div>
            <div className="rounded-full px-2 py-0.5 text-[11px] font-extrabold" style={{ background: 'rgba(196,154,74,0.16)', color: '#6f4a12', border: '1px solid rgba(196,154,74,0.2)' }}>Lv.{level}</div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <div className="rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: 'rgba(255,248,232,0.9)', color: '#4a2c08', border: '1px solid rgba(107,78,21,0.14)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>
            포인트 {points}
          </div>
          <button type="button" onClick={onToggleOverview} className="rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: '#fff', color: '#4a2c08', border: '1px solid rgba(107,78,21,0.14)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>
            {isOverview ? '확대' : '전체보기'}
          </button>
          <button type="button" onClick={onOpenBag} className="rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: '#fff', color: '#4a2c08', border: '1px solid rgba(107,78,21,0.14)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>가방</button>
          <button type="button" onClick={onOpenShop} className="rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: '#fff', color: '#4a2c08', border: '1px solid rgba(107,78,21,0.14)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>상점</button>
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
      }}
    />
  );
}

function VillageWorldLayer({
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
  onOpenShop,
  onOpenBag,
  onToggleEditMode,
  onFlipSelected,
  onSaveEdit,
  onCancelEdit,
  onStoreSelected,
  isOverview,
  onToggleOverview,
  placementPreview,
  setPlacementPreview,
}) {
  const dragRef = useRef(null);
  const viewportRef = useRef(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: WORLD_VIEWPORT_HEIGHT });
  const [offset, setOffset] = useState({ x: -980, y: -120 });

  const scale = isOverview ? 0.56 : 0.92;

  const buildings = useMemo(
    () => buildWorldBuildings({ userLevels, buildingLayout }),
    [userLevels, buildingLayout]
  );

  const currentCollisionBuildings = useMemo(() => {
    return buildWorldBuildings({ userLevels, buildingLayout }).map((item) => ({
      ...item,
      category: item.category,
    }));
  }, [userLevels, buildingLayout]);

  const tileMap = useMemo(() => buildTileMap(GRID_COLS, GRID_ROWS, OUTER_TILE_PADDING), []);
  const borderTrees = useMemo(() => buildBorderTrees(), []);

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

    setSelectedObject({ type: objType, id: objId });

    let sourceItem = null;

    if (objType === 'decoration') {
      sourceItem = decorations.find((item) => item.id === objId) || null;
    } else if (objType === 'character') {
      sourceItem = characters.find((item) => item.id === objId) || null;
    } else if (objType === 'building') {
      sourceItem = buildingLayout.find((item) => item.category === objId) || null;
    }

    dragRef.current = {
      mode: 'object',
      objectType: objType,
      objectId: objId,
      startX: e.clientX,
      startY: e.clientY,
      startCol: sourceItem?.col ?? 0,
      startRow: sourceItem?.row ?? 0,
    };
  };

  const handlePointerMove = useCallback((e) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.mode === 'pan') {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      setOffset(
        clampWorldOffset(
          {
            x: drag.originX + dx,
            y: drag.originY + dy,
          },
          viewportSize.width,
          viewportSize.height,
          scale
        )
      );
      return;
    }

    if (drag.mode === 'object') {
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;

      const startScreen = gridToScreen(drag.startCol, drag.startRow);
      const previewX = startScreen.x + dx;
      const previewY = startScreen.y + dy;
      const { col, row } = screenToGrid(previewX, previewY);

      let previewItem = null;

      if (drag.objectType === 'decoration') {
        previewItem = decorations.find((item) => item.id === drag.objectId) || null;
      }
      if (drag.objectType === 'character') {
        previewItem = characters.find((item) => item.id === drag.objectId) || null;
      }
      if (drag.objectType === 'building') {
        previewItem = buildingLayout.find((item) => item.category === drag.objectId) || null;
      }

      if (previewItem) {
        const previewValid = canPlaceObject({
          movingType: drag.objectType,
          movingItem: previewItem,
          nextCol: col,
          nextRow: row,
          decorations,
          characters,
          buildings: drag.objectType === 'building' ? buildingLayout : currentCollisionBuildings,
        });

        setPlacementPreview({
          type: drag.objectType,
          col,
          row,
          item: previewItem,
          valid: previewValid,
        });
      }

      if (drag.objectType === 'decoration') {
        setDecorations((prev) =>
          prev.map((item) => {
            if (item.id !== drag.objectId) return item;

            const canPlace = canPlaceObject({
              movingType: 'decoration',
              movingItem: item,
              nextCol: col,
              nextRow: row,
              decorations: prev,
              characters,
              buildings: currentCollisionBuildings,
            });

            if (!canPlace) return item;
            return { ...item, col, row };
          })
        );
      }

      if (drag.objectType === 'character') {
        setCharacters((prev) =>
          prev.map((item) => {
            if (item.id !== drag.objectId) return item;

            const canPlace = canPlaceObject({
              movingType: 'character',
              movingItem: item,
              nextCol: col,
              nextRow: row,
              decorations,
              characters: prev,
              buildings: currentCollisionBuildings,
            });

            if (!canPlace) return item;
            return { ...item, col, row };
          })
        );
      }

      if (drag.objectType === 'building') {
        setBuildingLayout((prev) =>
          prev.map((item) => {
            if (item.category !== drag.objectId) return item;

            const canPlace = canPlaceObject({
              movingType: 'building',
              movingItem: item,
              nextCol: col,
              nextRow: row,
              decorations,
              characters,
              buildings: prev,
            });

            if (!canPlace) return item;
            return { ...item, col, row };
          })
        );
      }

      dragRef.current = {
        ...drag,
        startX: e.clientX,
        startY: e.clientY,
        startCol: col,
        startRow: row,
      };
    }
  }, [scale, viewportSize.width, viewportSize.height, decorations, characters, currentCollisionBuildings, setDecorations, setCharacters, setBuildingLayout, buildingLayout, setPlacementPreview]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setPlacementPreview(null);
  }, [setPlacementPreview]);

  useEffect(() => {
    const updateViewportSize = () => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      setViewportSize({
        width: rect.width,
        height: rect.height || WORLD_VIEWPORT_HEIGHT,
      });
    };

    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
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
    if (!viewportSize.width) return;
    setOffset((prev) => clampWorldOffset(prev, viewportSize.width, viewportSize.height, scale));
  }, [viewportSize, scale]);

  useEffect(() => {
    if (isEditMode) return;

    const timer = setInterval(() => {
      setCharacters((prev) =>
        prev.map((npc) => {
          const nextCol = clamp(npc.col + Math.round(randomBetween(-1, 1)), 0, GRID_COLS - 1);
          const nextRow = clamp(npc.row + Math.round(randomBetween(-1, 1)), 0, GRID_ROWS - 1);

          const canPlace = canPlaceObject({
            movingType: 'character',
            movingItem: npc,
            nextCol,
            nextRow,
            decorations,
            characters: prev,
            buildings: currentCollisionBuildings,
          });

          return {
            ...npc,
            col: canPlace ? nextCol : npc.col,
            row: canPlace ? nextRow : npc.row,
            flipped: randomBetween(0, 1) > 0.5 ? !npc.flipped : npc.flipped,
          };
        })
      );
    }, 2400);

    return () => clearInterval(timer);
  }, [isEditMode, setCharacters, decorations, currentCollisionBuildings]);

  return (
    <div
      className="sticky top-0 z-40 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(248,241,223,0.98) 0%, rgba(245,232,201,0.95) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="px-4 pt-3 pb-2">
        <div
          ref={viewportRef}
          className="relative overflow-hidden rounded-[28px]"
          style={{
            height: WORLD_VIEWPORT_HEIGHT,
            border: '1px solid rgba(160,120,64,0.18)',
            boxShadow: '0 12px 24px rgba(80,50,10,0.08)',
            background: 'linear-gradient(180deg, #cfe8ff 0%, #eef8ff 26%, #dfeec5 60%, #cfe1a6 100%)',
          }}
        >
          <VillageOverlayBar
            nickname={nickname}
            level={totalLevel}
            points={points}
            onOpenShop={onOpenShop}
            onOpenBag={onOpenBag}
            onToggleOverview={onToggleOverview}
            isOverview={isOverview}
          />

          <EditToolbar
            isEditMode={isEditMode}
            selectedObject={selectedObject}
            onToggleEditMode={onToggleEditMode}
            onFlip={onFlipSelected}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            onStoreSelected={onStoreSelected}
            canSave={!placementPreview || placementPreview.valid}
          />

          <div className="absolute inset-0 touch-none overflow-hidden" onPointerDown={handleWorldPointerDown}>
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
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 12%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 28%), linear-gradient(180deg, #cfe8ff 0%, #eef8ff 24%, #d9ecbd 56%, #c4dd92 100%)',
                }}
              />

              {tileMap.map((tile) => {
                const pos = gridToScreen(tile.col, tile.row);
                const tileImg = getTileImageByKind(tile.kind);

                return (
                  <img
                    key={tile.id}
                    src={tileImg}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute select-none"
                    style={{
                      left: pos.x - TILE_W / 2,
                      top: pos.y - TILE_H / 2,
                      width: TILE_W,
                      height: TILE_H,
                      objectFit: 'contain',
                      userSelect: 'none',
                      WebkitUserDrag: 'none',
                    }}
                  />
                );
              })}

              {borderTrees.map((tree) => (
                <img
                  key={tree.id}
                  src={tree.image}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute select-none"
                  style={{
                    left: tree.x,
                    top: tree.y,
                    width: tree.width,
                    height: 'auto',
                    transform: `translate(-50%, -100%) scaleX(${tree.flipped ? -1 : 1}) rotate(${tree.rotation ?? 0}deg)`,
                    transformOrigin: 'bottom center',
                    zIndex: tree.zIndex,
                    opacity: tree.opacity ?? 1,
                    userSelect: 'none',
                    WebkitUserDrag: 'none',
                  }}
                />
              ))}

              {isEditMode && placementPreview
                ? getPreviewTiles(
                    placementPreview.item,
                    placementPreview.type,
                    placementPreview.col,
                    placementPreview.row
                  ).map((tile) => {
                    const pos = gridToScreen(tile.col, tile.row);
                    const color = getPreviewColor(placementPreview.valid);

                    return (
                      <div
                        key={`preview-${tile.col}-${tile.row}`}
                        className="absolute pointer-events-none"
                        style={{
                          left: pos.x - TILE_W / 2,
                          top: pos.y - TILE_H / 2,
                          width: TILE_W,
                          height: TILE_H,
                          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                          border: color.border,
                          background: color.background,
                          boxSizing: 'border-box',
                          zIndex: 2000,
                        }}
                      />
                    );
                  })
                : null}

              {decorations.map((item) => {
                const isSelected = selectedObject?.type === 'decoration' && selectedObject?.id === item.id;
                const pos = getObjectScreenPosition(item, 'decoration');

                return (
                  <div
                    key={item.id}
                    className="absolute"
                    onPointerDown={(e) => startObjectDrag(e, 'decoration', item.id)}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      transform: `translate(-50%, -100%) scaleX(${item.flipped ? -1 : 1})`,
                      outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none',
                      outlineOffset: '3px',
                      borderRadius: '999px',
                      cursor: isEditMode ? 'grab' : 'default',
                      zIndex: 3000 + item.row,
                    }}
                  >
                    <DecorationSprite item={item} />
                  </div>
                );
              })}

              {buildings.map((building) => {
                const isSelected = selectedObject?.type === 'building' && selectedObject?.id === building.category;
                const pos = getObjectScreenPosition(building, 'building');

                return (
                  <div
                    key={building.id}
                    className="absolute"
                    onPointerDown={(e) => startObjectDrag(e, 'building', building.category)}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: 225,
                      height: 180,
                      transform: `translate(-50%, -100%) scaleX(${building.flipped ? -1 : 1})`,
                      outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none',
                      outlineOffset: '4px',
                      borderRadius: '20px',
                      cursor: isEditMode ? 'grab' : 'default',
                      zIndex: 4000 + building.row,
                    }}
                  >
                    <img src={building.image} alt={building.label} className="h-full w-full object-contain" draggable={false} />
                  </div>
                );
              })}

              {characters.map((npc) => {
                const isSelected = selectedObject?.type === 'character' && selectedObject?.id === npc.id;
                const pos = getObjectScreenPosition(npc, 'character');

                return (
                  <div
                    key={npc.id}
                    className="absolute"
                    onPointerDown={(e) => startObjectDrag(e, 'character', npc.id)}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: npc.size,
                      height: npc.size,
                      transform: `translate(-50%, -100%) scaleX(${npc.flipped ? -1 : 1})`,
                      transition: isEditMode ? 'none' : 'left 2200ms ease-in-out, top 2200ms ease-in-out',
                      outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none',
                      outlineOffset: '3px',
                      borderRadius: '999px',
                      cursor: isEditMode ? 'grab' : 'default',
                      zIndex: 5000 + npc.row,
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
      const raw = guestDataPersistence.getData();
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
  const [newTitle, setNewTitle] = useState(null);

  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState('character');
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [bagTab, setBagTab] = useState('character');

  const [inventoryCharacters, setInventoryCharacters] = useState([]);
  const [inventoryDecorations, setInventoryDecorations] = useState([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [placementPreview, setPlacementPreview] = useState(null);

  const [decorations, setDecorations] = useState([]);
  const [characters, setCharacters] = useState(DEFAULT_VILLAGE_DATA.village_characters);
  const [buildingLayout, setBuildingLayout] = useState(DEFAULT_BUILDINGS);

  const originalVillageRef = useRef(null);
  const hasCategoryInteractionRef = useRef(false);
  const chainRepairOnceRef = useRef(false);
  const expPopupTimerRef = useRef(null);
  const pointPopupTimerRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => setGuestVersion((prev) => prev + 1);
    window.addEventListener('root-home-data-updated', handleUpdate);
    return () => window.removeEventListener('root-home-data-updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (!expPopup) return undefined;
    clearTimeout(expPopupTimerRef.current);
    expPopupTimerRef.current = setTimeout(() => setExpPopup(null), 1400);
    return () => clearTimeout(expPopupTimerRef.current);
  }, [expPopup]);

  useEffect(() => {
    if (!pointPopup) return undefined;
    clearTimeout(pointPopupTimerRef.current);
    pointPopupTimerRef.current = setTimeout(() => setPointPopup(null), 1400);
    return () => clearTimeout(pointPopupTimerRef.current);
  }, [pointPopup]);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 1000 * 30,
  });

  const isGuest = !user;

  const { data: guestData = {} } = useQuery({
    queryKey: ['guest-home-data', guestVersion],
    queryFn: () => readGuestData(),
    staleTime: 0,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', isGuest, guestVersion],
    enabled: !isUserLoading,
    queryFn: async () => {
      if (isGuest) {
        const rawGoals =
          Array.isArray(guestData?.goals) && guestData.goals.length > 0
            ? guestData.goals
            : guestData?.goalData
              ? [guestData.goalData]
              : [];
        return normalizeGuestGoals(rawGoals, guestData?.category || 'exercise');
      }
      return base44.entities.Goal.list('-created_date', 100);
    },
  });

  const { data: actionGoals = [] } = useQuery({
    queryKey: ['actionGoals', isGuest, guestVersion],
    enabled: !isUserLoading,
    queryFn: async () => {
      if (isGuest) {
        const normalizedGoals = normalizeGuestGoals(
          Array.isArray(guestData?.goals) && guestData.goals.length > 0
            ? guestData.goals
            : guestData?.goalData
              ? [guestData.goalData]
              : [],
          guestData?.category || 'exercise'
        );

        const rawActionGoals =
          Array.isArray(guestData?.actionGoals) && guestData.actionGoals.length > 0
            ? guestData.actionGoals
            : guestData?.actionGoalData
              ? [guestData.actionGoalData]
              : [];

        return normalizeGuestActionGoals(
          rawActionGoals,
          normalizedGoals,
          guestData?.category || normalizedGoals[0]?.category || 'exercise'
        );
      }
      return base44.entities.ActionGoal.list('-created_date', 200);
    },
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allLogs', isGuest, guestVersion],
    enabled: !isUserLoading,
    queryFn: async () => {
      if (isGuest) return guestData?.actionLogs || [];
      return base44.entities.ActionLog.list('-date', 500);
    },
  });

  const connectedActionGoals = useMemo(
    () => connectActionGoalsToGoals(goals, actionGoals),
    [goals, actionGoals]
  );

  useEffect(() => {
    if (!Array.isArray(actionGoals) || actionGoals.length === 0) return;
    if (chainRepairOnceRef.current) return;

    const needsRepair = actionGoals.some((goal) => {
      const resolved = resolveGoalIdForActionGoal(goal, goals, activeCategory);
      return !goal?.goal_id || goal.goal_id !== resolved;
    });

    if (!needsRepair) return;
    chainRepairOnceRef.current = true;

    if (isGuest) {
      writeGuestDataPatch((prev) => {
        const prevActionGoals = Array.isArray(prev?.actionGoals) ? prev.actionGoals : [];
        const repaired = prevActionGoals.map((goal) => ({
          ...goal,
          goal_id: resolveGoalIdForActionGoal(
            goal,
            goals,
            prev?.category || activeCategory || 'exercise'
          ),
        }));
        return {
          ...prev,
          actionGoals: repaired,
          actionGoalData: repaired[0] || prev?.actionGoalData || null,
        };
      });
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    const updates = actionGoals
      .map((goal) => ({
        id: goal?.id,
        currentGoalId: goal?.goal_id || null,
        nextGoalId: resolveGoalIdForActionGoal(
          goal,
          goals,
          user?.active_category || activeCategory || 'exercise'
        ),
      }))
      .filter((item) => item.id && item.nextGoalId && item.currentGoalId !== item.nextGoalId);

    if (updates.length === 0) return;

    Promise.all(
      updates.map((item) =>
        base44.entities.ActionGoal.update(item.id, {
          goal_id: item.nextGoalId,
        })
      )
    )
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      })
      .catch((error) => {
        console.error('Failed to repair actionGoal.goal_id:', error);
      });
  }, [actionGoals, goals, isGuest, activeCategory, queryClient, user]);

  useEffect(() => {
    const report = validateGoalActionLogChain(goals, connectedActionGoals, allLogs);
    if (
      report.actionGoalsWithoutGoalId > 0 ||
      report.logsWithoutGoalId > 0 ||
      report.logsWithUnknownActionGoal > 0 ||
      report.actionGoalsWithUnknownGoal > 0
    ) {
      console.warn('[Home] goal→actionGoal→log chain issue detected:', report);
    }
  }, [goals, connectedActionGoals, allLogs]);

  const userLevels = useMemo(() => {
    if (isGuest) return getDefaultUserLevels(guestData?.actionLogs || []);
    return getDefaultUserLevels(allLogs || []);
  }, [isGuest, guestData, allLogs]);

  const ownedTitleIds = useMemo(
    () => getOwnedTitleIds({ isGuest, user, guestData }),
    [isGuest, user, guestData, guestVersion]
  );

  useEffect(() => {
    ensureValidEquippedTitle({ isGuest, user, guestData, ownedTitleIds, queryClient })
      .then((nextGuest) => {
        if (!isGuest || !nextGuest) return;
        queryClient.removeQueries({ queryKey: ['guest-home-data'] });
        queryClient.removeQueries({ queryKey: ['guest-records-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-home-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-records-data'] });
        window.dispatchEvent(new Event('root-home-data-updated'));
        setGuestVersion((v) => v + 1);
      })
      .catch((error) => {
        console.error('ensureValidEquippedTitle error:', error);
      });
  }, [isGuest, ownedTitleIds, guestData, queryClient]);

  useEffect(() => {
    if (isUserLoading) return;

    const current = normalizeCategoryValue(activeCategory, 'exercise');

    if (isGuest) {
      const guestCategory = normalizeCategoryValue(
        guestData?.activeCategory ||
          guestData?.guest_active_category ||
          guestData?.category ||
          guestData?.goalData?.category ||
          guestData?.actionGoalData?.category ||
          guestData?.goals?.[0]?.category,
        'exercise'
      );

      if (!hasCategoryInteractionRef.current || !VALID_CATEGORIES.includes(current)) {
        setActiveCategory(guestCategory);
      }
      return;
    }

    const userCategory = normalizeCategoryValue(
      user?.active_category || goals?.[0]?.category,
      'exercise'
    );

    if (!hasCategoryInteractionRef.current || !VALID_CATEGORIES.includes(current)) {
      setActiveCategory(userCategory);
    }
  }, [isUserLoading, isGuest, guestData, user, goals, activeCategory]);

  useEffect(() => {
    const source = isGuest ? guestData : user;
    const village = getVillageState(source || {});

    setDecorations(
      (village.village_decorations || []).map((item) => ({
        ...item,
        image: getDecorationImage(item.type),
      }))
    );
    setCharacters(
      (village.village_characters || []).map((item) => ({
        ...item,
        image: getCharacterImage(item.type),
      }))
    );
    setBuildingLayout(village.village_buildings);
    setInventoryCharacters(village.village_inventory_characters || []);
    setInventoryDecorations(village.village_inventory_decorations || []);
    originalVillageRef.current = village;
  }, [isGuest, guestData, user]);

  const handleCategoryChange = async (category) => {
    const normalizedCategory = normalizeCategoryValue(category, 'exercise');
    hasCategoryInteractionRef.current = true;
    setActiveCategory(normalizedCategory);

    if (isGuest) {
      writeGuestDataPatch((prev) => ({
        ...prev,
        category: normalizedCategory,
        activeCategory: normalizedCategory,
        guest_active_category: normalizedCategory,
      }));
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    try {
      await base44.auth.updateMe({ active_category: normalizedCategory });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (error) {
      console.error(error);
    }
  };

  const activeGoals = useMemo(() => {
    return (goals || []).filter((goal) => {
      const goalCategory = normalizeCategoryValue(goal?.category, '');
      if (goalCategory !== activeCategory) return false;
      if (goal?.status && goal.status !== 'active') return false;
      return true;
    });
  }, [goals, activeCategory]);

  const activeGoal = activeGoals[0] || null;

  const activeActionGoals = useMemo(() => {
    const goalIds = new Set(activeGoals.map((goal) => goal.id));

    return (connectedActionGoals || []).filter((actionGoal) => {
      const actionCategory = normalizeCategoryValue(actionGoal?.category, '');
      if (actionCategory !== activeCategory) return false;
      if (
        actionGoal?.status &&
        actionGoal.status !== 'active' &&
        actionGoal.status !== 'completed'
      ) {
        return false;
      }
      if (!actionGoal?.goal_id) return false;
      if (goalIds.size === 0) return false;

      return goalIds.has(actionGoal.goal_id);
    });
  }, [connectedActionGoals, activeCategory, activeGoals]);

  const goalLogs = useMemo(() => {
    if (!activeGoal) return [];
    return (allLogs || []).filter((log) => log?.goal_id === activeGoal.id);
  }, [allLogs, activeGoal]);

  const today = getTodayString();
  const grouped = useMemo(() => groupActionGoals(activeActionGoals, today), [activeActionGoals, today]);

  const nickname = isGuest ? guestData?.nickname || '용사' : user?.nickname || '용사';

  const handleCreateGoal = () => {
    const route = CATEGORY_ROUTE_MAP[activeCategory] || '/CreateGoalExercise';
    navigate(route);
  };

  const persistNewTitle = async (titleId) => {
    if (!titleId) return null;

    if (isGuest) {
      try {
        await addOwnedTitle({ titleId, isGuest, user, queryClient });
        queryClient.removeQueries({ queryKey: ['guest-home-data'] });
        queryClient.removeQueries({ queryKey: ['guest-records-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-home-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-records-data'] });
        window.dispatchEvent(new Event('root-home-data-updated'));
        setGuestVersion((v) => v + 1);
      } catch (error) {
        console.error('persistNewTitle guest error:', error);
      }
      return titleId;
    }

    try {
      await addOwnedTitle({ titleId, isGuest, user, queryClient });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (error) {
      console.error('persistNewTitle user error:', error);
    }
    return titleId;
  };

  const handleEquipTitle = async (titleId) => {
    try {
      await setEquippedTitle({ titleId, isGuest, user, queryClient });
      setNewTitle(null);

      if (isGuest) {
        queryClient.invalidateQueries({ queryKey: ['guest-home-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-records-data'] });
        window.dispatchEvent(new Event('root-home-data-updated'));
        setGuestVersion((v) => v + 1);
      } else {
        queryClient.invalidateQueries({ queryKey: ['me'] });
      }

      toast.success('대표 칭호가 설정되었어요.');
    } catch (error) {
      console.error('handleEquipTitle error:', error);
      toast.error('대표 칭호 설정에 실패했어요.');
    }
  };

  const saveVillageState = async (nextState) => {
    const safeState = {
      village_points: Number(nextState?.village_points || 0),
      village_decorations: Array.isArray(nextState?.village_decorations) ? nextState.village_decorations : [],
      village_characters: Array.isArray(nextState?.village_characters) ? nextState.village_characters : [],
      village_buildings: Array.isArray(nextState?.village_buildings) ? nextState.village_buildings : [],
      village_inventory_characters: Array.isArray(nextState?.village_inventory_characters) ? nextState.village_inventory_characters : [],
      village_inventory_decorations: Array.isArray(nextState?.village_inventory_decorations) ? nextState.village_inventory_decorations : [],
    };

    if (isGuest) {
      writeGuestDataPatch((prev) => ({
        ...prev,
        village_points: safeState.village_points,
        village_decorations: safeState.village_decorations.map(({ image, ...rest }) => rest),
        village_characters: safeState.village_characters.map(({ image, ...rest }) => rest),
        village_buildings: safeState.village_buildings,
        village_inventory_characters: safeState.village_inventory_characters,
        village_inventory_decorations: safeState.village_inventory_decorations,
      }));
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    await base44.auth.updateMe({
      village_points: safeState.village_points,
      village_decorations: safeState.village_decorations.map(({ image, ...rest }) => rest),
      village_characters: safeState.village_characters.map(({ image, ...rest }) => rest),
      village_buildings: safeState.village_buildings,
      village_inventory_characters: safeState.village_inventory_characters,
      village_inventory_decorations: safeState.village_inventory_decorations,
    });
    queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const handleVillagePurchase = async (item) => {
    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});
    const currentPoints = Number(currentVillage.village_points || 0);

    if (currentPoints < item.price) {
      toast.error('포인트가 부족해요.');
      return;
    }

    const nextPoints = currentPoints - item.price;
    const newInventoryItem = createInventoryItem(item);
    const nextInventoryCharacters = [...inventoryCharacters];
    const nextInventoryDecorations = [...inventoryDecorations];

    if (item.type === 'decoration') {
      nextInventoryDecorations.push(newInventoryItem);
    } else {
      nextInventoryCharacters.push(newInventoryItem);
    }

    const nextState = {
      village_points: nextPoints,
      village_decorations: decorations,
      village_characters: characters,
      village_buildings: buildingLayout,
      village_inventory_characters: nextInventoryCharacters,
      village_inventory_decorations: nextInventoryDecorations,
    };

    try {
      await saveVillageState(nextState);
      setInventoryCharacters(nextInventoryCharacters);
      setInventoryDecorations(nextInventoryDecorations);
      originalVillageRef.current = {
        ...currentVillage,
        ...nextState,
      };
      toast.success(`${item.label} 구매 완료! 가방에 보관했어요. (-${item.price} 포인트)`);
    } catch (error) {
      console.error('handleVillagePurchase error:', error);
      toast.error('구매 중 오류가 발생했어요.');
    }
  };

  const handlePlaceInventoryItem = async (inventoryItem) => {
    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});

    const nextCharacters = [...characters];
    const nextDecorations = [...decorations];
    const nextInventoryCharacters = [...inventoryCharacters];
    const nextInventoryDecorations = [...inventoryDecorations];

    if (inventoryItem.type === 'character') {
      nextCharacters.push(createPlacedObjectFromInventory(inventoryItem));
      const removeIndex = nextInventoryCharacters.findIndex((item) => item.id === inventoryItem.id);
      if (removeIndex >= 0) nextInventoryCharacters.splice(removeIndex, 1);
    } else {
      nextDecorations.push(createPlacedObjectFromInventory(inventoryItem));
      const removeIndex = nextInventoryDecorations.findIndex((item) => item.id === inventoryItem.id);
      if (removeIndex >= 0) nextInventoryDecorations.splice(removeIndex, 1);
    }

    const nextState = {
      village_points: currentVillage.village_points,
      village_decorations: nextDecorations,
      village_characters: nextCharacters,
      village_buildings: buildingLayout,
      village_inventory_characters: nextInventoryCharacters,
      village_inventory_decorations: nextInventoryDecorations,
    };

    try {
      await saveVillageState(nextState);
      setCharacters(nextCharacters);
      setDecorations(nextDecorations);
      setInventoryCharacters(nextInventoryCharacters);
      setInventoryDecorations(nextInventoryDecorations);
      originalVillageRef.current = {
        ...currentVillage,
        ...nextState,
      };
      toast.success(`${inventoryItem.label}을(를) 마을에 꺼냈어요!`);
    } catch (error) {
      console.error('handlePlaceInventoryItem error:', error);
      toast.error('가방에서 꺼내는 중 오류가 발생했어요.');
    }
  };

  const handleStoreSelected = async () => {
    if (!selectedObject) return;
    if (selectedObject.type !== 'character' && selectedObject.type !== 'decoration') return;

    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});
    const nextCharacters = [...characters];
    const nextDecorations = [...decorations];
    const nextInventoryCharacters = [...inventoryCharacters];
    const nextInventoryDecorations = [...inventoryDecorations];

    if (selectedObject.type === 'character') {
      const target = nextCharacters.find((item) => item.id === selectedObject.id);
      if (!target || target.id === 'starter_fox') {
        toast.error('기본 캐릭터는 가방에 넣을 수 없어요.');
        return;
      }
      const removeIndex = nextCharacters.findIndex((item) => item.id === selectedObject.id);
      if (removeIndex >= 0) nextCharacters.splice(removeIndex, 1);
      nextInventoryCharacters.push({
        id: `inv_${target.type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        type: 'character',
        subtype: target.type,
        label: target.name || (target.type === 'alpaca' ? '알파카' : target.type === 'platypus' ? '오리너구리' : '여우'),
      });
    }

    if (selectedObject.type === 'decoration') {
      const target = nextDecorations.find((item) => item.id === selectedObject.id);
      if (!target) return;
      const removeIndex = nextDecorations.findIndex((item) => item.id === selectedObject.id);
      if (removeIndex >= 0) nextDecorations.splice(removeIndex, 1);
      nextInventoryDecorations.push({
        id: `inv_${target.type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        type: 'decoration',
        subtype: target.type,
        label: target.type === 'tree' ? '나무' : target.type === 'flower' ? '꽃' : '잔디',
      });
    }

    const nextState = {
      village_points: currentVillage.village_points,
      village_decorations: nextDecorations,
      village_characters: nextCharacters,
      village_buildings: buildingLayout,
      village_inventory_characters: nextInventoryCharacters,
      village_inventory_decorations: nextInventoryDecorations,
    };

    try {
      await saveVillageState(nextState);
      setCharacters(nextCharacters);
      setDecorations(nextDecorations);
      setInventoryCharacters(nextInventoryCharacters);
      setInventoryDecorations(nextInventoryDecorations);
      setSelectedObject(null);
      setPlacementPreview(null);
      originalVillageRef.current = {
        ...currentVillage,
        ...nextState,
      };
      toast.success('가방에 넣었어요!');
    } catch (error) {
      console.error('handleStoreSelected error:', error);
      toast.error('가방에 넣는 중 오류가 발생했어요.');
    }
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      handleSaveEdit();
      return;
    }
    setSelectedObject(null);
    setPlacementPreview(null);
    setIsEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (placementPreview && !placementPreview.valid) {
      toast.error('빨간 칸 상태에서는 저장할 수 없어요.');
      return;
    }

    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});

    const nextState = {
      village_points: currentVillage.village_points,
      village_decorations: decorations,
      village_characters: characters,
      village_buildings: buildingLayout,
      village_inventory_characters: inventoryCharacters,
      village_inventory_decorations: inventoryDecorations,
    };

    try {
      await saveVillageState(nextState);
      originalVillageRef.current = {
        ...currentVillage,
        ...nextState,
      };
      setIsEditMode(false);
      setSelectedObject(null);
      setPlacementPreview(null);
      toast.success('마을 편집이 저장되었어요.');
    } catch (error) {
      console.error('handleSaveEdit error:', error);
      toast.error('마을 저장 중 오류가 발생했어요.');
    }
  };

  const handleCancelEdit = () => {
    const village = originalVillageRef.current || getVillageState(isGuest ? guestData : user || {});

    setDecorations(
      (village.village_decorations || []).map((item) => ({
        ...item,
        image: getDecorationImage(item.type),
      }))
    );
    setCharacters(
      (village.village_characters || []).map((item) => ({
        ...item,
        image: getCharacterImage(item.type),
      }))
    );
    setBuildingLayout(village.village_buildings || DEFAULT_BUILDINGS);
    setInventoryCharacters(village.village_inventory_characters || []);
    setInventoryDecorations(village.village_inventory_decorations || []);
    setSelectedObject(null);
    setPlacementPreview(null);
    setIsEditMode(false);
  };

  const handleFlipSelected = () => {
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
  };

  const handleActionComplete = async (actionGoal, minutes = 0, extra = {}) => {
    try {
      const now = new Date().toISOString();
      const todayStr = getTodayString();
      const earnedExp = calculateExp(actionGoal, minutes);
      const earnedVillagePoints = calculateVillagePointReward(actionGoal, minutes);

      const safeGoalId =
        actionGoal?.goal_id ||
        resolveGoalIdForActionGoal(actionGoal, goals, activeCategory);

      if (!safeGoalId) {
        toast.error('행동목표와 결과목표 연결이 끊어졌어요. 새로고침 후 다시 시도해 주세요.');
        return;
      }

      const logPayload = {
        id: `local_log_${Date.now()}`,
        action_goal_id: actionGoal.id,
        goal_id: safeGoalId,
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

      const currentVillageSource = isGuest ? guestData : user;
      const currentVillage = getVillageState(currentVillageSource || {});
      const nextVillagePoints = Number(currentVillage.village_points || 0) + earnedVillagePoints;

      if (isGuest) {
        guestDataPersistence.addActionLog(logPayload);

        if (actionGoal.action_type === 'one_time') {
          guestDataPersistence.updateActionGoal(actionGoal.id, {
            status: 'completed',
            completed: true,
            completed_date: todayStr,
            updated_date: now,
          });
        }

        writeGuestDataPatch((prev) => ({
          ...prev,
          village_points: nextVillagePoints,
        }));

        queryClient.removeQueries({ queryKey: ['guest-home-data'] });
        queryClient.removeQueries({ queryKey: ['guest-records-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-home-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-records-data'] });

        window.dispatchEvent(new Event('root-home-data-updated'));
      } else {
        await base44.entities.ActionLog.create({
          ...logPayload,
          id: undefined,
        });

        if (actionGoal.action_type === 'one_time') {
          await base44.entities.ActionGoal.update(actionGoal.id, {
            status: 'completed',
            completed: true,
            completed_date: todayStr,
            updated_date: now,
          });
        }

        await base44.auth.updateMe({
          village_points: nextVillagePoints,
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['allLogs'] }),
          queryClient.invalidateQueries({ queryKey: ['actionGoals'] }),
          queryClient.invalidateQueries({ queryKey: ['goals'] }),
          queryClient.invalidateQueries({ queryKey: ['me'] }),
        ]);
      }

      setExpPopup(earnedExp);
      setPointPopup(earnedVillagePoints);

      const currentLogs = isGuest
        ? (Array.isArray(guestData?.actionLogs) ? guestData.actionLogs : [])
        : (Array.isArray(allLogs) ? allLogs : []);

      const currentActionGoals = isGuest
        ? (Array.isArray(guestData?.actionGoals)
            ? connectActionGoalsToGoals(goals, guestData.actionGoals)
            : [])
        : (Array.isArray(connectedActionGoals) ? connectedActionGoals : []);

      const nextLogs = [...currentLogs, logPayload];

      const nextActionGoals =
        actionGoal.action_type === 'one_time'
          ? currentActionGoals.map((goal) =>
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
          : currentActionGoals;

      const nextStats = buildDerivedStats(nextLogs, nextActionGoals);

      const currentOwnedTitleIds = isGuest
        ? getOwnedTitleIds({ isGuest: true, user: null, guestData: readGuestData() })
        : getOwnedTitleIds({ isGuest: false, user, guestData: null });

      const unlocked = getNewlyUnlockedTitle(nextStats, currentOwnedTitleIds);

      if (unlocked) {
        await persistNewTitle(unlocked.id);
        setNewTitle(unlocked);
      }

      toast.success('행동목표를 완료했어요!');
    } catch (error) {
      console.error('handleActionComplete error:', error);
      toast.error('행동목표 완료 처리 중 오류가 발생했어요.');
    }
  };

  const totalLevel = useMemo(() => {
    const sum =
      Number(userLevels.exercise_level || 1) +
      Number(userLevels.study_level || 1) +
      Number(userLevels.mental_level || 1) +
      Number(userLevels.daily_level || 1);

    return Math.max(1, Math.floor(sum / 4));
  }, [userLevels]);

  const points = Number(getVillageState(isGuest ? guestData : user).village_points || 0);

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background:
          'linear-gradient(180deg, #f8f1df 0%, #f5e8c9 38%, #f2e1bc 68%, #ebd6a9 100%)',
      }}
    >
      {expPopup ? <ExpPopup exp={expPopup} /> : null}
      {pointPopup ? <PointPopup points={pointPopup} /> : null}

      {newTitle ? (
        <TitleUnlockModal
          title={newTitle}
          onClose={() => setNewTitle(null)}
          onEquip={() => handleEquipTitle(newTitle.id)}
        />
      ) : null}

      <VillageShopModal
        open={isShopOpen}
        activeTab={shopTab}
        onTabChange={setShopTab}
        points={points}
        onClose={() => setIsShopOpen(false)}
        onBuy={handleVillagePurchase}
      />

      <VillageBagModal
        open={isBagOpen}
        activeTab={bagTab}
        onTabChange={setBagTab}
        inventoryCharacters={inventoryCharacters}
        inventoryDecorations={inventoryDecorations}
        onClose={() => setIsBagOpen(false)}
        onPlaceItem={handlePlaceInventoryItem}
      />

      <VillageWorldLayer
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
        placementPreview={placementPreview}
        setPlacementPreview={setPlacementPreview}
        onToggleOverview={() => setIsOverview((prev) => !prev)}
        onOpenShop={() => {
          setShopTab('character');
          setIsShopOpen(true);
        }}
        onOpenBag={() => {
          setBagTab('character');
          setIsBagOpen(true);
        }}
        onToggleEditMode={handleToggleEditMode}
        onFlipSelected={handleFlipSelected}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onStoreSelected={handleStoreSelected}
      />

      <div
        className="sticky top-[314px] z-40 -mx-4 px-4 pt-1 pb-2"
        style={{
          background:
            'linear-gradient(180deg, rgba(248,241,223,0.98) 0%, rgba(245,232,201,0.95) 78%, rgba(245,232,201,0.88) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div className="px-4">
          <CategoryTabs
            active={activeCategory}
            onChange={handleCategoryChange}
            userLevels={userLevels}
          />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4">
        {activeGoal ? (
          <GoalProgress goal={activeGoal} logs={goalLogs} />
        ) : (
          <EmptyGoalState
            category={activeCategory}
            onCreateGoal={handleCreateGoal}
          />
        )}

        {activeGoal ? (
          <div className="space-y-6 pt-1">
            <Section
              title="오늘 해야 할 것"
              count={grouped.todayItems.length}
              emptyText="오늘 해야 할 행동목표가 없어요."
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
              emptyText="예정된 목표가 없어요."
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
              emptyText="기한 지난 목표가 없어요."
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

            <div className="pt-1">
              <AddActionGoalButton
                onClick={handleCreateGoal}
                categoryLabel={CATEGORY_LABELS[activeCategory]}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
