/**
 * 장식 요소 이미지 에셋
 * 경로 위에 배치되는 나무, 돌, 깃발 등의 장식물을 정의합니다.
 */

// 기존 경로 에셋 (호환성 유지)
export const pathImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/b048bead2_pathpng.png';

export const decorations = {
  path: pathImg,   // 경로/길 이미지

  // 장식 오브젝트 (이미지 추가 시 URL 교체)
  tree: null,      // 나무
  stone: null,     // 돌
  flag: null,      // 깃발 (중간 목표 지점)
  flower: null,    // 꽃
  milestone: null, // 마일스톤 표지판
};

/**
 * 장식 이미지를 반환합니다.
 * @param {string} type - 'path' | 'tree' | 'stone' | 'flag' | 'flower' | 'milestone'
 * @returns {string|null}
 */
export function getDecoration(type) {
  return decorations[type] ?? null;
}