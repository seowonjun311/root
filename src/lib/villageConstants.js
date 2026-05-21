import { foxImg, alpacaImg, platypusImg } from '@/assets/root/characters';
import { dinoTile1Img, dinoTile2Img, dinoTile3Img, egyptTileImg } from '@/assets/root/tiles/index.js';
import { grassImg, treeImg, flowerImg, boneHutImg, mammothHutImg } from '@/assets/root/decorations';
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

// 테마 정의: 새 테마 추가 시 SHOP_THEMES에만 추가하면 됨
export const SHOP_THEMES = [
  {
    id: 'basic',
    label: '기본',
    emoji: '🌿',
    items: [
      { id: 'stone_house_1', label: '돌 주택', type: 'decoration', subtype: 'stone_house', price: 50, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/fee45281f_ChatGPTImage202652106_37_46-Photoroom.png' },
      { id: 'log_cabin_1', label: '통나무 집', type: 'decoration', subtype: 'log_cabin', price: 40, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/a7dc07c20_ChatGPTImage202652105_59_50-Photoroom.png' },
      { id: 'tile_grass_1', label: '잔디 타일', type: 'tile', subtype: 'grass', price: 30, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/46d775f39_-Photoroom.png' },
      { id: 'grass_1', label: '잔디', type: 'decoration', subtype: 'grass', price: 3, image: grassImg },
      { id: 'tree_1', label: '나무', type: 'decoration', subtype: 'tree', price: 8, image: treeImg },
      { id: 'flower_1', label: '꽃', type: 'decoration', subtype: 'flower', price: 5, image: flowerImg },
    ],
  },
  {
    id: 'dinosaur',
    label: '공룡시대',
    emoji: '🦕',
    items: [
      { id: 'tile_dino_1', label: '공룡시대 땅 1', type: 'tile', subtype: 'dino', price: 50, image: dinoTile1Img },
      { id: 'tile_dino_2', label: '공룡시대 땅 2', type: 'tile', subtype: 'dino2', price: 50, image: dinoTile2Img },
      { id: 'tile_dino_3', label: '공룡시대 땅 3', type: 'tile', subtype: 'dino3', price: 50, image: dinoTile3Img },
      { id: 'mammoth_hut_1', label: '매머드 움막', type: 'decoration', subtype: 'mammoth_hut', price: 45, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/5fac16f07_ChatGPTImage202642810_33_47-Photoroom.png' },
      { id: 'thatched_hut_dino_1', label: '움집', type: 'decoration', subtype: 'thatched_hut_dino', price: 35, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/217aafe7d_ChatGPTImage202642810_33_49-Photoroom.png' },
      { id: 'volcano_hut_1', label: '화산집', type: 'decoration', subtype: 'volcano_hut', price: 40, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/a2166f6a5_ChatGPTImage202642810_33_51-Photoroom.png' },
      { id: 'wooden_hut_1', label: '나무 오두막', type: 'decoration', subtype: 'wooden_hut', price: 35, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/0e3b3552d_ChatGPTImage202642810_33_54-Photoroom.png' },
      { id: 'stone_hut_1', label: '돌 오두막', type: 'decoration', subtype: 'stone_hut', price: 40, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/759808ec1_ChatGPTImage202642810_33_57-Photoroom.png' },
      { id: 'wooden_watchtower_1', label: '나무 망대', type: 'decoration', subtype: 'wooden_watchtower', price: 50, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/846c7a296_ChatGPTImage202642810_34_00-Photoroom.png' },
      { id: 'blacksmith_forge_1', label: '대장간', type: 'decoration', subtype: 'blacksmith_forge', price: 55, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/76cfe7407_ChatGPTImage202642810_34_03-Photoroom.png' },
      { id: 'primitive_tent_1', label: '원시 텐트', type: 'decoration', subtype: 'primitive_tent', price: 25, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/2d8126df4_ChatGPTImage202642810_34_05-Photoroom.png' },
      { id: 'jungle_palm_1', label: '정글 야자수', type: 'decoration', subtype: 'jungle_palm', price: 20, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/55aaaea7d_ChatGPTImage202642810_34_09-Photoroom.png' },
      { id: 'ancient_tree_1', label: '고대 나무', type: 'decoration', subtype: 'ancient_tree', price: 25, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/32dfe7ce8_ChatGPTImage202642810_34_10-Photoroom.png' },
      { id: 'brachiosaurus_1', label: '브라키오사우루스', type: 'decoration', subtype: 'brachiosaurus', price: 30, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/3adc0b9c5_ChatGPTImage202642810_34_11-Photoroom.png' },
      { id: 'triceratops_1', label: '트리케라톱스', type: 'decoration', subtype: 'triceratops', price: 30, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/9a879c08e_ChatGPTImage202642810_34_12-Photoroom.png' },
      { id: 'ankylosaurus_1', label: '안킬로사우루스', type: 'decoration', subtype: 'ankylosaurus', price: 32, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/6ecd3cdfd_ChatGPTImage202642810_34_13-Photoroom.png' },
      { id: 'carnotaurus_1', label: '카르노타우루스', type: 'decoration', subtype: 'carnotaurus', price: 35, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/5694099f1_ChatGPTImage202642810_34_15-Photoroom.png' },
      { id: 'bone_dino_1', label: '뼈 공룡', type: 'decoration', subtype: 'bone_dino', price: 40, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/633f3662c_ChatGPTImage202642810_34_16-Photoroom.png' },
      { id: 'golden_totem_1', label: '황금 토템', type: 'decoration', subtype: 'golden_totem', price: 450, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/762345fc7_ChatGPTImage202642810_34_20-Photoroom.png' },
      ],
  },
  {
    id: 'egypt',
    label: '이집트',
    emoji: '🏛️',
    items: [
      { id: 'pyramid_1', label: '피라미드', type: 'decoration', subtype: 'pyramid', price: 80, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7efebb662_ChatGPTImage202642810_09_26.png' },
      { id: 'sphinx_1', label: '스핑크스', type: 'decoration', subtype: 'sphinx', price: 100, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/3dfb1b37b_ChatGPTImage202651409_17_11-Photoroom.png' },
      { id: 'egypt_temple_1', label: '이집트 신전', type: 'decoration', subtype: 'egypt_temple', price: 90, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/0aa248db3_ChatGPTImage202642810_09_32-Photoroom.png' },
      { id: 'egypt_tomb_1', label: '이집트 신전2', type: 'decoration', subtype: 'egypt_tomb', price: 90, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/b970ac0e2_ChatGPTImage202651412_04_43-Photoroom.png' },
      { id: 'obelisk_1', label: '오벨리스크', type: 'decoration', subtype: 'obelisk', price: 60, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/3b65addb4_ChatGPTImage202642810_09_37-Photoroom.png' },
      { id: 'pharaoh_tent_1', label: '파라오의 천막', type: 'decoration', subtype: 'pharaoh_tent', price: 80, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/a0296de35_ChatGPTImage202642810_09_47-Photoroom.png' },
      { id: 'pharaoh_bazaar_1', label: '파라오 시장', type: 'decoration', subtype: 'pharaoh_bazaar', price: 85, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/2d354813a_ChatGPTImage202642810_09_42-Photoroom.png' },
      { id: 'pharaoh_palace_1', label: '이집트 주택', type: 'decoration', subtype: 'pharaoh_palace', price: 95, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/570c0eaa4_ChatGPTImage202642810_09_45-Photoroom.png' },
      { id: 'egypt_camel_1', label: '낙타', type: 'decoration', subtype: 'egypt_camel', price: 60, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/d67967890_ChatGPTImage202642810_09_49-Photoroom.png' },
      { id: 'anubis_1', label: '아누비스', type: 'decoration', subtype: 'anubis', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/dd63a75f9_ChatGPTImage202642810_09_52.png' },
      { id: 'egypt_mummy_1', label: '미라', type: 'decoration', subtype: 'egypt_mummy', price: 100, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/cfeccf354_ChatGPTImage202642810_10_03.png' },
      { id: 'pharaoh_throne_1', label: '파라오 왕좌', type: 'decoration', subtype: 'pharaoh_throne', price: 150, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/eb992eccd_ChatGPTImage202642810_10_05.png' },
      { id: 'egypt_treasury_1', label: '이집트 보물실', type: 'decoration', subtype: 'egypt_treasury', price: 180, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/97f42a681_ChatGPTImage202651404_57_32-Photoroom.png' },
      { id: 'pharaoh_tomb_1', label: '파라오 무덤', type: 'decoration', subtype: 'pharaoh_tomb', price: 200, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/e3ba2fd8b_ChatGPTImage202651404_55_00-Photoroom.png' },
      { id: 'bastet_1', label: '바스테트', type: 'decoration', subtype: 'bastet', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7eab4517d_ChatGPTImage202651404_37_37-Photoroom.png' },
      { id: 'egypt_palm_1', label: '이집트 야자수', type: 'decoration', subtype: 'egypt_palm', price: 40, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/16601936d_ChatGPTImage202651404_40_30-Photoroom.png' },
    ],
  },
  {
    id: 'japan',
    label: '일본',
    emoji: '🏯',
    items: [
      { id: 'tile_japan_garden_1', label: '일본 정원 타일', type: 'tile', subtype: 'japan_garden', price: 100, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/9da5403a0_ChatGPTImage202651506_08_20-Photoroom.png' },
      { id: 'japan_castle_1', label: '일본성', type: 'decoration', subtype: 'japan_castle', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/c3ff840a7_ChatGPTImage202651505_35_33-Photoroom.png' },
      { id: 'japan_pagoda_1', label: '일본 탑', type: 'decoration', subtype: 'japan_pagoda', price: 100, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/6f0885e7f_ChatGPTImage202651503_15_50-Photoroom.png' },
      { id: 'japan_inn_1', label: '일본 여관', type: 'decoration', subtype: 'japan_inn', price: 80, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/d10c07fb1_2026-04-23204336-Photoroom.png' },
      { id: 'japan_inn2_1', label: '일본 여관2', type: 'decoration', subtype: 'japan_inn2', price: 80, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/0756785c6_ChatGPTImage202651603_54_54-Photoroom.png' },
      { id: 'japan_mill_1', label: '물레방아 가게', type: 'decoration', subtype: 'japan_mill', price: 90, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/0fad2a90d_2026-04-23205124-Photoroom.png' },
      { id: 'japan_onsen_1', label: '온천', type: 'decoration', subtype: 'japan_onsen', price: 85, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/fc291de22_2026-04-23204940-Photoroom.png' },
      { id: 'japan_shop_1', label: '일본 상점', type: 'decoration', subtype: 'japan_shop', price: 110, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/c262b9377_2026-04-23204539-Photoroom.png' },
      { id: 'japan_tea_house_1', label: '다실', type: 'decoration', subtype: 'japan_tea_house', price: 160, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/d604595ee_ChatGPTImage202651506_00_15-Photoroom.png' },
      { id: 'japan_lucky_cat_1', label: '행운의 고양이', type: 'decoration', subtype: 'japan_lucky_cat', price: 50, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/477a4bb91_ChatGPTImage202651503_01_27-Photoroom.png' },
      { id: 'japan_cherry_tree_1', label: '벚꽃나무', type: 'decoration', subtype: 'japan_cherry_tree', price: 200, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/a204cec80_ChatGPTImage202651506_16_27-Photoroom.png' },
      { id: 'japan_lantern_1', label: '일본 랜턴', type: 'decoration', subtype: 'japan_lantern', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/24af2f5d0_2026-04-23205859-Photoroom.png' },
      { id: 'japan_sake_shop_1', label: '일본 주점', type: 'decoration', subtype: 'japan_sake_shop', price: 180, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/bf9f75d02_ChatGPTImage202651506_24_22-Photoroom.png' },
      { id: 'japan_komainu_1', label: '고마이누', type: 'decoration', subtype: 'japan_komainu', price: 90, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/10eed23c3_ChatGPTImage202651503_01_27-Photoroom.png' },
      { id: 'japan_stall_1', label: '일본 포장마차', type: 'decoration', subtype: 'japan_stall', price: 100, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/c57f406f7_ChatGPTImage202651503_20_52-Photoroom.png' },
      { id: 'japan_bamboo_1', label: '대나무', type: 'decoration', subtype: 'japan_bamboo', price: 30, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/ae3bea9bc_ChatGPTImage202651604_05_03-Photoroom.png' },
      ],
      },
  {
    id: 'joseon',
    label: '조선시대',
    emoji: '🏯',
    items: [
      { id: 'tile_joseon_1', label: '조선시대 돌바닥', type: 'tile', subtype: 'joseon', price: 80, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/edc8f44f5_image-Photoroom.png' },

      { id: 'joseon_palace_1', label: '궁전', type: 'decoration', subtype: 'joseon_palace', price: 150, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/d56b400eb_ChatGPTImage202642305_45_18-Photoroom.png' },
      { id: 'joseon_pavilion_1', label: '정자', type: 'decoration', subtype: 'joseon_pavilion', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/6b0675300_ChatGPTImage202642305_46_25-Photoroom.png' },
      { id: 'joseon_pavilion2_1', label: '누각', type: 'decoration', subtype: 'joseon_pavilion2', price: 130, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/106f4e0ca_ChatGPTImage202642305_48_00-Photoroom.png' },
      { id: 'joseon_pavilion3_1', label: '팔각정', type: 'decoration', subtype: 'joseon_pavilion3', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/cde3dafa0_ChatGPTImage202642306_00_40-Photoroom.png' },
      { id: 'joseon_tower_1', label: '누각탑', type: 'decoration', subtype: 'joseon_tower', price: 160, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/ddb9d1390_ChatGPTImage202651912_37_11-Photoroom.png' },
      { id: 'joseon_lantern_1', label: '석등', type: 'decoration', subtype: 'joseon_lantern', price: 50, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/04d72cad1_ChatGPTImage202642306_03_55-Photoroom.png' },
      { id: 'joseon_cherry_tree_1', label: '벚꽃나무', type: 'decoration', subtype: 'joseon_cherry_tree', price: 80, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/fb5c06920_ChatGPTImage202651910_26_28-Photoroom.png' },
      { id: 'joseon_small_cherry_tree_1', label: '작은 벚꽃나무', type: 'decoration', subtype: 'joseon_small_cherry_tree', price: 50, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/92324726f_ChatGPTImage202651911_35_36-Photoroom.png' },
      { id: 'joseon_pine_tree_1', label: '소나무', type: 'decoration', subtype: 'joseon_pine_tree', price: 60, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/17d18a84e_ChatGPTImage202651910_15_08-Photoroom.png' },
      { id: 'joseon_magnolia_tree_1', label: '목련나무', type: 'decoration', subtype: 'joseon_magnolia_tree', price: 100, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/d850eeb96_ChatGPTImage202651903_56_52-Photoroom.png' },
      { id: 'joseon_street_lamp_1', label: '조선 가로등', type: 'decoration', subtype: 'joseon_street_lamp', price: 50, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/61a8874c9_Gemini_Generated_Image_vopvrtvopvrtvopv-Photoroom.png' },
      { id: 'joseon_pond_1', label: '연못 정자', type: 'decoration', subtype: 'joseon_pond', price: 150, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/1570601c5_ChatGPTImage202642305_59_35-Photoroom.png' },
      { id: 'joseon_flag_1', label: '조선 깃발', type: 'decoration', subtype: 'joseon_flag', price: 60, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/bd97b1389_ChatGPTImage202651911_36_37-Photoroom.png' },
      { id: 'autumn_oak_1', label: '가을 참나무', type: 'decoration', subtype: 'autumn_oak', price: 100, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/e62894b08_ChatGPTImage202651902_31_22-Photoroom.png' },
      { id: 'red_maple_1', label: '붉은 단풍나무', type: 'decoration', subtype: 'red_maple_tree', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/22c109158_ChatGPTImage202651903_24_21-Photoroom.png' },
      { id: 'joseon_flower_garden_1', label: '화단', type: 'decoration', subtype: 'joseon_flower_garden', price: 140, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/d47c9c8d9_ChatGPTImage202651903_39_27-Photoroom.png' },
      { id: 'joseon_flower_garden2_1', label: '화단2', type: 'decoration', subtype: 'joseon_flower_garden2', price: 140, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/87c0b9aa5_ChatGPTImage202651903_52_57-Photoroom.png' },
      { id: 'joseon_waterfall_pond_1', label: '폭포연못', type: 'decoration', subtype: 'joseon_waterfall_pond', price: 180, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/85a7877ac_ChatGPTImage202651904_14_20-Photoroom.png' },
      { id: 'joseon_wildflower_bed_1', label: '들꽃밭', type: 'decoration', subtype: 'joseon_wildflower_bed', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7feb5ba62_ChatGPTImage202651904_46_32-Photoroom.png' },
      ],
      },
      {
    id: 'atlantis',
    label: '고대 아틀란티스',
    emoji: '🌊',
    items: [
      { id: 'tile_atlantis_1', label: '아틀란티스 타일', type: 'tile', subtype: 'atlantis', price: 100, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/21c9af158_ChatGPTImage202652003_47_09-Photoroom.png' },
      { id: 'atlantis_temple_1', label: '아틀란티스 신전', type: 'decoration', subtype: 'atlantis_temple', price: 150, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/6801c19b6_ChatGPTImage202652004_53_14-Photoroom.png' },
      { id: 'atlantis_palace_1', label: '아틀란티스 궁전', type: 'decoration', subtype: 'atlantis_palace', price: 250, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/3ee975ef4_ChatGPTImage202652005_16_55-Photoroom.png' },
      { id: 'atlantis_cathedral_1', label: '아틀란티스 대성당', type: 'decoration', subtype: 'atlantis_cathedral', price: 200, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/e81cec599_ChatGPTImage202651908_57_51-Photoroom.png' },
      { id: 'atlantis_chapel_1', label: '아틀란티스 예배당', type: 'decoration', subtype: 'atlantis_chapel', price: 150, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/2c6fcea72_ChatGPTImage202651908_43_25-Photoroom.png' },
      { id: 'atlantis_tower_1', label: '아틀란티스 탑', type: 'decoration', subtype: 'atlantis_tower', price: 180, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/de5883696_ChatGPTImage202652112_19_11-Photoroom.png' },
      { id: 'atlantis_guardian_1', label: '아틀란티스 수호신상', type: 'decoration', subtype: 'atlantis_guardian', price: 200, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/38f28e2e5_ChatGPTImage202651908_45_06-Photoroom.png' },
      { id: 'atlantis_dolphin_1', label: '아틀란티스 돌고래상', type: 'decoration', subtype: 'atlantis_dolphin', price: 150, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/8d803f482_ChatGPTImage202652001_02_30-Photoroom.png' },
      { id: 'atlantis_coral_1', label: '아틀란티스 황금 산호', type: 'decoration', subtype: 'atlantis_coral', price: 180, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/6545993d6_ChatGPTImage202651909_15_07-Photoroom.png' },
    ],
  },
  {
      id: 'steampunk',
    label: '스팀펑크',
    emoji: '⚙️',
    items: [
      { id: 'tile_steampunk_1', label: '스팀펑크 땅', type: 'tile', subtype: 'steampunk', price: 80, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/c2ec1c853_ChatGPTImage202651705_14_04-Photoroom.png' },
      { id: 'steampunk_clock_tower_1', label: '스팀펑크 시계탑', type: 'decoration', subtype: 'steampunk_clock_tower', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/26a9f5ef9_ChatGPTImage202642810_16_13-Photoroom.png' },
      { id: 'steampunk_engine_1', label: '스팀펑크 증기엔진', type: 'decoration', subtype: 'steampunk_engine', price: 100, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/59aa3c781_ChatGPTImage202642810_16_14-Photoroom.png' },
      { id: 'steampunk_shop_1', label: '스팀펑크 상점', type: 'decoration', subtype: 'steampunk_shop', price: 110, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/d3dd1a6eb_ChatGPTImage202642810_16_17-Photoroom.png' },
      { id: 'steampunk_station_1', label: '스팀펑크 기차역', type: 'decoration', subtype: 'steampunk_station', price: 130, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/ef99c4498_ChatGPTImage202642810_16_20-Photoroom.png' },
      { id: 'steampunk_airship_dock_1', label: '스팀펑크 비행선 도크', type: 'decoration', subtype: 'steampunk_airship_dock', price: 150, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/5463bf0ed_ChatGPTImage202642810_16_22-Photoroom.png' },
      { id: 'steampunk_house_1', label: '스팀펑크 주택', type: 'decoration', subtype: 'steampunk_house', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/db86656fb_ChatGPTImage202642810_16_29-Photoroom.png' },
      { id: 'steampunk_house2_1', label: '스팀펑크 주택2', type: 'decoration', subtype: 'steampunk_house2', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/75cd6378b_ChatGPTImage202642810_16_32-Photoroom.png' },
      { id: 'steampunk_house3_1', label: '스팀펑크 주택3', type: 'decoration', subtype: 'steampunk_house3', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f95d1732f_ChatGPTImage202642810_16_33-Photoroom.png' },
      { id: 'steampunk_dairy_1', label: '스팀펑크 유제품 가게', type: 'decoration', subtype: 'steampunk_dairy', price: 120, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/fa6c517c7_ChatGPTImage202642810_16_36-Photoroom.png' },
      { id: 'steampunk_pipe_factory_1', label: '스팀펑크 파이프 공장', type: 'decoration', subtype: 'steampunk_pipe_factory', price: 130, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f2c215d16_ChatGPTImage202642810_16_47-Photoroom.png' },
      { id: 'steampunk_steam_factory_1', label: '스팀펑크 증기 공장', type: 'decoration', subtype: 'steampunk_steam_factory', price: 140, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/3feb42a28_ChatGPTImage202642810_16_52-Photoroom.png' },
      { id: 'steampunk_lamp_1', label: '스팀펑크 가로등', type: 'decoration', subtype: 'steampunk_lamp', price: 50, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/c141f1897_ChatGPTImage202651409_44_00-Photoroom.png' },
      { id: 'steampunk_bench_1', label: '스팀펑크 벤치', type: 'decoration', subtype: 'steampunk_bench', price: 40, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/28257de3b_ChatGPTImage202651409_43_54-Photoroom.png' },
      { id: 'steampunk_trash_1', label: '스팀펑크 쓰레기통', type: 'decoration', subtype: 'steampunk_trash', price: 35, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/ba9640df5_ChatGPTImage202651409_43_37-Photoroom.png' },
      { id: 'steampunk_fountain_1', label: '스팀펑크 분수', type: 'decoration', subtype: 'steampunk_fountain', price: 200, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7d748ee59_ChatGPTImage202651812_13_37-Photoroom.png' },
      { id: 'fruit_tree_1', label: '과일나무', type: 'decoration', subtype: 'fruit_tree', price: 45, image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/0d75d0dd0_ChatGPTImage202651409_43_30-Photoroom.png' },
      ],
      },
      ];

// 기존 호환성 유지 (SHOP_ITEMS 사용처가 있을 경우 대비)
export const SHOP_ITEMS = SHOP_THEMES.flatMap((theme) => theme.items);

export const TILE_W = 128;
export const TILE_H = 64;
export const GRID_COLS = 10;
export const GRID_ROWS = 10;
export const GRID_ORIGIN_X = 1280;
export const GRID_ORIGIN_Y = 550;
export const WORLD_WIDTH = 2560;
export const WORLD_HEIGHT = 1700;
export const OUTER_TILE_PADDING = 1;
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
  { id: 'exercise_building', category: 'exercise', col: 1, row: 4, flipped: false },
  { id: 'study_building', category: 'study', col: 4, row: 5, flipped: false },
  { id: 'mental_building', category: 'mental', col: 6, row: 3, flipped: false },
  { id: 'daily_building', category: 'daily', col: 8, row: 2, flipped: false },
];

export const DEFAULT_VILLAGE_DATA = {
  village_points: 500,
  village_decorations: [
    { id: 'joseon_palace_1', type: 'joseon_palace', image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/d56b400eb_ChatGPTImage202642305_45_18-Photoroom.png', col: 3, row: 1, flipped: false, size: 440 },
    { id: 'joseon_pond_1', type: 'joseon_pond', image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/1570601c5_ChatGPTImage202642305_59_35-Photoroom.png', col: 6, row: 2, flipped: false, size: 420 },
    { id: 'joseon_cherry_tree_1', type: 'joseon_cherry_tree', image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/fb5c06920_ChatGPTImage202651910_26_28-Photoroom.png', col: 1, row: 5, flipped: false, size: 280 },
    { id: 'joseon_pavilion_1', type: 'joseon_pavilion', image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/6b0675300_ChatGPTImage202642305_46_25-Photoroom.png', col: 8, row: 7, flipped: false, size: 320 },
    { id: 'joseon_lantern_1', type: 'joseon_lantern', image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/04d72cad1_ChatGPTImage202642306_03_55-Photoroom.png', col: 2, row: 2, flipped: false, size: 160 },
    { id: 'joseon_lantern_2', type: 'joseon_lantern', image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/04d72cad1_ChatGPTImage202642306_03_55-Photoroom.png', col: 7, row: 8, flipped: false, size: 160 },
    { id: 'joseon_small_cherry_tree_1', type: 'joseon_small_cherry_tree', image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/92324726f_ChatGPTImage202651911_35_36-Photoroom.png', col: 5, row: 8, flipped: false, size: 320 },
    { id: 'joseon_pine_tree_1', type: 'joseon_pine_tree', image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/17d18a84e_ChatGPTImage202651910_15_08-Photoroom.png', col: 9, row: 4, flipped: false, size: 280 },
    { id: 'joseon_wildflower_bed_1', type: 'joseon_wildflower_bed', image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7feb5ba62_ChatGPTImage202651904_46_32-Photoroom.png', col: 2, row: 8, flipped: false, size: 170 },
    { id: 'joseon_wildflower_bed_2', type: 'joseon_wildflower_bed', image: 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7feb5ba62_ChatGPTImage202651904_46_32-Photoroom.png', col: 8, row: 5, flipped: false, size: 170 },
  ],
  village_characters: [],
  village_buildings: DEFAULT_BUILDINGS,
  village_tile_theme: 'joseon',
};

export const DEFAULT_VILLAGE_INVENTORY = {
  village_inventory_characters: [],
  village_inventory_decorations: [],
};