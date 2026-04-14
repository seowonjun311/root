/**
 * 캐릭터 이미지 에셋
 */

// 기존 에셋 (호환성 유지)
export const characterImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7660ae024_characterpng.png';

// 캐릭터별 이미지
export const foxImg      = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f4c341abd_foxpng.png';

// 여우 걷기 애니메이션 프레임
export const foxWalk1Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/11161dd11_foxwalk1png.png';
export const foxWalk2Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f55263d08_foxwalk2png.png';
export const foxWalk3Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/27d15627d_foxwalk3png.png';

export const foxWalkFrames = [foxWalk1Img, foxWalk2Img, foxWalk3Img];

// 여우 생각하기 애니메이션 프레임 (6장 순서대로)
export const foxThink1Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7eae21b8e_foxthinking1.png';
export const foxThink2Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/b2d7d931d_foxthinking2.png';
export const foxThink3Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/e6d2a10bf_foxthinking3.png';
export const foxThink4Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/90e28429d_foxthinking4.png';
export const foxThink5Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/999792fac_foxthinking5.png';
export const foxThink6Img = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/b4c6a59ca_foxthinking6.png';

export const foxThinkFrames = [foxThink1Img, foxThink2Img, foxThink3Img, foxThink4Img, foxThink5Img, foxThink6Img];

export const platypusImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/3852a75fa_platypuspng.png';
export const alpacaImg   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/184a54cf4_alpacapng.png';

export const characters = {
  fox: foxImg,
  platypus: platypusImg,
  alpaca: alpacaImg,
};

/**
 * 캐릭터 타입에 맞는 이미지를 반환합니다.
 * @param {string} type - 'fox' | 'platypus' | 'alpaca'
 * @returns {string}
 */
export function getCharacterImg(type) {
  return characters[type] ?? foxImg;
}

/**
 * 걷기 애니메이션 프레임 반환
 * @param {number} time - Date.now() 같은 시간값
 * @param {number} speed - 프레임 속도 (작을수록 빠름)
 */
export function getFoxWalkFrame(time, speed = 200) {
  const index = Math.floor(time / speed) % foxWalkFrames.length;
  return foxWalkFrames[index];
}