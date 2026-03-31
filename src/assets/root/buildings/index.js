/**
 * 건물/목표 지점 이미지 에셋
 * 카테고리별 목적지(성, 도서관 등) 이미지를 정의합니다.
 */

// 기존 에셋 (호환성 유지)
export const castleImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/25e57f60f_castlepng.png';

export const buildings = {
  exercise: castleImg, // 운동 - 성(기본)
  study: castleImg,    // 공부 - 성(기본) → 도서관 이미지로 교체 가능
  mental: castleImg,   // 정신 - 성(기본) → 사원 이미지로 교체 가능
  daily: castleImg,    // 일상 - 성(기본) → 집 이미지로 교체 가능
};

/**
 * 카테고리에 맞는 건물 이미지를 반환합니다.
 * @param {string} category - 'exercise' | 'study' | 'mental' | 'daily'
 * @returns {string}
 */
export function getBuilding(category) {
  return buildings[category] ?? castleImg;
}