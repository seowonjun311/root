/**
 * 배경 이미지 에셋
 * 카테고리별 배경 또는 테마별 배경을 정의합니다.
 * 실제 이미지 URL로 교체하세요.
 */

export const villageBaseImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/d1f80889d_village_basepng.png';

export const backgrounds = {
  exercise: {
    day: villageBaseImg,
    night: null,
  },
  study: {
    day: villageBaseImg,
    night: null,
  },
  mental: {
    day: villageBaseImg,
    night: null,
  },
  daily: {
    day: villageBaseImg,
    night: null,
  },
};

/**
 * 카테고리에 맞는 배경 이미지를 반환합니다.
 * @param {string} category - 'exercise' | 'study' | 'mental' | 'daily'
 * @param {string} timeOfDay - 'day' | 'night'
 * @returns {string|null}
 */
export function getBackground(category, timeOfDay = 'day') {
  return backgrounds[category]?.[timeOfDay] ?? null;
}