/**
 * 캐릭터 이미지 에셋
 * 상태별, 카테고리별 캐릭터 이미지를 정의합니다.
 */

// 기존 에셋 (호환성 유지)
export const characterImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7660ae024_characterpng.png';

export const characters = {
  default: characterImg,

  // 상태별 캐릭터
  idle: characterImg,    // 기본 대기 상태
  moving: characterImg,  // 이동 중 → 별도 이미지로 교체 가능
  victory: characterImg, // 목표 달성 → 별도 이미지로 교체 가능

  // 카테고리별 캐릭터 (필요 시 교체)
  exercise: characterImg,
  study: characterImg,
  mental: characterImg,
  daily: characterImg,
};

/**
 * 상태에 맞는 캐릭터 이미지를 반환합니다.
 * @param {string} state - 'idle' | 'moving' | 'victory'
 * @returns {string}
 */
export function getCharacter(state = 'idle') {
  return characters[state] ?? characterImg;
}

/**
 * 카테고리에 맞는 캐릭터 이미지를 반환합니다.
 * @param {string} category - 'exercise' | 'study' | 'mental' | 'daily'
 * @returns {string}
 */
export function getCharacterByCategory(category) {
  return characters[category] ?? characterImg;
}