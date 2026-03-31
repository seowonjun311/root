/**
 * 데코레이션 이미지 에셋
 */

export const grassImg  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/f3fe8b0a8_grasspng.png';
export const treeImg   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/bec1fef4c_treepng.png';
export const flowerImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/773d33e8a_flowerpng.png';

export const decorations = {
  grass: grassImg,
  tree: treeImg,
  flower: flowerImg,
};

/**
 * 데코레이션 타입에 맞는 이미지를 반환합니다.
 * @param {string} type - 'grass' | 'tree' | 'flower'
 * @returns {string}
 */
export function getDecoration(type) {
  return decorations[type] ?? grassImg;
}