/**
 * 건물 이미지 에셋
 */

import daily_lv1 from './daily_lv1.png';
import daily_lv3 from './daily_lv3.png';
import daily_lv5 from './daily_lv5.png';
import daily_lv7 from './daily_lv7.png';
import daily_lv9 from './daily_lv9.png';
import daily_lv10 from './daily_lv10.png';
import daily_lv20 from './daily_lv20.png';
import daily_lv30 from './daily_lv30.png';
import daily_lv40 from './daily_lv40.png';
import daily_lv50 from './daily_lv50.png';
import daily_lv60 from './daily_lv60.png';
import daily_lv70 from './daily_lv70.png';
import daily_lv80 from './daily_lv80.png';
import daily_lv90 from './daily_lv90.png';
import daily_lv100 from './daily_lv100.png';
import daily_lv110 from './daily_lv110.png';
import daily_lv120 from './daily_lv120.png';

export const DAILY_BUILDINGS = {
  daily_lv1,
  daily_lv3,
  daily_lv5,
  daily_lv7,
  daily_lv9,
  daily_lv10,
  daily_lv20,
  daily_lv30,
  daily_lv40,
  daily_lv50,
  daily_lv60,
  daily_lv70,
  daily_lv80,
  daily_lv90,
  daily_lv100,
  daily_lv110,
  daily_lv120,
};

export const castleImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/25e57f60f_castlepng.png';

export const gymLv1Img        = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/3a2f2cf84_gym_lv1png.png';
export const libraryLv1Img    = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/01981e605_library_lv1png.png';
export const meditationLv1Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f6271ac32_meditation_lv1png.png';
export const workshopLv1Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/1e96fc004_workshop_lv1png.png';

export const gymLv1        = gymLv1Img;
export const libraryLv1    = libraryLv1Img;
export const meditationLv1 = meditationLv1Img;
export const workshopLv1   = workshopLv1Img;

// 일상(daily) 건물 레벨별 이미지
export const dailyLv1Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/865b110cb_daily_lv1.png';
export const dailyLv3Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/607c443c8_daily_lv3.png';
export const dailyLv5Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/531ad3f23_daily_lv5.png';
export const dailyLv7Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f9d1eb495_daily_lv7.png';
export const dailyLv9Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/009bbc132_daily_lv9.png';
export const dailyLv10Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/2d29c99ea_daily_lv10.png';
export const dailyLv20Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/ccef2f7cd_daily_lv20.png';
export const dailyLv30Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/fd7cd5f5d_daily_lv30.png';
export const dailyLv40Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/5763a6e05_daily_lv40.png';
export const dailyLv50Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/16a84aa95_daily_lv50.png';
export const dailyLv60Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/824975782_daily_lv60.png';
export const dailyLv70Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/9c3d934a8_daily_lv70.png';
export const dailyLv80Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/31c5369b7_daily_lv80.png';
export const dailyLv90Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f575f4f2d_daily_lv90.png';
export const dailyLv100Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/cf45950f7_daily_lv100.png';
export const dailyLv110Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/56e4c30f2_daily_lv110.png';
export const dailyLv120Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/2c61ae373_daily_lv120.png';

// 레벨에 따라 일상 건물 이미지 반환
export function getDailyBuildingByLevel(level) {
  if (level >= 120) return dailyLv120Img;
  if (level >= 110) return dailyLv110Img;
  if (level >= 100) return dailyLv100Img;
  if (level >= 90)  return dailyLv90Img;
  if (level >= 80)  return dailyLv80Img;
  if (level >= 70)  return dailyLv70Img;
  if (level >= 60)  return dailyLv60Img;
  if (level >= 50)  return dailyLv50Img;
  if (level >= 40)  return dailyLv40Img;
  if (level >= 30)  return dailyLv30Img;
  if (level >= 20)  return dailyLv20Img;
  if (level >= 10)  return dailyLv10Img;
  if (level >= 9)   return dailyLv9Img;
  if (level >= 7)   return dailyLv7Img;
  if (level >= 5)   return dailyLv5Img;
  if (level >= 3)   return dailyLv3Img;
  return dailyLv1Img;
}

export const buildings = {
  exercise: { lv1: gymLv1Img, lv2: null, lv3: null },
  study:    { lv1: libraryLv1Img, lv2: null, lv3: null },
  mental:   { lv1: meditationLv1Img, lv2: null, lv3: null },
  daily:    { lv1: workshopLv1Img, lv2: null, lv3: null },
};

export function getBuilding(category, level = 1) {
  if (category === 'daily') return getDailyBuildingByLevel(level);
  const lvKey = level >= 3 ? 'lv3' : level >= 2 ? 'lv2' : 'lv1';
  return buildings[category]?.[lvKey] ?? buildings[category]?.lv1 ?? castleImg;
}
