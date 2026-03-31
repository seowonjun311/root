//**
 * 건물 이미지 에셋
 */

// 기본 fallback
export const castleImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/25e57f60f_castlepng.png';

// Lv1 건물
export const gymLv1Img =
  'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/3a2f2cf84_gym_lv1png.png';

export const libraryLv1Img =
  'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/01981e605_library_lv1png.png';

export const meditationLv1Img =
  'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f6271ac32_meditation_lv1png.png';

export const workshopLv1Img =
  'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/1e96fc004_workshop_lv1png.png';

// 카테고리별 건물 구조 (확장용)
export const buildings = {
  exercise: { lv1: gymLv1Img, lv2: null, lv3: null },
  study: { lv1: libraryLv1Img, lv2: null, lv3: null },
  mental: { lv1: meditationLv1Img, lv2: null, lv3: null },
  daily: { lv1: workshopLv1Img, lv2: null, lv3: null },
};

// 건물 가져오기 함수 (핵심)
export function getBuilding(category, level = 1) {
  const lvKey = level >= 3 ? 'lv3' : level >= 2 ? 'lv2' : 'lv1';
  return buildings[category]?.[lvKey] ?? buildings[category]?.lv1 ?? castleImg;
}
