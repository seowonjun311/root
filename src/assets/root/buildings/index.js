/**
 * 건물 이미지 에셋
 * 카테고리별 건물 이미지 (Lv1 기준)
 */

// 기존 에셋 (호환성 유지)
export const castleImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/25e57f60f_castlepng.png';

// 카테고리별 건물 이미지 (Home.jsx에서 named import로 사용)
export const gymLv1Img        = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/3a2f2cf84_gym_lv1png.png';
export const libraryLv1Img    = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/01981e605_library_lv1png.png';
export const meditationLv1Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f6271ac32_meditation_lv1png.png';
export const workshopLv1Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/1e96fc004_workshop_lv1png.png';

// 구버전 호환 별칭
export const gymLv1        = gymLv1Img;
export const libraryLv1    = libraryLv1Img;
export const meditationLv1 = meditationLv1Img;
export const workshopLv1   = workshopLv1Img;

export const buildings = {
  exercise: { lv1: gymLv1Img, lv2: null, lv3: null },
  study:    { lv1: libraryLv1Img, lv2: null, lv3: null },
  mental:   { lv1: meditationLv1Img, lv2: null, lv3: null },
  daily:    { lv1: workshopLv1Img, lv2: null, lv3: null },
};

/**
 * 카테고리와 레벨에 맞는 건물 이미지를 반환합니다.
 * @param {string} category - 'exercise' | 'study' | 'mental' | 'daily'
 * @param {number} level - 1 | 2 | 3
 * @returns {string}
 */
export function getBuilding(category, level = 1) {
  const lvKey = level >= 3 ? 'lv3' : level >= 2 ? 'lv2' : 'lv1';
  return buildings[category]?.[lvKey] ?? buildings[category]?.lv1 ?? castleImg;
}