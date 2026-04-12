import { foxImg, alpacaImg, platypusImg } from '@/assets/root/characters';
import { grassImg, treeImg, flowerImg } from '@/assets/root/decorations';
import { borderTree1Img, borderTree2Img, borderTree3Img } from '@/assets/root/borderTrees/index.js';
import { borderBush1Img } from '@/assets/root/borderBushes/index.js';

export const CATEGORY_ROUTE_MAP = {
  exercise: '/CreateGoalExercise',
  study: '/CreateGoalStudy',
  mental: '/CreateGoalMental',
  daily: '/CreateGoalDaily',
};

export const CATEGORY_LABELS = {
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

export const CATEGORY_ALIASES = {
  exercise: 'exercise',
  study: 'study',
  mental: 'mental',
  daily: 'daily',
  운동: 'exercise',
  공부: 'study',
  정신: 'mental',
  일상: 'daily',
};

export const VALID_CATEGORIES = Object.keys(CATEGORY_LABELS);

export const TITLES = [
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

export const SHOP_ITEMS = [
  { id: 'fox_1', label: '여우', type: 'character', subtype: 'fox', price: 15, image: foxImg },
  { id: 'alpaca_1', label: '알파카', type: 'character', subtype: 'alpaca', price: 18, image: alpacaImg },
  { id: 'platypus_1', label: '오리너구리', type: 'character', subtype: 'platypus', price: 20, image: platypusImg },
  { id: 'grass_1', label: '잔디', type: 'decoration', subtype: 'grass', price: 3, image: grassImg },
  { id: 'tree_1', label: '나무', type: 'decoration', subtype: 'tree', price: 8, image: treeImg },
  { id: 'flower_1', label: '꽃', type: 'decoration', subtype: 'flower', price: 5, image: flowerImg },
];

export const TILE_W = 128;
export const TILE_H = 64;
export const GRID_COLS = 20;
export const GRID_ROWS = 20;
export const GRID_ORIGIN_X = 1280;
export const GRID_ORIGIN_Y = 220;
export const WORLD_WIDTH = 2560;
export const WORLD_HEIGHT = 1700;
export const OUTER_TILE_PADDING = 20;
export const WORLD_VIEWPORT_HEIGHT = 300;
export const WORLD_EDGE_MARGIN_LEFT = 10;
export const WORLD_EDGE_MARGIN_RIGHT = 100;
export const WORLD_EDGE_MARGIN_TOP = 100;
export const WORLD_EDGE_MARGIN_BOTTOM = 100;
export const VIEW_DIAMOND_CORNER_LIMIT_X = 1400;
export const VIEW_DIAMOND_CORNER_LIMIT_Y = 700;

export const TILE_KIND = {
  BASE_GRASS: 'base_grass',
  VARIANT_GRASS: 'variant_grass',
  PATH: 'path',
};

export const BORDER_TREE_IMAGES = [borderTree1Img, borderTree2Img, borderTree3Img];
export const BORDER_BUSH_IMAGES = [borderBush1Img];

export const DEFAULT_BUILDINGS = [
  { id: 'exercise_building', category: 'exercise', col: 6, row: 10, flipped: false },
  { id: 'study_building', category: 'study', col: 9, row: 11, flipped: false },
  { id: 'mental_building', category: 'mental', col: 12, row: 9, flipped: false },
  { id: 'daily_building', category: 'daily', col: 15, row: 8, flipped: false },
];

export const DEFAULT_VILLAGE_DATA = {
  village_points: 0,
  village_decorations: [],
  village_characters: [
    { id: 'starter_fox', name: '루', type: 'fox', col: 10, row: 12, size: 52, flipped: false },
  ],
  village_buildings: DEFAULT_BUILDINGS,
};

export const DEFAULT_VILLAGE_INVENTORY = {
  village_inventory_characters: [],
  village_inventory_decorations: [],
};