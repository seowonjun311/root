/**
 * 배경 이미지 에셋
 * 카테고리별 배경 또는 테마별 배경을 정의합니다.
 * 실제 이미지 URL로 교체하세요.
 */

export const backgrounds = {
  exercise: {
    day: null,   // 운동 - 낮 배경
    night: null, // 운동 - 밤 배경
  },
  study: {
    day: null,   // 공부 - 낮 배경
    night: null, // 공부 - 밤 배경
  },
  mental: {
    day: null,   // 정신 - 낮 배경
    night: null, // 정신 - 밤 배경
  },
  daily: {
    day: null,   // 일상 - 낮 배경
    night: null, // 일상 - 밤 배경
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