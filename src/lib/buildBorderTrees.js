import {
  GRID_COLS, GRID_ROWS, OUTER_TILE_PADDING,
  BORDER_TREE_IMAGES, BORDER_BUSH_IMAGES,
} from './villageConstants';
import { gridToScreen, pseudoRandom } from './villageUtils';

export function buildBorderTrees() {
  const result = [];
  let idCounter = 0;

  const treeSizeFromSeed = (seed, depth = 0) => Math.round(228 + pseudoRandom(seed + depth * 17) * 108 - depth * 6);
  const bushWidthFromSeed = (seed, depth = 0) => Math.round(92 + pseudoRandom(seed + depth * 23) * 42 - depth * 3);
  const treeImageFromSeed = (seed) => BORDER_TREE_IMAGES[Math.floor(pseudoRandom(seed + 11) * BORDER_TREE_IMAGES.length) % BORDER_TREE_IMAGES.length];
  const bushImageFromSeed = (seed) => BORDER_BUSH_IMAGES[Math.floor(pseudoRandom(seed + 13) * BORDER_BUSH_IMAGES.length) % BORDER_BUSH_IMAGES.length];
  const flipFromSeed = (seed) => pseudoRandom(seed + 33) > 0.5;
  const opacityFromSeed = (seed) => 0.9 + pseudoRandom(seed + 57) * 0.1;
  const rotationFromSeed = (seed, amount = 5) => (pseudoRandom(seed + 71) - 0.5) * amount;

  const pushTree = (col, row, options = {}) => {
    const { offsetX = 0, offsetY = 0, depth = 0, extraWidth = 0, zBoost = 0, region = '' } = options;
    const seed = col * 1000 + row * 100 + depth * 17 + extraWidth + zBoost;
    const pos = gridToScreen(col, row);
    result.push({
      id: `border-tree-${idCounter++}`, kind: 'tree', region, col, row,
      x: pos.x + offsetX + (pseudoRandom(seed + 5) - 0.5) * 34,
      y: pos.y + offsetY + (pseudoRandom(seed + 9) - 0.5) * 26,
      width: treeSizeFromSeed(seed, depth) + extraWidth,
      image: treeImageFromSeed(seed),
      flipped: flipFromSeed(seed),
      opacity: opacityFromSeed(seed),
      rotation: rotationFromSeed(seed, 5),
      zIndex: 60 + (row + OUTER_TILE_PADDING + 10) * 10 + depth * 4 + col + zBoost,
    });
  };

  const pushBush = (col, row, options = {}) => {
    const { offsetX = 0, offsetY = 0, depth = 0, extraWidth = 0, zBoost = 0, region = '' } = options;
    const seed = col * 1200 + row * 140 + depth * 19 + extraWidth + zBoost;
    const pos = gridToScreen(col, row);
    result.push({
      id: `border-bush-${idCounter++}`, kind: 'bush', region, col, row,
      x: pos.x + offsetX + (pseudoRandom(seed + 3) - 0.5) * 18,
      y: pos.y + offsetY + (pseudoRandom(seed + 7) - 0.5) * 10,
      width: bushWidthFromSeed(seed, depth) + extraWidth,
      image: bushImageFromSeed(seed),
      flipped: flipFromSeed(seed),
      opacity: 0.92 + pseudoRandom(seed + 29) * 0.08,
      rotation: rotationFromSeed(seed, 2.2),
      zIndex: 120 + (row + OUTER_TILE_PADDING + 10) * 10 + depth * 4 + col + zBoost,
    });
  };

  const pushTreeCluster = (centerCol, centerRow, radius = 3, depthBase = 0, spreadX = 18, spreadY = 12, region = '') => {
    for (let row = centerRow - radius; row <= centerRow + radius; row += 1) {
      for (let col = centerCol - radius; col <= centerCol + radius; col += 1) {
        const distance = Math.abs(col - centerCol) + Math.abs(row - centerRow);
        if (distance > radius + 1) continue;
        pushTree(col, row, { offsetX: (col - centerCol) * spreadX, offsetY: (row - centerRow) * spreadY, depth: depthBase + distance, extraWidth: Math.max(0, 34 - distance * 7), zBoost: radius - distance, region });
      }
    }
  };

  const pushBushCluster = (centerCol, centerRow, radius = 3, depthBase = 0, spreadX = 14, spreadY = 8, region = '') => {
    for (let row = centerRow - radius; row <= centerRow + radius; row += 1) {
      for (let col = centerCol - radius; col <= centerCol + radius; col += 1) {
        const distance = Math.abs(col - centerCol) + Math.abs(row - centerRow);
        if (distance > radius + 1) continue;
        pushBush(col, row, { offsetX: (col - centerCol) * spreadX, offsetY: (row - centerRow) * spreadY, depth: depthBase + distance, extraWidth: Math.max(0, 18 - distance * 4), zBoost: radius - distance, region });
      }
    }
  };

  // 위쪽 경계
  for (let col = -OUTER_TILE_PADDING - 2; col <= GRID_COLS + OUTER_TILE_PADDING + 1; col += 1) {
    pushTree(col, -4, { offsetY: -96, depth: 0, extraWidth: 58, region: 'top' });
    pushTree(col, -3, { offsetY: -56, depth: 1, extraWidth: 36, region: 'top' });
    pushTree(col, -2, { offsetY: -16, depth: 2, extraWidth: 16, region: 'top' });
    if (col % 2 === 0) pushTree(col, -5, { offsetX: 24, offsetY: -132, depth: 3, extraWidth: 18, region: 'top' });
  }

  // 왼쪽 경계
  for (let row = -OUTER_TILE_PADDING - 2; row <= GRID_ROWS + OUTER_TILE_PADDING + 1; row += 1) {
    pushTree(-5, row, { offsetX: -164, offsetY: -12, depth: 0, extraWidth: 64, region: 'left' });
    pushTree(-4, row, { offsetX: -118, offsetY: -6, depth: 1, extraWidth: 42, region: 'left' });
    pushTree(-3, row, { offsetX: -72, depth: 2, extraWidth: 20, region: 'left' });
    pushTree(-2, row, { offsetX: -26, depth: 3, extraWidth: 8, region: 'left' });
  }

  // 오른쪽 경계
  for (let row = -OUTER_TILE_PADDING - 2; row <= GRID_ROWS + OUTER_TILE_PADDING + 1; row += 1) {
    const isBottomRightZone = row >= GRID_ROWS - 15;
    if (isBottomRightZone) {
      pushBush(GRID_COLS + 1, row, { offsetX: 18, offsetY: 16, depth: 0, extraWidth: 34, zBoost: 3, region: 'right-bottom' });
      pushBush(GRID_COLS + 2, row, { offsetX: 64, offsetY: 34, depth: 1, extraWidth: 32, zBoost: 3, region: 'right-bottom' });
      pushBush(GRID_COLS + 3, row, { offsetX: 114, offsetY: 54, depth: 2, extraWidth: 30, zBoost: 3, region: 'right-bottom' });
      pushBush(GRID_COLS + 4, row, { offsetX: 168, offsetY: 78, depth: 3, extraWidth: 28, zBoost: 3, region: 'right-bottom' });
      pushBush(GRID_COLS + 5, row, { offsetX: 222, offsetY: 104, depth: 4, extraWidth: 24, zBoost: 3, region: 'right-bottom' });
      pushBush(GRID_COLS + 6, row, { offsetX: 276, offsetY: 130, depth: 5, extraWidth: 20, zBoost: 3, region: 'right-bottom' });
      pushBush(GRID_COLS + 7, row, { offsetX: 330, offsetY: 154, depth: 6, extraWidth: 16, zBoost: 3, region: 'right-bottom' });
      pushBush(GRID_COLS + 8, row, { offsetX: 384, offsetY: 178, depth: 7, extraWidth: 12, zBoost: 3, region: 'right-bottom' });
    } else {
      pushTree(GRID_COLS + 1, row, { offsetX: 30, depth: 0, extraWidth: 12, region: 'right' });
      pushTree(GRID_COLS + 2, row, { offsetX: 78, depth: 1, extraWidth: 26, region: 'right' });
      pushTree(GRID_COLS + 3, row, { offsetX: 126, depth: 2, extraWidth: 42, region: 'right' });
      pushTree(GRID_COLS + 4, row, { offsetX: 172, offsetY: -10, depth: 3, extraWidth: 62, region: 'right' });
    }
  }

  // 아래쪽 경계
  for (let col = -OUTER_TILE_PADDING - 2; col <= GRID_COLS + OUTER_TILE_PADDING + 1; col += 1) {
    pushBush(col, GRID_ROWS + 1, { offsetY: 26, depth: 0, extraWidth: 24, region: 'bottom' });
    pushBush(col, GRID_ROWS + 2, { offsetY: 54, depth: 1, extraWidth: 18, region: 'bottom' });
    if (col % 2 === 0) pushBush(col, GRID_ROWS + 3, { offsetX: 12, offsetY: 80, depth: 2, extraWidth: 12, region: 'bottom' });
  }

  // 코너 보강
  pushTreeCluster(-6, -6, 5, 0, 24, 16, 'top-left');
  pushTreeCluster(GRID_COLS + 5, -6, 5, 0, 24, 16, 'top-right');
  pushBushCluster(-6, GRID_ROWS + 5, 5, 0, 20, 12, 'bottom-left');
  pushBushCluster(GRID_COLS + 5, GRID_ROWS + 5, 6, 0, 22, 14, 'bottom-right');
  pushBushCluster(GRID_COLS + 7, GRID_ROWS + 6, 7, 0, 24, 15, 'bottom-right');
  pushBushCluster(GRID_COLS + 8, GRID_ROWS + 3, 6, 1, 22, 13, 'bottom-right');
  pushBushCluster(GRID_COLS + 9, GRID_ROWS + 7, 6, 1, 24, 15, 'bottom-right');
  pushBushCluster(GRID_COLS + 10, GRID_ROWS + 4, 5, 2, 20, 12, 'bottom-right');
  pushBushCluster(GRID_COLS + 11, GRID_ROWS + 1, 7, 0, 24, 14, 'bottom-right');
  pushBushCluster(GRID_COLS + 12, GRID_ROWS + 4, 6, 1, 24, 14, 'bottom-right');
  pushBushCluster(GRID_COLS + 13, GRID_ROWS - 1, 5, 1, 22, 12, 'bottom-right');
  pushBushCluster(GRID_COLS + 9, GRID_ROWS - 2, 5, 1, 20, 11, 'bottom-right');
  pushTreeCluster(-7, -1, 4, 1, 20, 14, 'top-left-side');
  pushTreeCluster(GRID_COLS + 6, -1, 4, 1, 20, 14, 'top-right-side');
  pushBushCluster(-7, GRID_ROWS + 1, 4, 1, 18, 10, 'bottom-left-side');
  pushBushCluster(GRID_COLS + 6, GRID_ROWS + 1, 5, 1, 20, 12, 'bottom-right-side');
  pushBushCluster(GRID_COLS + 8, GRID_ROWS + 2, 6, 1, 22, 13, 'bottom-right-side');

  for (let col = GRID_COLS - 1; col <= GRID_COLS + OUTER_TILE_PADDING + 10; col += 1) {
    pushBush(col, GRID_ROWS + 4, { offsetX: 8, offsetY: 98, depth: 2, extraWidth: 18, region: 'bottom-right-fill' });
    pushBush(col, GRID_ROWS + 5, { offsetX: 16, offsetY: 122, depth: 3, extraWidth: 14, region: 'bottom-right-fill' });
    pushBush(col, GRID_ROWS + 6, { offsetX: 22, offsetY: 146, depth: 4, extraWidth: 10, region: 'bottom-right-fill' });
  }

  for (let row = GRID_ROWS - 10; row <= GRID_ROWS + OUTER_TILE_PADDING + 10; row += 1) {
    pushBush(GRID_COLS + 9, row, { offsetX: 430, offsetY: 92, depth: 3, extraWidth: 22, zBoost: 4, region: 'right-edge-bush-fill' });
    pushBush(GRID_COLS + 10, row, { offsetX: 492, offsetY: 118, depth: 4, extraWidth: 20, zBoost: 4, region: 'right-edge-bush-fill' });
    pushBush(GRID_COLS + 11, row, { offsetX: 554, offsetY: 144, depth: 5, extraWidth: 18, zBoost: 4, region: 'right-edge-bush-fill' });
    pushBush(GRID_COLS + 12, row, { offsetX: 616, offsetY: 168, depth: 6, extraWidth: 14, zBoost: 4, region: 'right-edge-bush-fill' });
    pushBush(GRID_COLS + 13, row, { offsetX: 676, offsetY: 192, depth: 7, extraWidth: 10, zBoost: 4, region: 'right-edge-bush-fill' });
  }

  for (let step = 0; step <= 12; step += 1) {
    pushBush(GRID_COLS + 2 + step, GRID_ROWS - 5 + step, { offsetX: 80 + step * 22, offsetY: 32 + step * 22, depth: 1 + Math.floor(step / 2), extraWidth: Math.max(8, 24 - step), region: 'bottom-right-diagonal', zBoost: 3 });
    pushBush(GRID_COLS + 1 + step, GRID_ROWS - 3 + step, { offsetX: 48 + step * 18, offsetY: 62 + step * 20, depth: 2 + Math.floor(step / 2), extraWidth: Math.max(6, 20 - step), region: 'bottom-right-diagonal', zBoost: 3 });
  }

  for (let step = 0; step <= 10; step += 1) {
    pushBush(GRID_COLS + 5 + step, GRID_ROWS - 7 + step, { offsetX: 160 + step * 18, offsetY: 10 + step * 24, depth: 1 + step, extraWidth: Math.max(6, 20 - step), region: 'bottom-right-cap', zBoost: 4 });
  }

  for (let col = GRID_COLS + 6; col <= GRID_COLS + OUTER_TILE_PADDING + 14; col += 1) {
    pushBush(col, GRID_ROWS + 7, { offsetX: 40, offsetY: 176, depth: 4, extraWidth: 14, zBoost: 4, region: 'bottom-right-floor-fill' });
    pushBush(col, GRID_ROWS + 8, { offsetX: 56, offsetY: 204, depth: 5, extraWidth: 10, zBoost: 4, region: 'bottom-right-floor-fill' });
  }

  pushBush(GRID_COLS + 6, GRID_ROWS + 1, { offsetX: 120, offsetY: 54, depth: 2, extraWidth: 20, zBoost: 7, region: 'bottom-right-micro-fill' });
  pushBush(GRID_COLS + 7, GRID_ROWS + 2, { offsetX: 154, offsetY: 78, depth: 3, extraWidth: 18, zBoost: 7, region: 'bottom-right-micro-fill' });
  pushBush(GRID_COLS + 8, GRID_ROWS + 3, { offsetX: 188, offsetY: 102, depth: 4, extraWidth: 16, zBoost: 7, region: 'bottom-right-micro-fill' });

  for (let step = 0; step <= 16; step += 1) {
    pushBush(GRID_COLS - 1 + step, GRID_ROWS - 8 + step, { offsetX: 36 + step * 16, offsetY: 34 + step * 18, depth: 1 + Math.floor(step / 3), extraWidth: Math.max(10, 26 - step), zBoost: 5, region: 'bottom-right-inner-edge-fill' });
    pushBush(GRID_COLS - 2 + step, GRID_ROWS - 6 + step, { offsetX: 12 + step * 15, offsetY: 54 + step * 18, depth: 2 + Math.floor(step / 3), extraWidth: Math.max(8, 22 - step), zBoost: 5, region: 'bottom-right-inner-edge-fill' });
  }

  for (let col = GRID_COLS + 2; col <= GRID_COLS + OUTER_TILE_PADDING + 18; col += 1) {
    pushBush(col, GRID_ROWS + 3, { offsetX: 18, offsetY: 96, depth: 2, extraWidth: 22, zBoost: 5, region: 'bottom-right-horizontal-fill' });
    pushBush(col, GRID_ROWS + 4, { offsetX: 28, offsetY: 122, depth: 3, extraWidth: 18, zBoost: 5, region: 'bottom-right-horizontal-fill' });
    pushBush(col, GRID_ROWS + 5, { offsetX: 38, offsetY: 148, depth: 4, extraWidth: 14, zBoost: 5, region: 'bottom-right-horizontal-fill' });
  }

  for (let step = 0; step <= 14; step += 1) {
    pushBush(GRID_COLS + 4 + step, GRID_ROWS - 4 + step, { offsetX: 122 + step * 20, offsetY: 46 + step * 22, depth: 2 + Math.floor(step / 2), extraWidth: Math.max(8, 22 - step), zBoost: 6, region: 'bottom-right-center-gap-fill' });
    if (step <= 12) pushBush(GRID_COLS + 6 + step, GRID_ROWS - 5 + step, { offsetX: 168 + step * 18, offsetY: 28 + step * 22, depth: 3 + Math.floor(step / 2), extraWidth: Math.max(6, 18 - step), zBoost: 6, region: 'bottom-right-center-gap-fill' });
  }

  pushBushCluster(GRID_COLS + 14, GRID_ROWS + 6, 6, 1, 24, 14, 'bottom-right-heavy-corner');
  pushBushCluster(GRID_COLS + 16, GRID_ROWS + 8, 6, 1, 24, 14, 'bottom-right-heavy-corner');
  pushBushCluster(GRID_COLS + 18, GRID_ROWS + 9, 5, 2, 22, 13, 'bottom-right-heavy-corner');
  pushBushCluster(GRID_COLS + 20, GRID_ROWS + 11, 5, 2, 22, 13, 'bottom-right-heavy-corner');

  for (let step = 0; step <= 18; step += 1) {
    pushBush(GRID_COLS + 1 + step, GRID_ROWS - 9 + step, { offsetX: 22 + step * 14, offsetY: 18 + step * 18, depth: 2 + Math.floor(step / 3), extraWidth: Math.max(10, 28 - step), zBoost: 6, region: 'bottom-right-deep-diagonal-fill' });
    pushBush(GRID_COLS + step, GRID_ROWS - 7 + step, { offsetX: 4 + step * 13, offsetY: 42 + step * 18, depth: 3 + Math.floor(step / 3), extraWidth: Math.max(8, 24 - step), zBoost: 6, region: 'bottom-right-deep-diagonal-fill' });
  }

  for (let col = GRID_COLS + 3; col <= GRID_COLS + OUTER_TILE_PADDING + 22; col += 1) {
    pushBush(col, GRID_ROWS + 2, { offsetX: 14, offsetY: 78, depth: 2, extraWidth: 22, zBoost: 6, region: 'bottom-right-deep-floor-fill' });
    pushBush(col, GRID_ROWS + 3, { offsetX: 24, offsetY: 104, depth: 3, extraWidth: 18, zBoost: 6, region: 'bottom-right-deep-floor-fill' });
    pushBush(col, GRID_ROWS + 4, { offsetX: 34, offsetY: 130, depth: 4, extraWidth: 14, zBoost: 6, region: 'bottom-right-deep-floor-fill' });
    pushBush(col, GRID_ROWS + 5, { offsetX: 44, offsetY: 156, depth: 5, extraWidth: 10, zBoost: 6, region: 'bottom-right-deep-floor-fill' });
  }

  for (let step = 0; step <= 16; step += 1) {
    pushBush(GRID_COLS + 8 + step, GRID_ROWS - 6 + step, { offsetX: 210 + step * 16, offsetY: 30 + step * 21, depth: 3 + Math.floor(step / 2), extraWidth: Math.max(8, 20 - step), zBoost: 7, region: 'bottom-right-wall-fill' });
    pushBush(GRID_COLS + 10 + step, GRID_ROWS - 8 + step, { offsetX: 260 + step * 16, offsetY: 4 + step * 21, depth: 4 + Math.floor(step / 2), extraWidth: Math.max(6, 18 - step), zBoost: 7, region: 'bottom-right-wall-fill' });
  }

  pushBushCluster(GRID_COLS + 19, GRID_ROWS + 10, 6, 2, 24, 14, 'bottom-right-final-corner');
  pushBushCluster(GRID_COLS + 22, GRID_ROWS + 12, 6, 2, 24, 14, 'bottom-right-final-corner');
  pushBushCluster(GRID_COLS + 24, GRID_ROWS + 14, 5, 3, 22, 13, 'bottom-right-final-corner');
  pushBushCluster(GRID_COLS + 15, GRID_ROWS - 4, 5, 1, 22, 12, 'right-far-bush');
  pushBushCluster(GRID_COLS + 17, GRID_ROWS - 1, 4, 2, 20, 11, 'right-far-bush');
  pushBushCluster(GRID_COLS + 18, GRID_ROWS + 3, 4, 2, 18, 10, 'right-far-bush');
  pushBushCluster(GRID_COLS + 20, GRID_ROWS + 1, 4, 2, 18, 10, 'right-far-bush');

  for (let col = -OUTER_TILE_PADDING - 4; col <= 2; col += 1) {
    pushBush(col, GRID_ROWS + 4, { offsetX: -8, offsetY: 98, depth: 2, extraWidth: 12, region: 'bottom-left-fill' });
  }

  const bottomRightHardStart = gridToScreen(GRID_COLS - 3, GRID_ROWS - 10);
  const cleaned = result.filter((item) => {
    if (item.kind !== 'tree') return true;
    const isRightCut = item.x >= bottomRightHardStart.x - 250;
    const isBottomCut = item.y >= bottomRightHardStart.y - 360;
    return !(isRightCut && isBottomCut);
  });

  return cleaned.sort((a, b) => a.zIndex - b.zIndex);
}