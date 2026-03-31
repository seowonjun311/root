/**
 * 캐릭터 이미지 에셋
 */

// 기존 에셋 (호환성 유지)
export const characterImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/7660ae024_characterpng.png';

// 캐릭터별 이미지
export const foxImg      = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f4c341abd_foxpng.png';
export const platypusImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/22455bc06_platypuspng.png';
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