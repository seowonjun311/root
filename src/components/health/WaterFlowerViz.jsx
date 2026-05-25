import React from 'react';

// 꽃 이모지 배열 (테마 확장 가능 구조)
const FLOWER_THEMES = {
  default: ['🌸', '🌼', '🌺', '🌻', '💐'],
  cherry: ['🌸', '🌸', '🌸', '🌸', '🌸'],
  sunflower: ['🌻', '🌻', '🌻', '🌻', '🌻'],
};

function getFlower(index, theme = 'default') {
  const flowers = FLOWER_THEMES[theme] || FLOWER_THEMES.default;
  return flowers[index % flowers.length];
}

export default function WaterFlowerViz({ totalMl, goalMl = 2000, theme = 'default' }) {
  const flowerCount = Math.min(10, Math.floor(totalMl / 200));
  const isGoalReached = totalMl >= goalMl;
  const percent = Math.min(100, Math.round((totalMl / goalMl) * 100));

  return (
    <div className="flex flex-col items-center gap-2 py-3">
      {/* 꽃 그리드 */}
      <div className="flex flex-wrap justify-center gap-1.5 px-4" style={{ maxWidth: 220 }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const bloomed = i < flowerCount;
          return (
            <div
              key={i}
              className="flex items-center justify-center rounded-full transition-all duration-500"
              style={{
                width: 32,
                height: 32,
                fontSize: bloomed ? 20 : 14,
                opacity: bloomed ? 1 : 0.2,
                transform: bloomed ? 'scale(1)' : 'scale(0.75)',
                filter: isGoalReached && bloomed ? 'drop-shadow(0 0 6px rgba(255,180,100,0.9))' : 'none',
              }}
            >
              {bloomed ? getFlower(i, theme) : '🌱'}
            </div>
          );
        })}
      </div>

      {/* 수치 표시 */}
      <p className="text-xs text-muted-foreground font-semibold">
        <span className="text-foreground font-bold text-sm">{totalMl}ml</span>
        {' / '}{goalMl}ml
        {' '}
        <span className="text-primary">({percent}%)</span>
      </p>

      {/* 목표 달성 메시지 */}
      {isGoalReached && (
        <div className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full px-3 py-1">
          <span className="text-sm">🌟</span>
          <span className="text-xs font-bold text-amber-700 dark:text-amber-300">오늘의 수분 목표 달성!</span>
        </div>
      )}
    </div>
  );
}