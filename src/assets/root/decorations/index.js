/**
 * 데코레이션 이미지 에셋
 */

export const grassImg  = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/379f4f306_grasspng.png';
export const treeImg   = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/dd68b6a0f_treepng.png';
export const flowerImg = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/773d33e8a_flowerpng.png';

/* =========================
   선사시대 건물 오브젝트
========================= */
export const stoneCaveImg      = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/b0cfdce41_ChatGPTImage202642810_33_57.png';
export const woodTowerImg      = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/e9a9668aa_ChatGPTImage202642810_34_00.png';
export const smithyLargeImg    = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/1cf59e85b_ChatGPTImage202642810_34_03.png';
export const tentImg           = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/6cf547fc8_ChatGPTImage202642810_34_05.png';
export const smithySmallImg    = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/4e17e96aa_ChatGPTImage202642810_34_07.png';
export const boneHutImg        = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/c6db9f4f0_ChatGPTImage202642810_33_47.png';
export const thatchHutImg      = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/d97fc1190_ChatGPTImage202642810_33_49.png';
export const smokeHutImg       = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/b5d713b63_ChatGPTImage202642810_33_51.png';
export const woodHouseImg      = 'https://media.base44.com/images/public/69b63292a629cfa39a4ab7d3/829903cbb_ChatGPTImage202642810_33_54.png';

export const decorations = {
  grass: grassImg,
  tree: treeImg,
  flower: flowerImg,
  stone_cave: stoneCaveImg,
  wood_tower: woodTowerImg,
  smithy_large: smithyLargeImg,
  tent: tentImg,
  smithy_small: smithySmallImg,
  bone_hut: boneHutImg,
  thatch_hut: thatchHutImg,
  smoke_hut: smokeHutImg,
  wood_house: woodHouseImg,
};

/**
 * 데코레이션 타입에 맞는 이미지를 반환합니다.
 * @param {string} type
 * @returns {string}
 */
export function getDecoration(type) {
  return decorations[type] ?? grassImg;
}