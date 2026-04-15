import {
  TILE_W, TILE_H, GRID_COLS, GRID_ROWS, GRID_ORIGIN_X, GRID_ORIGIN_Y,
  OUTER_TILE_PADDING, WORLD_WIDTH, WORLD_HEIGHT,
  WORLD_EDGE_MARGIN_LEFT, WORLD_EDGE_MARGIN_RIGHT, WORLD_EDGE_MARGIN_TOP, WORLD_EDGE_MARGIN_BOTTOM,
  VIEW_DIAMOND_CORNER_LIMIT_X, VIEW_DIAMOND_CORNER_LIMIT_Y,
  TILE_KIND, BORDER_TREE_IMAGES, BORDER_BUSH_IMAGES,
  CATEGORY_ALIASES, VALID_CATEGORIES,
  DEFAULT_VILLAGE_DATA, DEFAULT_VILLAGE_INVENTORY, DEFAULT_BUILDINGS,
  TITLES,
} from './villageConstants';
import {
  foxImg,
  foxWalk1Img,
  foxWalk2Img,
  foxWalk3Img,
  foxWalkFrames,
  getFoxWalkFrame,
  foxThinkFrames,
  alpacaImg,
  platypusImg,
} from '@/assets/root/characters';
import { grassImg, treeImg, flowerImg } from '@/assets/root/decorations';
import { getBuilding } from '@/assets/root/buildings';
import { baseGrassTileImg, variantGrassTileImg, pathTileImg } from '@/assets/root/tiles/index.js';
import guestDataPersistence from '@/lib/GuestDataPersistence';


// --- 기본 유틸 ---
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function pseudoRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

export function normalizeDateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function normalizeCategoryValue(category, fallback = 'exercise') {
  const normalized = CATEGORY_ALIASES[category];
  if (normalized && VALID_CATEGORIES.includes(normalized)) return normalized;
  return fallback;
}

export function resolveCategoryKey(category, fallback = '') {
  const rawCategory = typeof category === 'string' ? category.trim() : '';
  if (!rawCategory) return fallback;
  return CATEGORY_ALIASES[rawCategory] || rawCategory;
}

// --- 그리드/좌표 ---
export function gridToScreen(col, row) {
  return {
    x: GRID_ORIGIN_X + (col - row) * (TILE_W / 2),
    y: GRID_ORIGIN_Y + (col + row) * (TILE_H / 2),
  };
}

export function screenToGrid(x, y) {
  const localX = x - GRID_ORIGIN_X;
  const localY = y - GRID_ORIGIN_Y;
  const col = Math.round(localY / TILE_H + localX / TILE_W);
  const row = Math.round(localY / TILE_H - localX / TILE_W);
  return {
    col: clamp(col, 0, GRID_COLS - 1),
    row: clamp(row, 0, GRID_ROWS - 1),
  };
}

export function getObjectTileSize(item, kind) {
  if (kind === 'building') return { cols: 2, rows: 2 };
  return { cols: 1, rows: 1 };
}

export function getOccupiedTiles(item, kind, nextCol = item?.col, nextRow = item?.row) {
  const { cols, rows } = getObjectTileSize(item, kind);
  const tiles = [];
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      tiles.push({ col: nextCol + c, row: nextRow + r });
    }
  }
  return tiles;
}

export function isInsideGrid(col, row) {
  return col >= 0 && row >= 0 && col < GRID_COLS && row < GRID_ROWS;
}

export function getWorldExpansionByLevel(totalLevel = 1) {
  const level = Number(totalLevel || 1);
  // 레벨 1마다 1칸씩 확장 (레벨1=0, 레벨2=1, 레벨3=2, ...)
  return Math.max(0, level - 1);
}

export function getExpandedGridBounds(totalLevel = 1) {
  const expansion = getWorldExpansionByLevel(totalLevel);

  // ⭐ 보이는 타일 범위와 동일하게 맞추기
  const visiblePadding = OUTER_TILE_PADDING + expansion;

  return {
    minCol: -visiblePadding,
    minRow: -visiblePadding,
    maxCol: GRID_COLS - 1 + visiblePadding,
    maxRow: GRID_ROWS - 1 + visiblePadding,
  };
}

export function isInsideExpandedGrid(col, row, totalLevel = 1) {
  const bounds = getExpandedGridBounds(totalLevel);

  return (
    col >= bounds.minCol &&
    row >= bounds.minRow &&
    col <= bounds.maxCol &&
    row <= bounds.maxRow
  );
}

export function canPlaceObject({
  movingType,
  movingItem,
  nextCol,
  nextRow,
  decorations = [],
  characters = [],
  buildings = [],
  totalLevel = 1,
}) {
  const nextTiles = getOccupiedTiles(movingItem, movingType, nextCol, nextRow);

  for (const tile of nextTiles) {
    if (!isInsideExpandedGrid(tile.col, tile.row, totalLevel)) return false;
  }

  const taken = new Map();

  const registerTiles = (items, kind) => {
    items.forEach((item) => {
      let isSame = false;

      if (kind === 'building') {
        isSame =
          movingType === 'building' &&
          (
            (movingItem?.id && item?.id && movingItem.id === item.id) ||
            (movingItem?.category && item?.category && movingItem.category === item.category)
          );
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

export function getObjectScreenPosition(item, kind) {
  const { x, y } = gridToScreen(item.col, item.row);
  if (kind === 'building') return { x, y: y + 100 };
  if (kind === 'character') return { x, y: y + 10 };
  return { x, y: y + 14 };
}

export function getPreviewTiles(item, kind, col, row) {
  return getOccupiedTiles(item, kind, col, row);
}

export function getPreviewColor(valid) {
  return valid
    ? { border: '2px solid rgba(34,197,94,0.95)', background: 'rgba(34,197,94,0.18)' }
    : { border: '2px solid rgba(239,68,68,0.95)', background: 'rgba(239,68,68,0.18)' };
}

// --- 날짜/주간 ---
export function getGoalEndDate(goal) {
  if (!goal?.start_date || !goal?.duration_days) return null;
  const start = new Date(goal.start_date);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start);
  end.setDate(end.getDate() + Number(goal.duration_days || 0));
  end.setHours(23, 59, 59, 999);
  return end;
}

export function getMonday(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function getSunday(date = new Date()) {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

export function getWeeklyLogsForAction(logs, actionGoalId) {
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

export function getAllLogsForAction(logs, actionGoalId) {
  return (logs || []).filter((log) => log?.action_goal_id === actionGoalId);
}

export function getStreakForAction(logs, actionGoalId) {
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

// --- 목표 그룹화 ---
export function groupActionGoals(actionGoals, today) {
  const todayItems = [];
  const scheduledItems = [];
  const overdueItems = [];

  (actionGoals || []).forEach((actionGoal) => {
    const isOneTime = actionGoal?.action_type === 'one_time';
    if (isOneTime) {
      const scheduledDate = normalizeDateOnly(
        actionGoal?.scheduled_date || actionGoal?.scheduledDate || actionGoal?.date || actionGoal?.target_date || actionGoal?.targetDate
      );
      const isCompleted = actionGoal?.status === 'completed' || actionGoal?.completed === true;
      if (isCompleted) return;
      if (!scheduledDate) { scheduledItems.push(actionGoal); return; }
      if (scheduledDate < today) { overdueItems.push(actionGoal); return; }
      if (scheduledDate === today) { todayItems.push(actionGoal); return; }
      scheduledItems.push(actionGoal);
      return;
    }
    const endDate = getGoalEndDate(actionGoal);
    if (endDate) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);
      const compareEnd = new Date(endDate);
      compareEnd.setHours(0, 0, 0, 0);
      if (compareEnd < todayDate) { overdueItems.push(actionGoal); return; }
    }
    todayItems.push(actionGoal);
  });

  const sortByDate = (a, b) => {
    const aDate = normalizeDateOnly(a?.scheduled_date || a?.scheduledDate || a?.date || a?.target_date || a?.targetDate) || '9999-12-31';
    const bDate = normalizeDateOnly(b?.scheduled_date || b?.scheduledDate || b?.date || b?.target_date || b?.targetDate) || '9999-12-31';
    return aDate.localeCompare(bDate);
  };
  scheduledItems.sort(sortByDate);
  overdueItems.sort(sortByDate);

  return { todayItems, scheduledItems, overdueItems };
}

// --- 경험치/레벨/포인트 ---
export function calculateExp(actionGoal, minutes = 0) {
  if (actionGoal?.action_type === 'one_time') return 20;
  if (actionGoal?.action_type === 'timer' || Number(minutes || 0) > 0) return 15;
  return 10;
}

export function calculateVillagePointReward(actionGoal, minutes = 0) {
  if (actionGoal?.action_type === 'one_time') return 5;
  if (actionGoal?.action_type === 'timer' || Number(minutes || 0) > 0) return 3;
  return 2;
}

export function getDefaultUserLevels(logs = []) {
  const result = { exercise_level: 1, exercise_xp: 0, study_level: 1, study_xp: 0, mental_level: 1, mental_xp: 0, daily_level: 1, daily_xp: 0 };
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

export function buildDerivedStats(logs = [], actionGoals = []) {
  const stats = { total_actions: 0, total_exercise_count: 0, total_study_minutes: 0, total_mental_count: 0, total_daily_count: 0, total_running_km: 0, total_no_smoking_days: 0 };
  (logs || []).forEach((log) => {
    if (!log?.completed) return;
    stats.total_actions += 1;
    if (log.category === 'exercise') { stats.total_exercise_count += 1; stats.total_running_km += Number(log.distance_km || 0); }
    if (log.category === 'study') { stats.total_study_minutes += Number(log.duration_minutes || 0); if (!log.duration_minutes || Number(log.duration_minutes) === 0) stats.total_study_minutes += 10; }
    if (log.category === 'mental') stats.total_mental_count += 1;
    if (log.category === 'daily') stats.total_daily_count += 1;
  });
  const abstainGoalIds = new Set((actionGoals || []).filter((goal) => goal?.category === 'mental' && goal?.action_type === 'abstain').map((goal) => goal.id));
  stats.total_no_smoking_days = (logs || []).filter((log) => log?.completed && abstainGoalIds.has(log?.action_goal_id)).length;
  return stats;
}

export function getNewlyUnlockedTitle(stats, ownedTitleIds = []) {
  const ownedSet = new Set(ownedTitleIds);
  return TITLES.find((title) => !ownedSet.has(title.id) && Number(stats?.[title.metric] || 0) >= title.value);
}

// --- 목표 연결 ---
export function resolveGoalIdForActionGoal(actionGoal, goals = [], fallbackCategory = 'exercise') {
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

export function connectActionGoalsToGoals(goals = [], actionGoals = []) {
  const safeGoals = Array.isArray(goals) ? goals.filter(Boolean) : [];
  const safeActionGoals = Array.isArray(actionGoals) ? actionGoals.filter(Boolean) : [];
  return safeActionGoals.map((actionGoal) => {
    const categoryKey = resolveCategoryKey(actionGoal?.category, 'exercise');
    const resolvedGoalId = resolveGoalIdForActionGoal(actionGoal, safeGoals, categoryKey);
    return { ...actionGoal, category: categoryKey, goal_id: resolvedGoalId };
  });
}

export function normalizeGuestGoals(rawGoals, fallbackCategory = 'exercise') {
  return (Array.isArray(rawGoals) ? rawGoals : []).filter(Boolean).map((goal, index) => ({
    ...goal,
    id: goal?.id || `local_goal_${index + 1}`,
    category: normalizeCategoryValue(goal?.category, fallbackCategory),
    status: goal?.status || 'active',
  }));
}

export function normalizeGuestActionGoals(rawActionGoals, goals = [], fallbackCategory = 'exercise') {
  return (Array.isArray(rawActionGoals) ? rawActionGoals : []).filter(Boolean).map((actionGoal, index) => {
    const category = normalizeCategoryValue(actionGoal?.category, fallbackCategory);
    const tempGoalId = actionGoal?.goal_id || goals.find((goal) => normalizeCategoryValue(goal?.category, '') === category)?.id || goals[0]?.id || null;
    return { ...actionGoal, id: actionGoal?.id || `local_ag_${index + 1}`, category, status: actionGoal?.status || 'active', goal_id: tempGoalId };
  });
}

export function validateGoalActionLogChain(goals = [], actionGoals = [], logs = []) {
  const goalIds = new Set((goals || []).map((goal) => goal?.id).filter(Boolean));
  const actionGoalIds = new Set((actionGoals || []).map((goal) => goal?.id).filter(Boolean));
  return {
    actionGoalsWithoutGoalId: (actionGoals || []).filter((goal) => !goal?.goal_id).length,
    logsWithoutGoalId: (logs || []).filter((log) => !log?.goal_id).length,
    logsWithUnknownActionGoal: (logs || []).filter((log) => log?.action_goal_id && !actionGoalIds.has(log.action_goal_id)).length,
    actionGoalsWithUnknownGoal: (actionGoals || []).filter((goal) => goal?.goal_id && !goalIds.has(goal.goal_id)).length,
  };
}

// --- 캐릭터/장식 ---
// frameIndex: 0-based 프레임 인덱스를 직접 전달
export function getCharacterImage(type, isMoving = false, frameIndex = 0) {
  if (type === 'alpaca') return alpacaImg;
  if (type === 'platypus') return platypusImg;

  if (type === 'fox') {
    // 이동 중 → 걷기 애니메이션
    if (isMoving) {
      return foxWalkFrames[frameIndex % foxWalkFrames.length];
    }

    // 멈춤 → 생각 애니메이션
    return foxThinkFrames[frameIndex % foxThinkFrames.length];
  }

  return foxThinkFrames[frameIndex % foxThinkFrames.length];
}

export function getDecorationImage(type) {
  if (type === 'tree') return treeImg;
  if (type === 'flower') return flowerImg;
  return grassImg;
}

export function createInventoryItem(item) {
  return {
    id: `${item.type}_${item.subtype}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    shop_item_id: item.id,
    type: item.type,
    subtype: item.subtype,
    label: item.label,
  };
}

export function createPlacedObjectFromInventory(inventoryItem) {
  if (inventoryItem?.type === 'character') return createCharacter(inventoryItem.subtype);
  return createDecoration(inventoryItem?.subtype || 'grass');
}

export function createDecoration(subtype) {
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

export function getCharacterSpawnSlots() {
  return [
    { col: 5, row: 6 }, { col: 6, row: 6 }, { col: 4, row: 6 },
    { col: 5, row: 5 }, { col: 6, row: 5 }, { col: 4, row: 5 },
    { col: 7, row: 6 }, { col: 3, row: 6 },
  ];
}

export function createCharacter(type) {
  const spawnSlots = getCharacterSpawnSlots();
  const spawn = spawnSlots[Math.floor(randomBetween(0, spawnSlots.length))] || { col: 10, row: 12 };
  return {
  id: `${type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
  name: type === 'alpaca' ? '파카' : type === 'platypus' ? '너구' : '루',
  type,
  image: getCharacterImage(type, false),
  col: spawn.col,
  row: spawn.row,
  size: type === 'alpaca' ? 56 : type === 'fox' ? 72 : 52,
  flipped: false,
  isMoving: false,
};
}

export function isCharacterTooFarFromVillageCore(character) {
  const col = Number(character?.col ?? 0);
  const row = Number(character?.row ?? 0);
  return col < 2 || col > 8 || row < 3 || row > 8;
}

export function relocateCharactersToVillageCore(rawCharacters = []) {
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
      if (!used.has(key)) { chosen = slot; break; }
    }
    next.col = chosen.col;
    next.row = chosen.row;
    used.add(`${chosen.col},${chosen.row}`);
    return next;
  });
}

export function getVillageState(source) {
  return {
    village_points: Number(source?.village_points ?? DEFAULT_VILLAGE_DATA.village_points),
    village_decorations: Array.isArray(source?.village_decorations) ? source.village_decorations : DEFAULT_VILLAGE_DATA.village_decorations,
    village_characters: relocateCharactersToVillageCore(
      Array.isArray(source?.village_characters) && source.village_characters.length > 0
        ? source.village_characters
        : DEFAULT_VILLAGE_DATA.village_characters
    ),
    village_buildings: Array.isArray(source?.village_buildings) && source.village_buildings.length > 0 ? source.village_buildings : DEFAULT_VILLAGE_DATA.village_buildings,
    village_inventory_characters: Array.isArray(source?.village_inventory_characters) ? source.village_inventory_characters : DEFAULT_VILLAGE_INVENTORY.village_inventory_characters,
    village_inventory_decorations: Array.isArray(source?.village_inventory_decorations) ? source.village_inventory_decorations : DEFAULT_VILLAGE_INVENTORY.village_inventory_decorations,
  };
}

// --- 건물 ---
export function buildWorldBuildings({ userLevels, buildingLayout }) {
  const exerciseLevel = Number(userLevels?.exercise_level || 1);
  const studyLevel = Number(userLevels?.study_level || 1);
  const mentalLevel = Number(userLevels?.mental_level || 1);
  const dailyLevel = Number(userLevels?.daily_level || 1);

  const layoutMap = Object.fromEntries((buildingLayout || []).map((b) => [b.category, b]));

  return [
    {
      id: 'exercise_building',
      category: 'exercise',
      label: `체육관 Lv.${exerciseLevel}`,
      image: getBuilding('exercise', exerciseLevel),
      col: layoutMap.exercise?.col ?? 1,
      row: layoutMap.exercise?.row ?? 4,
      flipped: !!layoutMap.exercise?.flipped,
      w: 168,
  h: 135,
    },
    {
      id: 'study_building',
      category: 'study',
      label: `도서관 Lv.${studyLevel}`,
      image: getBuilding('study', studyLevel),
      col: layoutMap.study?.col ?? 4,
      row: layoutMap.study?.row ?? 5,
      flipped: !!layoutMap.study?.flipped,
      w: 168,
  h: 135,
    },
    {
      id: 'mental_building',
      category: 'mental',
      label: `명상숲 Lv.${mentalLevel}`,
      image: getBuilding('mental', mentalLevel),
      col: layoutMap.mental?.col ?? 6,
      row: layoutMap.mental?.row ?? 3,
      flipped: !!layoutMap.mental?.flipped,
      w: 168,
  h: 135,
    },
    {
      id: 'daily_building',
      category: 'daily',
      label: `생활공방 Lv.${dailyLevel}`,
      image: getBuilding('daily', dailyLevel),
      col: layoutMap.daily?.col ?? 8,
      row: layoutMap.daily?.row ?? 2,
      flipped: !!layoutMap.daily?.flipped,
      w: 168,
  h: 135,
    },
  ];
}

// --- 타일맵 ---
export function getTileImageByKind(kind) {
  if (kind === TILE_KIND.VARIANT_GRASS) return variantGrassTileImg;
  return baseGrassTileImg;
}

export function isPathTile(col, row) {
  const pathA = Math.abs((col - row) - 1) <= 0;
  const pathB = row >= 9 && row <= 12 && col >= 8 && col <= 11;
  const pathC = row >= 4 && row <= 8 && col - row === 3;
  return pathA || pathB || pathC;
}

export function getGrassVariant(col, row) {
  const seed = (col * 17 + row * 29) % 7;
  return seed === 0 || seed === 3 ? TILE_KIND.VARIANT_GRASS : TILE_KIND.BASE_GRASS;
}

export function buildTileMap(cols, rows, padding = OUTER_TILE_PADDING) {
  const tiles = [];
  for (let row = -padding; row < rows + padding; row += 1) {
    for (let col = -padding; col < cols + padding; col += 1) {
      const isMainGrid = col >= 0 && row >= 0 && col < cols && row < rows;
      const kind = isMainGrid && isPathTile(col, row) ? TILE_KIND.PATH : getGrassVariant(col, row);
      tiles.push({ id: `tile-${col}-${row}`, col, row, kind });
    }
  }
  return tiles;
}

// --- 카메라/뷰포트 ---
export function getWorldPanBounds(viewportWidth, viewportHeight, scale) {
  const margin = 600; // ⭐ 시야 확장 핵심

  const minOffsetX = viewportWidth - WORLD_WIDTH * scale - margin;
  const maxOffsetX = margin;

  const minOffsetY = viewportHeight - WORLD_HEIGHT * scale - margin;
  const maxOffsetY = margin;

  return {
    minOffsetX,
    maxOffsetX,
    minOffsetY,
    maxOffsetY,
  };
}

export function getPlayableDiamondBounds() {
  const top = gridToScreen(0, 0);
  const bottom = gridToScreen(GRID_COLS - 1, GRID_ROWS - 1);
  const left = gridToScreen(0, GRID_ROWS - 1);
  return {
    centerX: GRID_ORIGIN_X,
    centerY: (top.y + bottom.y) / 2,
    radiusX: GRID_ORIGIN_X - left.x + VIEW_DIAMOND_CORNER_LIMIT_X,
    radiusY: ((bottom.y - top.y) / 2) + VIEW_DIAMOND_CORNER_LIMIT_Y,
  };
}

export function projectPointIntoDiamond(point, diamond) {
  const dx = point.x - diamond.centerX;
  const dy = point.y - diamond.centerY;
  const normalized = Math.abs(dx) / diamond.radiusX + Math.abs(dy) / diamond.radiusY;
  if (normalized <= 1) return null;
  const scaleDown = 1 / normalized;
  return { x: diamond.centerX + dx * scaleDown, y: diamond.centerY + dy * scaleDown };
}

export function getViewportWorldCorners(offset, viewportWidth, viewportHeight, scale) {
  return [
    { x: (0 - offset.x) / scale, y: (0 - offset.y) / scale },
    { x: (viewportWidth - offset.x) / scale, y: (0 - offset.y) / scale },
    { x: (viewportWidth - offset.x) / scale, y: (viewportHeight - offset.y) / scale },
    { x: (0 - offset.x) / scale, y: (viewportHeight - offset.y) / scale },
  ];
}

export function clampWorldOffsetToDiamond(nextOffset, viewportWidth, viewportHeight, scale) {
  let corrected = { ...nextOffset };
  const diamond = getPlayableDiamondBounds();
  for (let i = 0; i < 10; i += 1) {
    const corners = getViewportWorldCorners(corrected, viewportWidth, viewportHeight, scale);
    const corrections = [];
    corners.forEach((corner) => {
      const projected = projectPointIntoDiamond(corner, diamond);
      if (!projected) return;
      corrections.push({ x: -(projected.x - corner.x) * scale, y: -(projected.y - corner.y) * scale });
    });
    if (!corrections.length) break;
    const avgCorrection = corrections.reduce((acc, item) => ({ x: acc.x + item.x / corrections.length, y: acc.y + item.y / corrections.length }), { x: 0, y: 0 });
    corrected = { x: corrected.x + avgCorrection.x, y: corrected.y + avgCorrection.y };
    const rectBounds = getWorldPanBounds(viewportWidth, viewportHeight, scale);
    corrected = { x: clamp(corrected.x, rectBounds.minOffsetX, rectBounds.maxOffsetX), y: clamp(corrected.y, rectBounds.minOffsetY, rectBounds.maxOffsetY) };
  }
  return corrected;
}

export function clampWorldOffset(nextOffset, viewportWidth, viewportHeight, scale) {
  const { minOffsetX, maxOffsetX, minOffsetY, maxOffsetY } = getWorldPanBounds(viewportWidth, viewportHeight, scale);
  const rectClamped = { x: clamp(nextOffset.x, minOffsetX, maxOffsetX), y: clamp(nextOffset.y, minOffsetY, maxOffsetY) };
  return clampWorldOffsetToDiamond(rectClamped, viewportWidth, viewportHeight, scale);
}

// --- 게스트 데이터 ---

export function readGuestData() {
  try {
    if (typeof guestDataPersistence?.getData === 'function') return guestDataPersistence.getData() || {};
    if (typeof guestDataPersistence?.loadOnboardingData === 'function') return guestDataPersistence.loadOnboardingData() || {};
    return {};
  } catch (error) {
    console.error('readGuestData error:', error);
    return {};
  }
}

export function writeGuestDataPatch(patchOrUpdater) {
  try {
    if (typeof guestDataPersistence?.updateData === 'function') {
      return guestDataPersistence.updateData((prev) => {
        const draft = typeof patchOrUpdater === 'function' ? patchOrUpdater(prev) : { ...prev, ...(patchOrUpdater || {}) };
        const normalizedDraft = { ...(draft || {}) };
        if (Object.prototype.hasOwnProperty.call(normalizedDraft, 'local_action_logs')) {
          normalizedDraft.actionLogs = normalizedDraft.local_action_logs;
          delete normalizedDraft.local_action_logs;
        }
        return normalizedDraft;
      });
    }
    const prev = readGuestData();
    const next = typeof patchOrUpdater === 'function' ? patchOrUpdater(prev) : { ...prev, ...(patchOrUpdater || {}) };
    Object.entries(next || {}).forEach(([key, value]) => {
      const normalizedKey = key === 'local_action_logs' ? 'actionLogs' : key;
      if (typeof guestDataPersistence?.saveData === 'function') guestDataPersistence.saveData(normalizedKey, value);
    });
    return next;
  } catch (error) {
    console.error('writeGuestDataPatch error:', error);
    return readGuestData();
  }
}
