import React, { useMemo } from "react";

/**
 * 경계 나무 자동 생성 레이어
 *
 * 특징
 * - 맵 바깥 경계 위주로 자동 생성
 * - seed 기반 랜덤이라 새로고침해도 같은 배치 유지
 * - 크기/간격/살짝 겹침이 랜덤이라 자연스럽게 보임
 * - y값 기준 zIndex 정렬로 앞뒤 겹침이 자연스러움
 *
 * 사용 예시:
 * <BoundaryTreeLayer
 *   worldWidth={worldWidth}
 *   worldHeight={worldHeight}
 *   treeImages={[tree1, tree2, tree3]}
 *   seed="root-boundary-trees"
 * />
 */

function hashString(str = "") {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pickRandom(arr, rng) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[Math.floor(rng() * arr.length)];
}

function ellipseOverlap(a, b) {
  const ax = a.x;
  const ay = a.baseY;
  const bx = b.x;
  const by = b.baseY;

  const arx = a.hitW / 2;
  const ary = a.hitH / 2;
  const brx = b.hitW / 2;
  const bry = b.hitH / 2;

  const dx = ax - bx;
  const dy = ay - by;

  const rx = arx + brx;
  const ry = ary + bry;

  const nx = dx / (rx || 1);
  const ny = dy / (ry || 1);

  return nx * nx + ny * ny < 1;
}

function resolveNaturalOverlap(trees, worldWidth, worldHeight) {
  const next = trees.map((t) => ({ ...t }));

  for (let loop = 0; loop < 8; loop += 1) {
    for (let i = 0; i < next.length; i += 1) {
      for (let j = i + 1; j < next.length; j += 1) {
        const a = next[i];
        const b = next[j];

        if (!ellipseOverlap(a, b)) continue;

        const dx = a.x - b.x;
        const dy = a.baseY - b.baseY;

        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const push = 4;

        // y차이가 크면 일부 겹침 허용해서 더 자연스럽게
        const depthGap = Math.abs(a.baseY - b.baseY);
        if (depthGap > 20) continue;

        const ux = dx / dist;
        const uy = dy / dist;

        a.x += ux * push;
        a.baseY += uy * push;
        b.x -= ux * push;
        b.baseY -= uy * push;

        a.x = clamp(a.x, 20, worldWidth - 20);
        b.x = clamp(b.x, 20, worldWidth - 20);

        a.baseY = clamp(a.baseY, 20, worldHeight - 10);
        b.baseY = clamp(b.baseY, 20, worldHeight - 10);

        a.y = a.baseY - a.height;
        b.y = b.baseY - b.height;
      }
    }
  }

  return next;
}

function makeTree({
  x,
  baseY,
  width,
  height,
  img,
  side,
  rng,
}) {
  const wobbleX = (rng() - 0.5) * 10;
  const wobbleY = (rng() - 0.5) * 8;

  const finalX = x + wobbleX;
  const finalBaseY = baseY + wobbleY;

  return {
    id: `${side}-${Math.round(finalX)}-${Math.round(finalBaseY)}-${Math.round(width)}`,
    x: finalX,
    baseY: finalBaseY,
    y: finalBaseY - height,
    width,
    height,
    hitW: width * 0.42,
    hitH: height * 0.16,
    img,
    side,
    flip: rng() > 0.5,
    opacity: 0.94 + rng() * 0.06,
    rotate: (rng() - 0.5) * 3,
  };
}

function generateBoundaryTrees({
  worldWidth,
  worldHeight,
  treeImages,
  seed = "root-trees",
}) {
  const hash = hashString(`${seed}-${worldWidth}-${worldHeight}`)();
  const rng = mulberry32(hash);

  const trees = [];

  const marginOuter = 32;
  const topBand = 110;
  const bottomBand = 110;
  const sideBand = 90;

  const topCount = Math.max(10, Math.floor(worldWidth / 90));
  const bottomCount = Math.max(12, Math.floor(worldWidth / 78));
  const leftCount = Math.max(8, Math.floor(worldHeight / 95));
  const rightCount = Math.max(8, Math.floor(worldHeight / 95));

  function sizeForDepth(depthRatio) {
    // 아래쪽일수록 조금 크게
    const minW = 48;
    const maxW = 92;
    const w = minW + (maxW - minW) * depthRatio + (rng() - 0.5) * 12;
    const h = w * (1.35 + rng() * 0.25);
    return { width: w, height: h };
  }

  function addLine(side, count, getPos) {
    let cursorJitter = rng() * 25;

    for (let i = 0; i < count; i += 1) {
      const pos = getPos(i, count, cursorJitter);
      const depthRatio = clamp(pos.baseY / worldHeight, 0, 1);
      const { width, height } = sizeForDepth(depthRatio);
      const img = pickRandom(treeImages, rng);

      if (!img) continue;

      trees.push(
        makeTree({
          x: pos.x,
          baseY: pos.baseY,
          width,
          height,
          img,
          side,
          rng,
        })
      );

      // 드문드문 작은 보조 나무 추가
      if (rng() < 0.28) {
        const extraScale = 0.7 + rng() * 0.18;
        trees.push(
          makeTree({
            x: pos.x + (rng() - 0.5) * 34,
            baseY: pos.baseY + 6 + rng() * 12,
            width: width * extraScale,
            height: height * extraScale,
            img: pickRandom(treeImages, rng),
            side: `${side}-extra`,
            rng,
          })
        );
      }

      cursorJitter += 3 + rng() * 7;
    }
  }

  addLine("top", topCount, (i, count, cursorJitter) => {
    const step = (worldWidth - marginOuter * 2) / Math.max(1, count - 1);
    return {
      x: marginOuter + i * step + (rng() - 0.5) * 30,
      baseY: 18 + rng() * topBand,
    };
  });

  addLine("bottom", bottomCount, (i, count) => {
    const step = (worldWidth - marginOuter * 2) / Math.max(1, count - 1);
    return {
      x: marginOuter + i * step + (rng() - 0.5) * 26,
      baseY: worldHeight - (30 + rng() * bottomBand),
    };
  });

  addLine("left", leftCount, (i, count) => {
    const step = (worldHeight - 140) / Math.max(1, count - 1);
    return {
      x: 14 + rng() * sideBand,
      baseY: 70 + i * step + (rng() - 0.5) * 24,
    };
  });

  addLine("right", rightCount, (i, count) => {
    const step = (worldHeight - 140) / Math.max(1, count - 1);
    return {
      x: worldWidth - (14 + rng() * sideBand),
      baseY: 70 + i * step + (rng() - 0.5) * 24,
    };
  });

  // 코너 덩어리 추가
  const cornerCenters = [
    { x: 50, y: 55 },
    { x: worldWidth - 50, y: 55 },
    { x: 50, y: worldHeight - 55 },
    { x: worldWidth - 50, y: worldHeight - 55 },
  ];

  cornerCenters.forEach((corner, index) => {
    const clusterCount = 3 + Math.floor(rng() * 3);

    for (let i = 0; i < clusterCount; i += 1) {
      const depthRatio = clamp((corner.y + i * 8) / worldHeight, 0, 1);
      const { width, height } = sizeForDepth(depthRatio);

      trees.push(
        makeTree({
          x: corner.x + (rng() - 0.5) * 42,
          baseY: corner.y + (rng() - 0.5) * 30,
          width: width * (0.82 + rng() * 0.2),
          height: height * (0.82 + rng() * 0.2),
          img: pickRandom(treeImages, rng),
          side: `corner-${index}`,
          rng,
        })
      );
    }
  });

  const resolved = resolveNaturalOverlap(trees, worldWidth, worldHeight);

  return resolved
    .filter((t) => t.img)
    .sort((a, b) => a.baseY - b.baseY)
    .map((t, index) => ({
      ...t,
      zIndex: 100 + index,
    }));
}

export default function BoundaryTreeLayer({
  worldWidth = 1200,
  worldHeight = 800,
  treeImages = [],
  seed = "root-boundary-trees",
  className = "",
}) {
  const trees = useMemo(() => {
    if (!Array.isArray(treeImages) || treeImages.length === 0) return [];
    return generateBoundaryTrees({
      worldWidth,
      worldHeight,
      treeImages,
      seed,
    });
  }, [worldWidth, worldHeight, treeImages, seed]);

  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
      style={{ width: worldWidth, height: worldHeight }}
    >
      {trees.map((tree) => (
        <img
          key={tree.id}
          src={tree.img}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            left: tree.x - tree.width / 2,
            top: tree.y,
            width: tree.width,
            height: tree.height,
            objectFit: "contain",
            zIndex: tree.zIndex,
            opacity: tree.opacity,
            transform: `
              scaleX(${tree.flip ? -1 : 1})
              rotate(${tree.rotate}deg)
            `,
            transformOrigin: "bottom center",
            userSelect: "none",
            WebkitUserDrag: "none",
          }}
        />
      ))}
    </div>
  );
}
