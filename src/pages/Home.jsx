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

/* ===================타일맵 기본 설정================== */
const TILE_W = 128; //타일 한 칸의 가로 길이 = 128
const TILE_H = 64; //타일 한 칸의 세로 길이 = 64

//이건 마을 맵의 칸 수를 정하는 거
const GRID_COLS = 20; //가로 20칸
const GRID_ROWS = 20; //세로 20칸

//이건 격자 전체를 화면 어디에 놓을지 정하는 시작 좌표
const GRID_ORIGIN_X = 1280; //커지면 지금 보는 사용자의 시야화면에서 맵이 오른쪽으로 감
const GRID_ORIGIN_Y = 220; //커지면 지금 보는 사용자의 시야화면에서 맵이 아래로 감

//전체 좌표 공간의 한계
const WORLD_WIDTH = 2560; //마을 전체 배경의 너비
const WORLD_HEIGHT = 1700; //마을 전체 배경의 높이

const OUTER_TILE_PADDING = 20; //맵 바깥쪽에 여유 타일을 몇 칸 더 둘지 정하는 값,즉, 맵 가장자리에서 갑자기 잘리지 않고 자연스럽게 보이게 하는 좌표용 여유값이야

const WORLD_VIEWPORT_HEIGHT = 300; //스크롤 없는 고정된 월드 영역 높이로 상단화면의 위아래 세로 크기를 정한다 

//오브젝트나 카메라가 어디까지 갈 수 있는지 조정하는 보정값
const WORLD_EDGE_MARGIN_LEFT = 10;
const WORLD_EDGE_MARGIN_RIGHT = 100;
const WORLD_EDGE_MARGIN_TOP = 100;
const WORLD_EDGE_MARGIN_BOTTOM = 100;

//마름모(아이소메트릭) 모양의 모서리 제한값, 높아지면 멀리볼 수 있음
const VIEW_DIAMOND_CORNER_LIMIT_X = 1400;
const VIEW_DIAMOND_CORNER_LIMIT_Y = 700; 

//타일 종류 이름을 모아둔 목록, 종류 정의, 랜덤배치와는 상관이 없다. 
const TILE_KIND = {
  BASE_GRASS: 'base_grass',
  VARIANT_GRASS: 'variant_grass',
 };

//테두리에 배치할 나무/수풀 이미지 목록
const BORDER_TREE_IMAGES = [borderTree1Img, borderTree2Img, borderTree3Img];
const BORDER_BUSH_IMAGES = [borderBush1Img];

//기본 건물 4개의 시작 위치, flipped는 좌우반전 여부 , id는 건물의 이름,  
const DEFAULT_BUILDINGS = [
  { id: 'exercise_building', category: 'exercise', col: 6, row: 10, flipped: false },
  { id: 'study_building', category: 'study', col: 9, row: 11, flipped: false },
  { id: 'mental_building', category: 'mental', col: 12, row: 9, flipped: false },
  { id: 'daily_building', category: 'daily', col: 15, row: 8, flipped: false },
];

//처음 시작할 때 마을 상태 
const DEFAULT_VILLAGE_DATA = {
  village_points: 0,
  village_decorations: [],
  village_characters: [
    { id: 'starter_fox', name: '루', type: 'fox', col: 10, row: 12, size: 52, flipped: false },
  ],
  village_buildings: DEFAULT_BUILDINGS,
};

//가방 안 기본 데이터
const DEFAULT_VILLAGE_INVENTORY = {
  village_inventory_characters: [],
  village_inventory_decorations: [],
};

//게스트 모드일 때 저장된 데이터 읽기, 캐릭터, 건물, 꾸미기 현재 위치
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

//이 함수는 오브젝트를 옮겼을 때, 바뀐 col, row를 저장하는 데 쓰
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

//오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

//날짜를 YYYY-MM-DD로 통일
function normalizeDateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

//카테고리 이름을 표준값으로 맞춤, 건물/오브젝트가 카테고리별 구역에 놓일 때 간접 관련은 있음.
function normalizeCategoryValue(category, fallback = 'exercise') {
  const normalized = CATEGORY_ALIASES[category];
  if (normalized && VALID_CATEGORIES.includes(normalized)) return normalized;
  return fallback;
}

//카테고리 이름을 실제 키 값으로 변환, 카테고리 구역별 배치 로직과 연결될 수 있음.
function resolveCategoryKey(category, fallback = '') {
  const rawCategory = typeof category === 'string' ? category.trim() : '';
  if (!rawCategory) return fallback;
  return CATEGORY_ALIASES[rawCategory] || rawCategory;
}

//값을 최소~최대 범위 안으로 강제 제한, 오브젝트가 맵 밖으로 안 나가게 막는 핵심 함수
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

//뜻 최소~최대 사이 랜덤 숫자 생성, 좌표와 관련해서 랜덤 위치 배치에 쓰임
function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

//뜻 seed 기준으로 항상 같은 랜덤값처럼 보이는 숫자 생성, 좌표와 관련되서 맵 생성에 자주 쓰임
function pseudoRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

//마름모 이동을 정의하는 방법 즉,타일 좌표(col, row) -> 화면 좌표(x, y)로 바꿔주는 함
function gridToScreen(col, row) {
  return {
    x: GRID_ORIGIN_X + (col - row) * (TILE_W / 2),
    y: GRID_ORIGIN_Y + (col + row) * (TILE_H / 2),
  };
}

//화면 좌표(x, y) → 타일 좌표(col, row)로 바꾸는 함수
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

//오브젝트 크기 정의 건물 2x2, 나머지 1x1
function getObjectTileSize(item, kind) {
  if (kind === 'building') return { cols: 2, rows: 2 };
  return { cols: 1, rows: 1 };
}


function getOccupiedTiles(item, kind, nextCol = item?.col, nextRow = item?.row) { //오브젝트가 실제로 차지하는 모든 타일 좌표 계산
  const { cols, rows } = getObjectTileSize(item, kind); // 크기 가져오기 
  const tiles = []; // 타일 좌표들을 담을 공간 

  for (let c = 0; c < cols; c += 1) {  //크기만큼 반복
    for (let r = 0; r < rows; r += 1) {
      tiles.push({ //기준 위치에서 확장
        col: nextCol + c,
        row: nextRow + r,
      });
    }
  }

  return tiles;
}

// 맵 안에 있도록 점검
function isInsideGrid(col, row) {  
  return col >= 0 && row >= 0 && col < GRID_COLS && row < GRID_ROWS;
}

//여기에 놓을 수 있냐?”를 결정하는 최종 판정 함수
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

//마을이 자연스럽게 보이게 만드는 핵심 디테일(그대로 쓰면 공중에 떠보임  그래서 y를 아래로 밀어서 발 기준/ 바닦기준을 맞춤
function getObjectScreenPosition(item, kind) {
  const { x, y } = gridToScreen(item.col, item.row); // 타일 좌표 → 화면 위치 변환

  if (kind === 'building') return { x, y: y + 22 }; //건물은 더 아래로 이동
  if (kind === 'character') return { x, y: y + 10 }; // 캐릭터는 조금만 아래로 이동
  return { x, y: y + 14 }; // 꾸미기(기본)은 중간정도 이동
}

//프리뷰용 타일 계산 함수인데, 현재는 실제 계산 함수 그대로 쓰고 있는 상태 -> 추후 더 발전시켜야
function getPreviewTiles(item, kind, col, row) {
  return getOccupiedTiles(item, kind, col, row);
}

//"배치 가능하면 초록색, 불가능하면 빨간색 스타일을 반환하는 함수"어떤 타일이 충돌인지 구분은 안
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

// 목표의 “끝나는 날짜” 계산 함수, 시작일 + 기간 → 종료일, 이 목표 언제 끝나냐? 계산하는 함수
function getGoalEndDate(goal) {
  if (!goal?.start_date || !goal?.duration_days) return null;
  const start = new Date(goal.start_date);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start);
  end.setDate(end.getDate() + Number(goal.duration_days || 0));
  end.setHours(23, 59, 59, 999);
  return end;
}

//현재 날짜 기준 “이번 주 월요일” 구하기, 이번 주 시작일 (월요일) 계산
function getMonday(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

//이번 주 일요일 구하기, 월요일 기준으로 +6일 → 일요일, 이번 주 마지막 날
function getSunday(date = new Date()) {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

//이번 주에 해당 행동목표를 얼마나 했는지 가져오기, "이번 주 몇 번 했는지 계산용 데이터 필터"
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

//특정 행동목표(actionGoal)의 모든 기록(지금까지 몇변했는지) 가져오기, 누적 횟수/ 총 경험치 계산용
function getAllLogsForAction(logs, actionGoalId) {
  return (logs || []).filter((log) => log?.action_goal_id === actionGoalId);
}

// ActionGoal이 어떤 Goal에 속하는지 강제로 찾아주는 함수로 이 행동목표 어디 소속인지 모르겠으면 알아서 연결해
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

//ActionGoal 전체를 Goal에 강제로 연결하는 함수
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

//게스트(비로그인) 목표 데이터를 “정상 형태”로 정리하는 함수, id 자동생성, category이상 표준값으로 교정, status 없음 active로 
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

//게스트 행동목표를 정상 상태로 만들고 goal에 연결까지 해주는 함수
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

//연속으로 며칠 했는지 계산하는 함수 (스트릭)
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

//행동 로그를 돌면서 XP를 쌓고 → 카테고리별 레벨을 계산하는 함수
function getDefaultUserLevels(logs = []) {
  const result = { // 기본상태 만들기, 레벨1 경험치 0부터 시작
    exercise_level: 1,
    exercise_xp: 0,
    study_level: 1,
    study_xp: 0,
    mental_level: 1,
    mental_xp: 0,
    daily_level: 1,
    daily_xp: 0,
  };

  (logs || []).forEach((log) => {//모든 행동 기록을 하나씩 검사(로그를 돌면서)  xp 누적
    const category = log?.category;
    if (!category) return;

    let addXp = 10;//1회 10xp,
    if (log?.duration_minutes && Number(log.duration_minutes) > 0) addXp = 15; //타이머형 15xp
    if (log?.meta_action_type === 'one_time') addXp = 20; //1회성 목표면 20xp

    if (!Object.prototype.hasOwnProperty.call(result, `${category}_xp`)) return; //이상한 카테고리 들어오면 무시하여 버그방지
    result[`${category}_xp`] += addXp;
  });

  ['exercise', 'study', 'mental', 'daily'].forEach((category) => {
    const xp = result[`${category}_xp`] || 0;
    result[`${category}_level`] = Math.max(1, Math.floor(xp / 30) + 1); //레벨계산 레벨 (xp/30)+1
  });

  return result;
}

//“행동목표들을 오늘 / 예정 / 지난 목표로 자동 분류하는 함수”
function groupActionGoals(actionGoals, today) {
  const todayItems = []; // 오늘 해야 할 것
  const scheduledItems = []; // 예정된 목표
  const overdueItems = []; // 기한 지난 목표

  (actionGoals || []).forEach((actionGoal) => {
    const isOneTime = actionGoal?.action_type === 'one_time'; //1회성 목표와 일반목표 2가지로 나눔

    if (isOneTime) {//1회성 목표
      const scheduledDate = normalizeDateOnly(
        actionGoal?.scheduled_date ||
          actionGoal?.scheduledDate ||
          actionGoal?.date ||
          actionGoal?.target_date ||
          actionGoal?.targetDate
      );

      const isCompleted =
        actionGoal?.status === 'completed' || actionGoal?.completed === true;

      if (isCompleted) return; //완료된 목표는 홈에서 안 보여줌

      if (!scheduledDate) {// 예정된 목표인 경우
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

//행동 하나 완료했을 때 EXP 얼마나 줄지 결정
function calculateExp(actionGoal, minutes = 0) {
  if (actionGoal?.action_type === 'one_time') return 20; //1회성 목표는 20
  if (actionGoal?.action_type === 'timer' || Number(minutes || 0) > 0) return 15; //시간기록형은 15
  return 10; //나머지는 10
}

//마을 성장용 포인트 지급 함수
function calculateVillagePointReward(actionGoal, minutes = 0) {
  if (actionGoal?.action_type === 'one_time') return 5;
  if (actionGoal?.action_type === 'timer' || Number(minutes || 0) > 0) return 3;
  return 2;
}

//logs(행동 기록들)를 분석해서 운동 횟수, 공부 시간, 금연 일수 같은 통계를 만들어서 반환함
function buildDerivedStats(logs = [], actionGoals = []) { // logs 실제 행동 기록 (ActionLog), actionGoals 행동 목표 정보
  const stats = {//stats 결과 저장할 통계판” 만드는 단계
    total_actions: 0,
    total_exercise_count: 0,
    total_study_minutes: 0,
    total_mental_count: 0,
    total_daily_count: 0,
    total_running_km: 0,
    total_no_smoking_days: 0,
  };

  (logs || []).forEach((log) => {//logs 하나씩 분석하여 완료된것만 인정, 미완료는 통계에서 제외 
    if (!log?.completed) return;

    stats.total_actions += 1; //총 행동 횟수 +1

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

//현재 통계(stats)를 보고 조건을 만족했지만 아직 안 가진 칭호를 찾아주는 로직
function getNewlyUnlockedTitle(stats, ownedTitleIds = []) {//입렵 stats 방금 만든 통계 (운동 횟수, 공부 시간 등), ownedTitleIds  이미 가진 칭호 목록
  const ownedSet = new Set(ownedTitleIds); // 이미 가진 칭호를 빠르게 체크 배열 → Set으로 변환 
  return TITLES.find(// TITLES 목록을 돌면서 조건 맞는 첫 번째 칭호만 반환
    (title) => !ownedSet.has(title.id) &&  //이미 가진 건 제외 
      Number(stats?.[title.metric] || 0) >= title.value
  );
}

//데이터 연결이 정상인지 검사해서 “문제 개수”를 알려주는 함수
function validateGoalActionLogChain(goals = [], actionGoals = [], logs = []) {
  const goalIds = new Set((goals || []).map((goal) => goal?.id).filter(Boolean));// 모든 goal의 id 모아서 Set 생성
  const actionGoalIds = new Set((actionGoals || []).map((goal) => goal?.id).filter(Boolean));//모든 actionGoal의 id 모아서 Set 생성

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

//캐릭터 타입에 맞는 이미지를 선택해서 반환하는 함수
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

//상점 → 가방(인벤토리)로 아이템을 “실제 소유 데이터”로 변환하는 함수
function createInventoryItem(item) {
  return {
    id: `${item.type}_${item.subtype}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    shop_item_id: item.id,
    type: item.type,
    subtype: item.subtype,
    label: item.label,
  };
}

//인벤토리 아이템을 “마을에 놓을 수 있는 실제 오브젝트”로 변환하는 함수
function createPlacedObjectFromInventory(inventoryItem) {
  if (inventoryItem?.type === 'character') {
    return createCharacter(inventoryItem.subtype);
  }
  return createDecoration(inventoryItem?.subtype || 'grass');
}

//저장소(source) 안에 있는 마을 데이터를 꺼내서, 비어 있거나 이상한 값은 기본값으로 보정한 뒤, 화면에서 바로 쓸 수 있는 “정리된 마을 상태”를 만드는 함수
function getVillageState(source) {
  return {
    village_points: Number(source?.village_points ?? DEFAULT_VILLAGE_DATA.village_points), //source에 village_points가 있으면 그 값을 사용없으면 DEFAULT_VILLAGE_DATA.village_points 사용 마지막에 Number(...)로 숫자로 강제 변환
    village_decorations: Array.isArray(source?.village_decorations) //village_decorations가 배열이면 그대로 사용 배열이 아니면 기본 장식 배열 사용
      ? source.village_decorations
      : DEFAULT_VILLAGE_DATA.village_decorations,
    village_characters: relocateCharactersToVillageCore( //source.village_characters가 배열이고 길이도 1개 이상이면 그걸 사용 아니면 기본 캐릭터 배열 사용 그리고 마지막에 relocateCharactersToVillageCore(...)를 무조건 한 번 거침
      Array.isArray(source?.village_characters) && source.village_characters.length > 0
        ? source.village_characters
        : DEFAULT_VILLAGE_DATA.village_characters
    ),
    village_buildings: //건물 배열이 있고, 비어 있지 않으면 그대로 사용 아니면 기본 건물 배열 사용
      Array.isArray(source?.village_buildings) && source.village_buildings.length > 0
        ? source.village_buildings
        : DEFAULT_VILLAGE_DATA.village_buildings,
    village_inventory_characters: Array.isArray(source?.village_inventory_characters) //캐릭터 인벤토리가 배열이면 그걸 사용 아니면 기본 인벤토리 사용
      ? source.village_inventory_characters
      : DEFAULT_VILLAGE_INVENTORY.village_inventory_characters,
    village_inventory_decorations: Array.isArray(source?.village_inventory_decorations) //장식 인벤토리가 배열이면 그걸 사용 아니면 기본 인벤토리 사용
      ? source.village_inventory_decorations
      : DEFAULT_VILLAGE_INVENTORY.village_inventory_decorations,
  };
}

//캐릭터가 처음 나타날 수 있는 “좌표 후보 리스트”
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

//캐릭터가 마을 중심 영역에서 너무 벗어났는지 검사하는 함수
function isCharacterTooFarFromVillageCore(character) {
  const col = Number(character?.col ?? 0); //character.col, row 값을 가져옴, 없으면 0으로 대체, 문자열이어도 숫자로 변환
  const row = Number(character?.row ?? 0);
  return col < 6 || col > 14 || row < 8 || row > 14; // 범위 체크 
}

//캐릭터 위치를 자동으로 “정상화 + 겹침 방지 + 중앙 재배치” 해주는 함수
function relocateCharactersToVillageCore(rawCharacters = []) {
  const slots = getCharacterSpawnSlots(); //스폰 위치 가저오기 '바로 위에 있음'
  const used = new Set(); //캐릭터끼리 겹치지 않게 하기

  return (Array.isArray(rawCharacters) ? rawCharacters : []).map((character, index) => {//배열 아니면 빈 배열 처리
    const next = { ...character }; //원본 안 건드리고 복사본 수정
    const currentKey = `${next.col},${next.row}`; //Set에서 위치 비교하려고 문자열로 만듦 

    if (!isCharacterTooFarFromVillageCore(next) && !used.has(currentKey)) {//범위 안에 있고, 아직 아무도 안 쓰는 자리면 -> 그대로 유지
      used.add(currentKey);
      return next;
    }

    const fallback = slots[index % slots.length]; //일단 index 기반으로 하나 정해둠
    let chosen = fallback;

    for (const slot of slots) {
      const key = `${slot.col},${slot.row}`; 슬롯 하나씩 돌면서 아직 안 쓰인 자리 찾음 -> 발견하면 바로 사용
      if (!used.has(key)) {
        chosen = slot;
        break;
      }
    }

    next.col = chosen.col; //캐릭터를 새 위치로 이동
    next.row = chosen.row;
    used.add(`${chosen.col},${chosen.row}`); //이제 이 자리도 사용됨
    return next; //수정된 캐릭터 반환
  });
}

//장식 오브젝트(풀/나무/꽃)를 “랜덤 위치 + 고유 ID + 이미지 + 크기”로 생성하는 함수
function createDecoration(subtype) {
  const sizeMap = { grass: 34, tree: 62, flower: 30 }; //장식 종류별 화면 크기(px), 없으면 기본값 32

  return {
    id: `${subtype}_${Date.now()}_${Math.floor(Math.random() * 10000)}`, //고유 ID 생성, subtype: 종류, 시간: 중복 방지, 랜덤: 추가 안전
    type: subtype, //장식 종류 표시
    image: getDecorationImage(subtype), //subtype → 실제 이미지로 변환, 이 함수가 이미지 매핑 담당
    col: Math.floor(randomBetween(1, GRID_COLS - 2)), //랜덤 위치 생성, 0이나 끝값 피함, 경계 밖 나가는 것 방지, UI 잘림 방지
    row: Math.floor(randomBetween(1, GRID_ROWS - 2)),
    flipped: false, //좌우 반전 여부
    size: sizeMap[subtype] || 32, //크기 결정
  };
}

// 캐릭터를 하나를 랜덤 위치(스폰 슬롯)에 생성해서 바로 배치 가능한 형태로 만드는 함수
function createCharacter(type) {
  const spawnSlots = getCharacterSpawnSlots(); //스폰 위치 후보 가져오기
  const spawn = spawnSlots[Math.floor(randomBetween(0, spawnSlots.length))] || { col: 10, row: 12 }; //랜덤 위치 선택 슬롯 중 하나 랜덤 선택 혹시 오류 나면 기본값 (10,12)

  return { 
    id: `${type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`, //고유 ID 생성
    name: type === 'alpaca' ? '파카' : type === 'platypus' ? '너구' : '루', //이름설정
    type, //캐릭터 종
    image: getCharacterImage(type), //type → 이미지 변환
    col: spawn.col, //위치설정, 랜덤 슬롯 위치로 배치
    row: spawn.row,
    size: type === 'alpaca' ? 56 : 52, //사이즈 설정 alpaca → 더 큼 (56), 나머지 → 52
    flipped: false, //좌우반점
  };
}

//“유저 레벨 → 마을 건물 상태로 변환
function buildWorldBuildings({ userLevels, buildingLayout }) {
  const exerciseLevel = Number(userLevels?.exercise_level || 1); //각 카테고리 레벨 가져오,기 없으면 기본 1
  const studyLevel = Number(userLevels?.study_level || 1);
  const mentalLevel = Number(userLevels?.mental_level || 1);
  const dailyLevel = Number(userLevels?.daily_level || 1);

  const getStage = (level) => (level >= 7 ? 3 : level >= 3 ? 2 : 1); //레벨을 3단계로 압축
  const layoutMap = Object.fromEntries((buildingLayout || []).map((b) => [b.category, b])); //layoutMap 생성, 의미 : 배열 -> 객체로 변환

  return [// 4개의 건물이 생성됨
    {
      id: 'exercise_building',
      category: 'exercise',//카테고리 구분
      label: `체육관 Lv.${getStage(exerciseLevel)}`, // UI표시용
      image: getBuilding('exercise', getStage(exerciseLevel)), //단계별 이미지 선택
      col: layoutMap.exercise?.col ?? 6, //저장된 위치 있으면 그걸 사용, 없으면 기본 위
      row: layoutMap.exercise?.row ?? 10,
      flipped: !!layoutMap.exercise?.flipped,/.좌우반전
      w: 112,//건물의 크기
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

/* =========================   타일 / 경계숲 생성========================= */
//타일의 종류(kind)에 따라 어떤 이미지를 쓸지 결정하는 함수
function getTileImageByKind(kind) {//"타일 종류를 보고 이미지 가져오는 함수"
  if (kind === TILE_KIND.VARIANT_GRASS) return variantGrassTileImg; //만약 타일이 변형된 잔디(조금 다른 잔디) 라면 variantGrassTileImg 반환
  return baseGrassTileImg; //위 조건에 아무것도 안 걸리면 기본 잔디 이미지 사용
}

//
function isPathTile(col, row) { //특정 좌표(col, row)가 길인지 판단, 이 함수는: “여기는 길이다!” 를 좌표 기준으로 결정
  const pathA = Math.abs((col - row) - 1) <= 0; //해석 : col - row === 1, 의미 : 대각선 라인 하나 생성됨 (↘ 방향), 결과 대각선 길 1줄 
  const pathB = row >= 9 && row <= 12 && col >= 8 && col <= 11; //해석 : 특정 네모 역역, 결과 : 삭가형 길 영억 (광장느낌)
  const pathC = row >= 4 && row <= 8 && col - row === 3; // 해석: 또 다른 대각선, 결과:  다른 방향 길 하나 더
  return pathA || pathB || pathC; //의미: 3개 중 하나라도 맞으면 길
}

// 잔디 랜덤 만들기
function getGrassVariant(col, row) {  // 역할 : 잔디를 자연스럽게 섞기 
  const seed = (col * 17 + row * 29) % 7; //의미: 좌표마다 고정된 랜덤 값 생성
  return seed === 0 || seed === 3 ? TILE_KIND.VARIANT_GRASS : TILE_KIND.BASE_GRASS; //결과: 일부 타일만 다른 잔디
}

//전체 지도 생성
function buildTileMap(cols, rows, padding = OUTER_TILE_PADDING) { //역할: 전체 타일을 만들어서 배열로 반환
  const tiles = [];

  for (let row = -padding; row < rows + padding; row += 1) { 의미: 바깥 영역까지 확장, 너가 만든: “바깥 잔디 3줄 추가” 이거 여기서 처리됨
    for (let col = -padding; col < cols + padding; col += 1) {
      const isMainGrid = col >= 0 && row >= 0 && col < cols && row < rows; //의미: 실제 마을 내부인지 체크
      const kind = isMainGrid && isPathTile(col, row) ? TILE_KIND.PATH : getGrassVariant(col, row); //해석: 메인 영역이고, 길이면 → PAT, 아니면 → 잔디

      tiles.push({ //결과: 모든 타일 정보 저장
        id: `tile-${col}-${row}`,
        col,
        row,
        kind,
      });
    }
  }

  return tiles; //전체 맵 완성 
}

//마을 바깥 경계선에 나무와 수풀을 자동으로 배치해서, 맵이 자연스럽게 둘러싸여 보이게 만드는 함수
function buildBorderTrees() {//맵 경계가 허전해 보이지 않게 하고, 플레이어가 바깥으로 못 나가는 느낌도 주고, 오른쪽 아래처럼 빈 공간도 자연스럽게 채우는 경계 배경 생성기
  const result = []; //만들어진 나무/수풀들을 담는 배열
  let idCounter = 0; //각각의 오브젝트에 고유 id 붙일 때 쓰는 번호

  const treeSizeFromSeed = (seed, depth = 0) => { //seed 기반 보조 함수들, “랜덤처럼 보이게” 만드는 도구 ,완전 똑같은 나무만 반복되지 않게 크기를 조금씩 다르게 만든다
    const r = pseudoRandom(seed + depth * 17);
    return Math.round(228 + r * 108 - depth * 6);
  };

  const bushWidthFromSeed = (seed, depth = 0) => { //수풀 너비 정하기로 뜻: 수풀도 조금씩 크기를 다르게 만든다
    const r = pseudoRandom(seed + depth * 23);
    return Math.round(92 + r * 42 - depth * 3);
  };

  // 나무와 수풀의 같은 이미지만 쓰지 않고, 여러 종류 중 하나를 자동 선택
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

  //좌우반전, 투명도, 회전을 통해서 경계 오브젝트들이 너무 복붙처럼 보이지 않게 자연스러운 차이를 줌
  const flipFromSeed = (seed) => pseudoRandom(seed + 33) > 0.5; //flipFromSeed → 좌우반전할지
  const opacityFromSeed = (seed) => 0.9 + pseudoRandom(seed + 57) * 0.1; //opacityFromSeed → 약간 투명도 다르게
  const rotationFromSeed = (seed, amount = 5) => //rotationFromSeed → 살짝 회전
    (pseudoRandom(seed + 71) - 0.5) * amount;

  //지정한 타일 좌표(col, row)에 나무 1개를 만들어서 result에 넣는 함수
  const pushTree = (col, row, options = {}) => {
    const {
      offsetX = 0, offsetY = 0, //위치를 더 밀기 (offsetX, offsetY)
      depth = 0, //몇 번째 층 느낌인지 (depth)
      extraWidth = 0, //더 크게 만들기 (extraWidth)
      zBoost = 0, //더 앞에 보이게 할지 (zBoost)
      region = '', //어느 구역에서 만든 건지 (region)
    } = options;

    const seed = col * 1000 + row * 100 + depth * 17 + extraWidth + zBoost; // 이 나무만의 고유 숫자 비슷한 걸 만들어서 크기, 회전, 반전 등을 안정적으로 결정
    const pos = gridToScreen(col, row); //그리드 좌표를 화면 좌표로 바꾸기

    //result에 실제 오브젝트 추가
    result.push({
      id: `border-tree-${idCounter++}`, kind: 'tree', region, col,  row,
      
      //x, y에 작은 랜덤 흔들림 딱 격자 한가운데만 놓지 않고, 조금씩 흔들어서 자연스럽게
      x: pos.x + offsetX + (pseudoRandom(seed + 5) - 0.5) * 34, y: pos.y + offsetY + (pseudoRandom(seed + 9) - 0.5) * 26,
      width: treeSizeFromSeed(seed, depth) + extraWidth,
      image: treeImageFromSeed(seed),
      flipped: flipFromSeed(seed),
      opacity: opacityFromSeed(seed),
      rotation: rotationFromSeed(seed, 5),
      zIndex: 60 + (row + OUTER_TILE_PADDING + 10) * 10 + depth * 4 + col + zBoost, //뜻 : 화면에서 어떤 오브젝트가 앞에 보일지 정하는 값으로 보통 아래쪽(row가 큰 것)이 더 앞에 와야 자연스러움 즉, 겹쳤을 때 그리는 순서를 정함
    });
  };

  //실제 수풀 1개 넣는 함수: pushBush
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

  //이건 중심 좌표를 기준으로 주변에 나무를 여러 개 까는것 
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

  //수풀 여러 개를 묶어서 생성하는 함수
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

  // 뜻: 맵 위쪽 바깥 줄 전체를 따라 나무를 여러 줄 배치(한 줄만 있으면 얇아 보여서 여러 줄이면 숲처럼 보임)
  for (let col = -OUTER_TILE_PADDING - 2; col <= GRID_COLS + OUTER_TILE_PADDING + 1; col += 1) {
    pushTree(col, -4, { offsetY: -96, depth: 0, extraWidth: 58, region: 'top' });
    pushTree(col, -3, { offsetY: -56, depth: 1, extraWidth: 36, region: 'top' });
    pushTree(col, -2, { offsetY: -16, depth: 2, extraWidth: 16, region: 'top' });

    if (col % 2 === 0) {//짝수 칸마다 더 바깥쪽 나무 한 개 추가하여 울퉁불퉁한 숲 느낌
      pushTree(col, -5, {
        offsetX: 24,
        offsetY: -132,
        depth: 3,
        extraWidth: 18,
        region: 'top',
      });
    }
  }

  // 뜻 : 왼쪽 경계선에 세로로 나무 벽처럼 배치, 
  for (let row = -OUTER_TILE_PADDING - 2; row <= GRID_ROWS + OUTER_TILE_PADDING + 1; row += 1) {
    pushTree(-5, row, { offsetX: -164, offsetY: -12, depth: 0, extraWidth: 64, region: 'left' });
    pushTree(-4, row, { offsetX: -118, offsetY: -6, depth: 1, extraWidth: 42, region: 'left' });
    pushTree(-3, row, { offsetX: -72, depth: 2, extraWidth: 20, region: 'left' });
    pushTree(-2, row, { offsetX: -26, depth: 3, extraWidth: 8, region: 'left' });
  }

  // 오른쪽: 아래쪽은 수풀로 더 넓게 교체, 오른쪽은 보통 나무, 오른쪽 아래는 수풀 위주”
  for (let row = -OUTER_TILE_PADDING - 2; row <= GRID_ROWS + OUTER_TILE_PADDING + 1; row += 1) {
    const isBottomRightZone = row >= GRID_ROWS - 15; //른쪽 경계 중에서도 아래쪽 구간인지 확인

    if (isBottomRightZone) { //오른쪽 아래는 나무 대신 수풀을 많이 사용
      pushBush(GRID_COLS + 1, row, {
        offsetX: 18,
        offsetY: 16,
        depth: 0,
        extraWidth: 34,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 2, row, {
        offsetX: 64,
        offsetY: 34,
        depth: 1,
        extraWidth: 32,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 3, row, {
        offsetX: 114,
        offsetY: 54,
        depth: 2,
        extraWidth: 30,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 4, row, {
        offsetX: 168,
        offsetY: 78,
        depth: 3,
        extraWidth: 28,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 5, row, {
        offsetX: 222,
        offsetY: 104,
        depth: 4,
        extraWidth: 24,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 6, row, {
        offsetX: 276,
        offsetY: 130,
        depth: 5,
        extraWidth: 20,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 7, row, {
        offsetX: 330,
        offsetY: 154,
        depth: 6,
        extraWidth: 16,
        zBoost: 3,
        region: 'right-bottom',
      });
      pushBush(GRID_COLS + 8, row, {
        offsetX: 384,
        offsetY: 178,
        depth: 7,
        extraWidth: 12,
        zBoost: 3,
        region: 'right-bottom',
      });
    } else {아래쪽이 아니면 나무 유지 즉, 
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

  // 뜻 : 아래 경계는 수풀 2~3줄로 채움, 
  for (let col = -OUTER_TILE_PADDING - 2; col <= GRID_COLS + OUTER_TILE_PADDING + 1; col += 1) {
    pushBush(col, GRID_ROWS + 1, { offsetY: 26, depth: 0, extraWidth: 24, region: 'bottom' });
    pushBush(col, GRID_ROWS + 2, { offsetY: 54, depth: 1, extraWidth: 18, region: 'bottom' });

    if (col % 2 === 0) {
      pushBush(col, GRID_ROWS + 3, {
        offsetX: 12,
        offsetY: 80,
        depth: 2,
        extraWidth: 12,
        region: 'bottom',
      });
    }
  }

  // 코너/보강으로 이건 각 코너가 허전해지지 않게 덩어리로 채우는 코드

  pushTreeCluster(-6, -6, 5, 0, 24, 16, 'top-left');
  pushTreeCluster(GRID_COLS + 5, -6, 5, 0, 24, 16, 'top-right');
  pushBushCluster(-6, GRID_ROWS + 5, 5, 0, 20, 12, 'bottom-left');

  pushBushCluster(GRID_COLS + 5, GRID_ROWS + 5, 6, 0, 22, 14, 'bottom-right');
  pushBushCluster(GRID_COLS + 7, GRID_ROWS + 6, 7, 0, 24, 15, 'bottom-right');
  pushBushCluster(GRID_COLS + 8, GRID_ROWS + 3, 6, 1, 22, 13, 'bottom-right');
  pushBushCluster(GRID_COLS + 9, GRID_ROWS + 7, 6, 1, 24, 15, 'bottom-right');
  pushBushCluster(GRID_COLS + 10, GRID_ROWS + 4, 5, 2, 20, 12, 'bottom-right');
  pushBushCluster(GRID_COLS + 11, GRID_ROWS + 1, 7, 0, 24, 14, 'bottom-right');
  pushBushCluster(GRID_COLS + 12, GRID_ROWS + 4, 6, 1, 24, 14, 'bottom-right');
  pushBushCluster(GRID_COLS + 13, GRID_ROWS - 1, 5, 1, 22, 12, 'bottom-right');
  pushBushCluster(GRID_COLS + 9, GRID_ROWS - 2, 5, 1, 20, 11, 'bottom-right');

  pushTreeCluster(-7, -1, 4, 1, 20, 14, 'top-left-side');
  pushTreeCluster(GRID_COLS + 6, -1, 4, 1, 20, 14, 'top-right-side');
  pushBushCluster(-7, GRID_ROWS + 1, 4, 1, 18, 10, 'bottom-left-side');
  pushBushCluster(GRID_COLS + 6, GRID_ROWS + 1, 5, 1, 20, 12, 'bottom-right-side');
  pushBushCluster(GRID_COLS + 8, GRID_ROWS + 2, 6, 1, 22, 13, 'bottom-right-side');

  // 오른쪽 아래 빈 구간 직접 메우기
  for (let col = GRID_COLS - 1; col <= GRID_COLS + OUTER_TILE_PADDING + 10; col += 1) {
    pushBush(col, GRID_ROWS + 4, {
      offsetX: 8,
      offsetY: 98,
      depth: 2,
      extraWidth: 18,
      region: 'bottom-right-fill',
    });
    pushBush(col, GRID_ROWS + 5, {
      offsetX: 16,
      offsetY: 122,
      depth: 3,
      extraWidth: 14,
      region: 'bottom-right-fill',
    });
    pushBush(col, GRID_ROWS + 6, {
      offsetX: 22,
      offsetY: 146,
      depth: 4,
      extraWidth: 10,
      region: 'bottom-right-fill',
    });
  }

  // 오른쪽 아래변의 오른쪽 절반을 수풀로 더 강하게 채움
  for (let row = GRID_ROWS - 10; row <= GRID_ROWS + OUTER_TILE_PADDING + 10; row += 1) {
    pushBush(GRID_COLS + 9, row, {
      offsetX: 430,
      offsetY: 92,
      depth: 3,
      extraWidth: 22,
      zBoost: 4,
      region: 'right-edge-bush-fill',
    });
    pushBush(GRID_COLS + 10, row, {
      offsetX: 492,
      offsetY: 118,
      depth: 4,
      extraWidth: 20,
      zBoost: 4,
      region: 'right-edge-bush-fill',
    });
    pushBush(GRID_COLS + 11, row, {
      offsetX: 554,
      offsetY: 144,
      depth: 5,
      extraWidth: 18,
      zBoost: 4,
      region: 'right-edge-bush-fill',
    });
    pushBush(GRID_COLS + 12, row, {
      offsetX: 616,
      offsetY: 168,
      depth: 6,
      extraWidth: 14,
      zBoost: 4,
      region: 'right-edge-bush-fill',
    });
    pushBush(GRID_COLS + 13, row, {
      offsetX: 676,
      offsetY: 192,
      depth: 7,
      extraWidth: 10,
      zBoost: 4,
      region: 'right-edge-bush-fill',
    });
  }

  // 화면에 보이는 오른쪽 아래 빈 삼각형을 수풀로 채우는 추가 대각선
  for (let step = 0; step <= 12; step += 1) {
    pushBush(GRID_COLS + 2 + step, GRID_ROWS - 5 + step, {
      offsetX: 80 + step * 22,
      offsetY: 32 + step * 22,
      depth: 1 + Math.floor(step / 2),
      extraWidth: Math.max(8, 24 - step),
      region: 'bottom-right-diagonal',
      zBoost: 3,
    });
    pushBush(GRID_COLS + 1 + step, GRID_ROWS - 3 + step, {
      offsetX: 48 + step * 18,
      offsetY: 62 + step * 20,
      depth: 2 + Math.floor(step / 2),
      extraWidth: Math.max(6, 20 - step),
      region: 'bottom-right-diagonal',
      zBoost: 3,
    });
  }

  for (let step = 0; step <= 10; step += 1) {
    pushBush(GRID_COLS + 5 + step, GRID_ROWS - 7 + step, {
      offsetX: 160 + step * 18,
      offsetY: 10 + step * 24,
      depth: 1 + step,
      extraWidth: Math.max(6, 20 - step),
      region: 'bottom-right-cap',
      zBoost: 4,
    });
  }

  // 오른쪽 아래 빈 바닥 띠도 직접 메움
  for (let col = GRID_COLS + 6; col <= GRID_COLS + OUTER_TILE_PADDING + 14; col += 1) {
    pushBush(col, GRID_ROWS + 7, {
      offsetX: 40,
      offsetY: 176,
      depth: 4,
      extraWidth: 14,
      zBoost: 4,
      region: 'bottom-right-floor-fill',
    });
    pushBush(col, GRID_ROWS + 8, {
      offsetX: 56,
      offsetY: 204,
      depth: 5,
      extraWidth: 10,
      zBoost: 4,
      region: 'bottom-right-floor-fill',
    });
  }
   //비어 보이는 상단 쪽
  pushBush(GRID_COLS + 6, GRID_ROWS + 1, { offsetX: 120, offsetY: 54, depth: 2, extraWidth: 20, zBoost: 7, region: 'bottom-right-micro-fill' });
  // 중간 연결
  pushBush(GRID_COLS + 7, GRID_ROWS + 2, { offsetX: 154, offsetY: 78, depth: 3, extraWidth: 18, zBoost: 7, region: 'bottom-right-micro-fill' });
  //아래 수풀 덩어리와 자연스럽게 이어주
  pushBush(GRID_COLS + 8, GRID_ROWS + 3, { offsetX: 188, offsetY: 102, depth: 4, extraWidth: 16, zBoost: 7, region: 'bottom-right-micro-fill' });
  
  // 오른쪽 아래 시야 경계선 바로 안쪽 채우기
  for (let step = 0; step <= 16; step += 1) {
    pushBush(GRID_COLS - 1 + step, GRID_ROWS - 8 + step, {
      offsetX: 36 + step * 16,
      offsetY: 34 + step * 18,
      depth: 1 + Math.floor(step / 3),
      extraWidth: Math.max(10, 26 - step),
      zBoost: 5,
      region: 'bottom-right-inner-edge-fill',
    });

    pushBush(GRID_COLS - 2 + step, GRID_ROWS - 6 + step, {
      offsetX: 12 + step * 15,
      offsetY: 54 + step * 18,
      depth: 2 + Math.floor(step / 3),
      extraWidth: Math.max(8, 22 - step),
      zBoost: 5,
      region: 'bottom-right-inner-edge-fill',
    });
  }

  // 오른쪽 아래 잔디 띠가 보이던 구간을 수평으로 메움
  for (let col = GRID_COLS + 2; col <= GRID_COLS + OUTER_TILE_PADDING + 18; col += 1) {
    pushBush(col, GRID_ROWS + 3, {
      offsetX: 18,
      offsetY: 96,
      depth: 2,
      extraWidth: 22,
      zBoost: 5,
      region: 'bottom-right-horizontal-fill',
    });
    pushBush(col, GRID_ROWS + 4, {
      offsetX: 28,
      offsetY: 122,
      depth: 3,
      extraWidth: 18,
      zBoost: 5,
      region: 'bottom-right-horizontal-fill',
    });
    pushBush(col, GRID_ROWS + 5, {
      offsetX: 38,
      offsetY: 148,
      depth: 4,
      extraWidth: 14,
      zBoost: 5,
      region: 'bottom-right-horizontal-fill',
    });
  }

  // 오른쪽 아래 삼각형 중앙 빈칸 채움
  for (let step = 0; step <= 14; step += 1) {
    pushBush(GRID_COLS + 4 + step, GRID_ROWS - 4 + step, {
      offsetX: 122 + step * 20,
      offsetY: 46 + step * 22,
      depth: 2 + Math.floor(step / 2),
      extraWidth: Math.max(8, 22 - step),
      zBoost: 6,
      region: 'bottom-right-center-gap-fill',
    });

    if (step <= 12) {
      pushBush(GRID_COLS + 6 + step, GRID_ROWS - 5 + step, {
        offsetX: 168 + step * 18,
        offsetY: 28 + step * 22,
        depth: 3 + Math.floor(step / 2),
        extraWidth: Math.max(6, 18 - step),
        zBoost: 6,
        region: 'bottom-right-center-gap-fill',
      });
    }
  }

  // 맨 오른쪽 아래 코너를 더 조밀하게 채움
  pushBushCluster(GRID_COLS + 14, GRID_ROWS + 6, 6, 1, 24, 14, 'bottom-right-heavy-corner');
  pushBushCluster(GRID_COLS + 16, GRID_ROWS + 8, 6, 1, 24, 14, 'bottom-right-heavy-corner');
  pushBushCluster(GRID_COLS + 18, GRID_ROWS + 9, 5, 2, 22, 13, 'bottom-right-heavy-corner');
  pushBushCluster(GRID_COLS + 20, GRID_ROWS + 11, 5, 2, 22, 13, 'bottom-right-heavy-corner');

  // === 추가 보강 5: 오른쪽 아래 경계 안쪽의 빈 띠를 더 촘촘하게 메움 ===
  for (let step = 0; step <= 18; step += 1) {
    pushBush(GRID_COLS + 1 + step, GRID_ROWS - 9 + step, {
      offsetX: 22 + step * 14,
      offsetY: 18 + step * 18,
      depth: 2 + Math.floor(step / 3),
      extraWidth: Math.max(10, 28 - step),
      zBoost: 6,
      region: 'bottom-right-deep-diagonal-fill',
    });

    pushBush(GRID_COLS + step, GRID_ROWS - 7 + step, {
      offsetX: 4 + step * 13,
      offsetY: 42 + step * 18,
      depth: 3 + Math.floor(step / 3),
      extraWidth: Math.max(8, 24 - step),
      zBoost: 6,
      region: 'bottom-right-deep-diagonal-fill',
    });
  }

  // === 추가 보강 6: 오른쪽 아래 바닥 쪽 빈 잔디 띠를 한 번 더 채움 ===
  for (let col = GRID_COLS + 3; col <= GRID_COLS + OUTER_TILE_PADDING + 22; col += 1) {
    pushBush(col, GRID_ROWS + 2, {
      offsetX: 14,
      offsetY: 78,
      depth: 2,
      extraWidth: 22,
      zBoost: 6,
      region: 'bottom-right-deep-floor-fill',
    });

    pushBush(col, GRID_ROWS + 3, {
      offsetX: 24,
      offsetY: 104,
      depth: 3,
      extraWidth: 18,
      zBoost: 6,
      region: 'bottom-right-deep-floor-fill',
    });

    pushBush(col, GRID_ROWS + 4, {
      offsetX: 34,
      offsetY: 130,
      depth: 4,
      extraWidth: 14,
      zBoost: 6,
      region: 'bottom-right-deep-floor-fill',
    });

    pushBush(col, GRID_ROWS + 5, {
      offsetX: 44,
      offsetY: 156,
      depth: 5,
      extraWidth: 10,
      zBoost: 6,
      region: 'bottom-right-deep-floor-fill',
    });
  }

  // === 추가 보강 7: 화면상 오른쪽 아래 변을 따라 수풀 벽처럼 한 겹 더 채움 ===
  for (let step = 0; step <= 16; step += 1) {
    pushBush(GRID_COLS + 8 + step, GRID_ROWS - 6 + step, {
      offsetX: 210 + step * 16,
      offsetY: 30 + step * 21,
      depth: 3 + Math.floor(step / 2),
      extraWidth: Math.max(8, 20 - step),
      zBoost: 7,
      region: 'bottom-right-wall-fill',
    });

    pushBush(GRID_COLS + 10 + step, GRID_ROWS - 8 + step, {
      offsetX: 260 + step * 16,
      offsetY: 4 + step * 21,
      depth: 4 + Math.floor(step / 2),
      extraWidth: Math.max(6, 18 - step),
      zBoost: 7,
      region: 'bottom-right-wall-fill',
    });
  }

  // === 추가 보강 8: 오른쪽 아래 최외곽 코너를 더 두껍게 채움 ===
  pushBushCluster(GRID_COLS + 19, GRID_ROWS + 10, 6, 2, 24, 14, 'bottom-right-final-corner');
  pushBushCluster(GRID_COLS + 22, GRID_ROWS + 12, 6, 2, 24, 14, 'bottom-right-final-corner');
  pushBushCluster(GRID_COLS + 24, GRID_ROWS + 14, 5, 3, 22, 13, 'bottom-right-final-corner');

  // 오른쪽 끝 상단 쪽까지 수풀 보강
  pushBushCluster(GRID_COLS + 15, GRID_ROWS - 4, 5, 1, 22, 12, 'right-far-bush');
  pushBushCluster(GRID_COLS + 17, GRID_ROWS - 1, 4, 2, 20, 11, 'right-far-bush');
  pushBushCluster(GRID_COLS + 18, GRID_ROWS + 3, 4, 2, 18, 10, 'right-far-bush');
  pushBushCluster(GRID_COLS + 20, GRID_ROWS + 1, 4, 2, 18, 10, 'right-far-bush');

  // 왼쪽 아래 약간 보강
  for (let col = -OUTER_TILE_PADDING - 4; col <= 2; col += 1) {
    pushBush(col, GRID_ROWS + 4, {
      offsetX: -8,
      offsetY: 98,
      depth: 2,
      extraWidth: 12,
      region: 'bottom-left-fill',
    });
  }

  // 오른쪽 아래 큰 나무는 실제 화면 기준으로 더 넓게 제거
  const bottomRightHardStart = gridToScreen(GRID_COLS - 3, GRID_ROWS - 10);

  const cleaned = result.filter((item) => {
    if (item.kind !== 'tree') return true;

    const isRightCut = item.x >= bottomRightHardStart.x - 250;
    const isBottomCut = item.y >= bottomRightHardStart.y - 360;

    if (isRightCut && isBottomCut) return false;

    return true;
  });

  return cleaned.sort((a, b) => a.zIndex - b.zIndex);
}

 //“화면을 드래그(패닝)할 때, 맵이 어디까지 움직일 수 있는지 최소값/최대값을 계산하는 함수
function getWorldPanBounds(viewportWidth, viewportHeight, scale) {//viewportWidth → 지금 사용자가 보는 화면 가로 크기, viewportHeight → 지금 사용자가 보는 화면 세로 크기, scale → 현재 확대/축소 비율
  //맵의 실제 경계 + 여유 영역을 계산하는 부분 
  const minVisibleX = -WORLD_EDGE_MARGIN_LEFT; // 월드 왼쪽 끝보다 조금 더 왼쪽까지 허용할 수 있게 함
  const maxVisibleX = WORLD_WIDTH + WORLD_EDGE_MARGIN_RIGHT; //월드 오른쪽 끝보다 조금 더 오른쪽까지 허용
  const minVisibleY = -WORLD_EDGE_MARGIN_TOP; //위쪽 여유
  const maxVisibleY = WORLD_HEIGHT + WORLD_EDGE_MARGIN_BOTTOM; //아래쪽 여

  //offsetX, offsetY는 보통: 월드 전체를 화면에서 얼마나 옮겨서 보여줄지 뜻 
  const minOffsetX = viewportWidth - maxVisibleX * //scale; 월드를 왼쪽으로 가장 많이 밀었을 때의 한계
  const maxOffsetX = -minVisibleX * scale; //월드를 오른쪽으로 가장 많이 밀었을 때의 한계
  const minOffsetY = viewportHeight - maxVisibleY * scale; //y도 똑같음
  const maxOffsetY = -minVisibleY * scale;

  return { minOffsetX, maxOffsetX, minOffsetY, maxOffsetY };
}

//플레이 가능한 영역(마름모 형태)의 중심과 크기(반지름)를 계산하는 함수 즉, 카메라가 움직일 수 있는 ‘다이아몬드 영역’을 정의하는 코드
function getPlayableDiamondBounds() {
  // 네 꼭짓점 구하기로 gridToScreen은 타일 좌표 → 실제 화면 좌표로 바꾸는 함수
  const top = gridToScreen(0, 0);
  const right = gridToScreen(GRID_COLS - 1, 0);
  const left = gridToScreen(0, GRID_ROWS - 1);
  const bottom = gridToScreen(GRID_COLS - 1, GRID_ROWS - 1);

  return {
    centerX: GRID_ORIGIN_X, //의미: 마름모의 중심 X 위치 ->  왜 origin 쓰냐? 아이소메트릭 맵은 중심 기준으로 만들어짐
    centerY: (top.y + bottom.y) / 2,
    radiusX: GRID_ORIGIN_X - left.x + VIEW_DIAMOND_CORNER_LIMIT_X, //가로 반지름 
    radiusY: ((bottom.y - top.y) / 2) + VIEW_DIAMOND_CORNER_LIMIT_Y, //세로 반지름
  };
}

//마름모(플레이 영역) 밖으로 나간 점을, 가장 가까운 경계 안쪽으로 다시 밀어 넣는 함수
function projectPointIntoDiamond(point, diamond) {
  // 중심에서 얼마나 떨어졌는지 
  const dx = point.x - diamond.centerX;
  const dy = point.y - diamond.centerY;
  //마름모 팔별 공식
  const normalized = Math.abs(dx) / diamond.radiusX + Math.abs(dy) / diamond.radiusY;

  if (normalized <= 1) return null; // ≤ 1 → 안쪽, > 1 → 바깥, 의미 : 이미 마름모 안 → 수정 필요 없음, 그래서 null 반환

  const scaleDown = 1 / normalized; //의미: 현재 얼마나 넘쳤는지 비율 계산
  return {
    x: diamond.centerX + dx * scaleDown,
    y: diamond.centerY + dy * scaleDown,
  };
}//의미: 중심 → 현재 점 방향은 그대로 유지, 거리만 줄임

//지금 화면(뷰포트)의 4개 꼭짓점이, 월드 좌표 기준으로 어디인지 계산하는 함수
function getViewportWorldCorners(offset, viewportWidth, viewportHeight, scale) {
  return [
    { x: (0 - offset.x) / scale, y: (0 - offset.y) / scale }, //좌상단
    { x: (viewportWidth - offset.x) / scale, y: (0 - offset.y) / scale },//우상단
    { x: (viewportWidth - offset.x) / scale, y: (viewportHeight - offset.y) / scale },//우하단
    { x: (0 - offset.x) / scale, y: (viewportHeight - offset.y) / scale },/좌하단
  ];
}

//카메라(offset)가 마름모 영역 밖으로 나가지 않도록 자동으로 보정하는 함수
function clampWorldOffsetToDiamond(nextOffset, viewportWidth, viewportHeight, scale) // 사용자가 드래그한 카메라 위치(nextOffset)를 마름모 영역 안에 맞게 자동으로 수정(corrected) 
{
  let corrected = { ...nextOffset }; //corrected = 수정할 offset
  const diamond = getPlayableDiamondBounds(); //diamond = 마름모 영역 정보

  for (let i = 0; i < 10; i += 1) //반복문 이유 : 한번 보정으로 부족할 수 있음, 여러번 조금씨 맞춰서 안정화
  {
    const corners = getViewportWorldCorners(corrected, viewportWidth, viewportHeight, scale);
    const corrections = [];

    corners.forEach((corner) => {
      const projected = projectPointIntoDiamond(corner, diamond); //corner = 화면의 한 꼭짓점, projected = 마름모 안쪽으로 밀어넣은 위치
      if (!projected) return; // 경우1 - 안쪽이면 아무것도 안함

      corrections.push({// 경우2 - 밖이면 보정값 계싼
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
  const [offset, setOffset] = useState({ x: -360, y: -120 });

  const scale = isOverview ? 0.21 : 0.46;

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
