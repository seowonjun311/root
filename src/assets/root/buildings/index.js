/**
 * 건물 이미지 에셋
 */

export const castleImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/25e57f60f_castlepng.png';

// 운동(exercise) 건물 레벨별 이미지
export const gymLv1Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/c7fcd0a74_gymlv1.png';
export const gymLv3Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/4defa2752_gymlv3.png';
export const gymLv5Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/a2c9b6f45_gymlv5.png';
export const gymLv7Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/5c2b00a4e_gymlv7.png';
export const gymLv10Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/592be63e1_gymlv10.png';
export const gymLv20Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7ed46b21a_gymlv20.png';
export const gymLv30Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/9f1e1a3c6_gymlv30.png';

export function getExerciseBuildingByLevel(level) {
  if (level >= 30) return gymLv30Img;
  if (level >= 20) return gymLv20Img;
  if (level >= 10) return gymLv10Img;
  if (level >= 7)  return gymLv7Img;
  if (level >= 5)  return gymLv5Img;
  if (level >= 3)  return gymLv3Img;
  return gymLv1Img;
}

export const libraryLv1Img    = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/01981e605_library_lv1png.png';

// 공부(study) 건물 레벨별 이미지
export const studyLv1Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/54943f45c_study_lv1.png';
export const studyLv3Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/1122bd6e4_study_lv3.png';
export const studyLv5Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/36e470c0b_study_lv5.png';
export const studyLv7Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/291123d96_study_lv7.png';
export const studyLv10Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/167acd7c1_study_lv10.png';
export const studyLv20Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/a0970da5b_study_lv20.png';
export const studyLv30Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/68c928703_study_lv30.png';
export const studyLv40Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/56f06fa27_study_lv40.png';
export const studyLv50Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/ade1075e7_study_lv50.png';
export const studyLv60Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/99a2f9254_study_lv60.png';
export const studyLv70Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7b9cea0fa_study_lv70.png';
export const studyLv80Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/014ea3ed6_study_lv80.png';
export const studyLv90Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/d8aca5fc3_study_lv90.png';
export const studyLv100Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/9142ecb45_study_lv100.png';
export const studyLv110Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/daf696bd3_study_lv110.png';
export const studyLv120Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/daf696bd3_study_lv110.png';

export function getStudyBuildingByLevel(level) {
  if (level >= 120) return studyLv120Img;
  if (level >= 110) return studyLv110Img;
  if (level >= 100) return studyLv100Img;
  if (level >= 90)  return studyLv90Img;
  if (level >= 80)  return studyLv80Img;
  if (level >= 70)  return studyLv70Img;
  if (level >= 60)  return studyLv60Img;
  if (level >= 50)  return studyLv50Img;
  if (level >= 40)  return studyLv40Img;
  if (level >= 30)  return studyLv30Img;
  if (level >= 20)  return studyLv20Img;
  if (level >= 10)  return studyLv10Img;
  if (level >= 7)   return studyLv7Img;
  if (level >= 5)   return studyLv5Img;
  if (level >= 3)   return studyLv3Img;
  return studyLv1Img;
}
// 정신(mental) 건물 레벨별 이미지
export const mentalLv1Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/ea6fe78b6_mental_lv1.png';
export const mentalLv3Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/6068d5bf1_mental_lv3.png';
export const mentalLv5Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/8d5cd5ff7_mental_lv5.png';
export const mentalLv7Img   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/73af21efc_mental_lv7.png';
export const mentalLv10Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/4218f9244_mental_lv10.png';
export const mentalLv20Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f22ebcd1a_mental_lv20.png';
export const mentalLv30Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/bc076e5b9_mental_lv30.png';
export const mentalLv40Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/081c02f75_mental_lv40.png';
export const mentalLv50Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/08bbf9267_mental_lv50.png';
export const mentalLv60Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/615c61303_mental_lv60.png';
export const mentalLv70Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/bae62ea52_mental_lv70.png';
export const mentalLv80Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/debeda7ce_mental_lv80.png';
export const mentalLv90Img  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/195f8d0e7_mental_lv90.png';
export const mentalLv100Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/df174cc7e_mental_lv100.png';
export const mentalLv110Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/5daddf406_mental_lv110.png';
export const mentalLv120Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/a031d4a57_mental_lv120.png';

export function getMentalBuildingByLevel(level) {
  if (level >= 120) return mentalLv120Img;
  if (level >= 110) return mentalLv110Img;
  if (level >= 100) return mentalLv100Img;
  if (level >= 90)  return mentalLv90Img;
  if (level >= 80)  return mentalLv80Img;
  if (level >= 70)  return mentalLv70Img;
  if (level >= 60)  return mentalLv60Img;
  if (level >= 50)  return mentalLv50Img;
  if (level >= 40)  return mentalLv40Img;
  if (level >= 30)  return mentalLv30Img;
  if (level >= 20)  return mentalLv20Img;
  if (level >= 10)  return mentalLv10Img;
  if (level >= 7)   return mentalLv7Img;
  if (level >= 5)   return mentalLv5Img;
  if (level >= 3)   return mentalLv3Img;
  return mentalLv1Img;
}

export const meditationLv1Img = mentalLv1Img;
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
  if (category === 'exercise') return getExerciseBuildingByLevel(level);
  if (category === 'daily') return getDailyBuildingByLevel(level);
  if (category === 'study') return getStudyBuildingByLevel(level);
  if (category === 'mental') return getMentalBuildingByLevel(level);
  return buildings[category]?.lv1 ?? castleImg;
}