import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { foxImg } from '@/assets/root/characters';
import { getBackground } from '@/assets/root/backgrounds';
import { getBuilding } from '@/assets/root/buildings';

const WORLD_WIDTH = 700;
const WORLD_HEIGHT = 450;
const VIEWPORT_HEIGHT = 300;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function pointInRect(x, y, rect, padding = 0) {
  return (
    x >= rect.left - padding &&
    x <= rect.right + padding &&
    y >= rect.top - padding &&
    y <= rect.bottom + padding
  );
}

function isBlockedByBuildings(x, y, buildings = [], padding = 16) {
  return buildings.some((rect) => pointInRect(x, y, rect, padding));
}

function buildBuildingHitboxes(buildings = []) {
  return buildings.map((building) => ({
    id: building.id,
    left: building.x - building.w * 0.45,
    right: building.x + building.w * 0.45,
    top: building.y - building.h * 0.25,
    bottom: building.y + building.h * 0.35,
  }));
}

function buildWorldBuildings({ userLevels, buildingLayout }) {
  const exerciseLevel = Number(userLevels?.exercise_level || 1);
  const studyLevel = Number(userLevels?.study_level || 1);
  const mentalLevel = Number(userLevels?.mental_level || 1);
  const dailyLevel = Number(userLevels?.daily_level || 1);

  const getStage = (level) => (level >= 7 ? 3 : level >= 3 ? 2 : 1);
  const layoutMap = Object.fromEntries((buildingLayout || []).map((b) => [b.category, b]));

  return [
    {
      id: 'exercise_building', category: 'exercise',
      label: `체육관 Lv.${getStage(exerciseLevel)}`,
      image: getBuilding('exercise', getStage(exerciseLevel)),
      x: layoutMap.exercise?.x ?? 88, y: layoutMap.exercise?.y ?? 246,
      flipped: !!layoutMap.exercise?.flipped, w: 92, h: 74,
    },
    {
      id: 'study_building', category: 'study',
      label: `도서관 Lv.${getStage(studyLevel)}`,
      image: getBuilding('study', getStage(studyLevel)),
      x: layoutMap.study?.x ?? 210, y: layoutMap.study?.y ?? 278,
      flipped: !!layoutMap.study?.flipped, w: 92, h: 74,
    },
    {
      id: 'mental_building', category: 'mental',
      label: `명상숲 Lv.${getStage(mentalLevel)}`,
      image: getBuilding('mental', getStage(mentalLevel)),
      x: layoutMap.mental?.x ?? 390, y: layoutMap.mental?.y ?? 264,
      flipped: !!layoutMap.mental?.flipped, w: 92, h: 74,
    },
    {
      id: 'daily_building', category: 'daily',
      label: `생활공방 Lv.${getStage(dailyLevel)}`,
      image: getBuilding('daily', getStage(dailyLevel)),
      x: layoutMap.daily?.x ?? 548, y: layoutMap.daily?.y ?? 222,
      flipped: !!layoutMap.daily?.flipped, w: 92, h: 74,
    },
  ];
}

function moveNpcAvoidingBuildings(npc, buildingHitboxes) {
  for (let i = 0; i < 20; i += 1) {
    const nextX = clamp(npc.x + randomBetween(-34, 34), 48, WORLD_WIDTH - 48);
    const nextY = clamp(npc.y + randomBetween(-28, 28), 50, WORLD_HEIGHT - 48);
    if (!isBlockedByBuildings(nextX, nextY, buildingHitboxes, 18)) {
      return { ...npc, x: nextX, y: nextY, flipped: nextX < npc.x ? true : nextX > npc.x ? false : npc.flipped };
    }
  }
  return npc;
}

function getOffsetBounds(viewportWidth, viewportHeight, worldWidth, worldHeight, scale) {
  const scaledWidth = worldWidth * scale;
  const scaledHeight = worldHeight * scale;
  const centeredX = (viewportWidth - scaledWidth) / 2;
  const centeredY = (viewportHeight - scaledHeight) / 2;

  return {
    minX: scaledWidth <= viewportWidth ? centeredX : viewportWidth - scaledWidth,
    maxX: scaledWidth <= viewportWidth ? centeredX : 0,
    minY: scaledHeight <= viewportHeight ? centeredY : viewportHeight - scaledHeight,
    maxY: scaledHeight <= viewportHeight ? centeredY : 0,
  };
}

function DecorationSprite({ item }) {
  return (
    <img
      src={item.image}
      alt={item.type}
      draggable={false}
      style={{
        width: item.size, height: item.size, objectFit: 'contain', display: 'block',
        background: 'transparent', backgroundColor: 'transparent',
        border: 'none', boxShadow: 'none', userSelect: 'none',
        WebkitUserDrag: 'none', pointerEvents: 'none',
      }}
    />
  );
}

function VillageOverlayBar({ nickname, level, points, isOverview, onToggleOverview, onOpenShop, onOpenBag }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="pointer-events-auto rounded-2xl px-3 py-2" style={{ background: 'rgba(255,248,232,0.82)', border: '1px solid rgba(107,78,21,0.14)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>
          <div className="text-[11px] font-bold" style={{ color: '#8a5a17' }}>{nickname}</div>
          <div className="text-[14px] font-extrabold" style={{ color: '#4a2c08' }}>전체 Lv.{level}</div>
        </div>
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: 'rgba(255,248,232,0.9)', color: '#4a2c08', border: '1px solid rgba(107,78,21,0.14)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>포인트 {points}</div>
          <button type="button" onClick={onOpenBag} className="rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: '#fff', color: '#4a2c08', border: '1px solid rgba(107,78,21,0.14)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>가방</button>
          <button type="button" onClick={onOpenShop} className="rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: '#fff', color: '#4a2c08', border: '1px solid rgba(107,78,21,0.14)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>상점</button>
          <button type="button" onClick={onToggleOverview} className="rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: isOverview ? 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)' : 'rgba(255,248,232,0.9)', color: isOverview ? '#fff8e8' : '#4a2c08', border: isOverview ? '2px solid #6b4e15' : '1px solid rgba(107,78,21,0.14)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>{isOverview ? '기본보기' : '전체보기'}</button>
        </div>
      </div>
    </div>
  );
}

function EditToolbar({ isEditMode, selectedObject, onToggleEditMode, onFlip, onSave, onCancel }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-3">
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={onToggleEditMode} className="pointer-events-auto rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: isEditMode ? 'linear-gradient(180deg, #d97a5c 0%, #c25c3c 100%)' : 'rgba(255,248,232,0.92)', color: isEditMode ? '#fff8e8' : '#4a2c08', border: isEditMode ? '2px solid #7f321d' : '1px solid rgba(107,78,21,0.14)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>
          {isEditMode ? '편집 종료' : '편집모드'}
        </button>
        {isEditMode && (
          <div className="pointer-events-auto flex items-center gap-2">
            <button type="button" disabled={!selectedObject} onClick={onFlip} className="rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: !selectedObject ? '#efe7d8' : '#fff', color: !selectedObject ? '#a19380' : '#4a2c08', border: '1px solid rgba(107,78,21,0.14)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>좌우반전</button>
            <button type="button" onClick={onCancel} className="rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: '#fff', color: '#4a2c08', border: '1px solid rgba(107,78,21,0.14)', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>취소</button>
            <button type="button" onClick={onSave} className="rounded-full px-3 py-2 text-[12px] font-extrabold" style={{ background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)', color: '#fff8e8', border: '2px solid #6b4e15', boxShadow: '0 8px 16px rgba(50,30,0,0.08)' }}>저장</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VillageWorldLayer({
  activeCategory, isOverview, nickname, totalLevel, points, userLevels,
  decorations, setDecorations, characters, setCharacters,
  buildingLayout, setBuildingLayout, isEditMode, selectedObject, setSelectedObject,
  onToggleOverview, onOpenShop, onOpenBag, onToggleEditMode, onFlipSelected, onSaveEdit, onCancelEdit,
}) {
  const dragRef = useRef(null);
  const viewportRef = useRef(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  const scale = isOverview ? 0.9 : 1;

  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const buildings = useMemo(
    () => buildWorldBuildings({ userLevels, buildingLayout }),
    [userLevels, buildingLayout]
  );

  const buildingHitboxes = useMemo(() => buildBuildingHitboxes(buildings), [buildings]);
  const backgroundImage = getBackground(activeCategory, 'day');

  useEffect(() => {
    const updateSize = () => {
      if (!viewportRef.current) return;
      setViewportWidth(viewportRef.current.clientWidth);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!viewportWidth) return;
    const bounds = getOffsetBounds(viewportWidth, VIEWPORT_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, scale);
    setOffset((prev) => ({
      x: clamp(prev.x, bounds.minX, bounds.maxX),
      y: clamp(prev.y, bounds.minY, bounds.maxY),
    }));
  }, [viewportWidth, scale]);

  const handleWorldPointerDown = (e) => {
    if (isEditMode) return;
    dragRef.current = { mode: 'pan', startX: e.clientX, startY: e.clientY, originX: offset.x, originY: offset.y };
  };

  const startObjectDrag = (e, objType, objId) => {
    if (!isEditMode) return;
    e.stopPropagation();
    e.preventDefault();
    setSelectedObject({ type: objType, id: objId });
    dragRef.current = { mode: 'object', objectType: objType, objectId: objId, startX: e.clientX, startY: e.clientY };
  };

  const handlePointerMove = useCallback(
    (e) => {
      // 로컬 변수에 복사해서 중간에 null이 되는 경우를 방지
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.mode === 'pan') {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        const bounds = getOffsetBounds(viewportWidth || 1, VIEWPORT_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, scale);
        setOffset({
          x: clamp(drag.originX + dx, bounds.minX, bounds.maxX),
          y: clamp(drag.originY + dy, bounds.minY, bounds.maxY),
        });
        return;
      }

      if (drag.mode === 'object') {
        const dx = (e.clientX - drag.startX) / scale;
        const dy = (e.clientY - drag.startY) / scale;
        const margin = 40;

        if (drag.objectType === 'decoration') {
          setDecorations((prev) =>
            prev.map((item) =>
              item.id === drag.objectId
                ? { ...item, x: clamp(item.x + dx, margin, WORLD_WIDTH - margin), y: clamp(item.y + dy, margin, WORLD_HEIGHT - margin) }
                : item
            )
          );
        }

        if (drag.objectType === 'character') {
          setCharacters((prev) =>
            prev.map((item) =>
              item.id === drag.objectId
                ? { ...item, x: clamp(item.x + dx, margin, WORLD_WIDTH - margin), y: clamp(item.y + dy, margin, WORLD_HEIGHT - margin) }
                : item
            )
          );
        }

        if (drag.objectType === 'building') {
          setBuildingLayout((prev) =>
            prev.map((item) =>
              item.category === drag.objectId
                ? { ...item, x: clamp(item.x + dx, 56, WORLD_WIDTH - 56), y: clamp(item.y + dy, 56, WORLD_HEIGHT - 56) }
                : item
            )
          );
        }

        drag.startX = e.clientX;
        drag.startY = e.clientY;
      }
    },
    [scale, setDecorations, setCharacters, setBuildingLayout, viewportWidth]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    if (isEditMode) return;
    const timer = setInterval(() => {
      setCharacters((prev) => prev.map((npc) => moveNpcAvoidingBuildings(npc, buildingHitboxes)));
    }, 2600);
    return () => clearInterval(timer);
  }, [isEditMode, setCharacters, buildingHitboxes]);

  return (
    <div className="sticky top-0 z-40 overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(248,241,223,0.98) 0%, rgba(245,232,201,0.95) 100%)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
      <div className="px-4 pt-3 pb-2">
        <div ref={viewportRef} className="relative overflow-hidden rounded-[28px]" style={{ height: VIEWPORT_HEIGHT, border: '1px solid rgba(160,120,64,0.18)', boxShadow: '0 12px 24px rgba(80,50,10,0.08)' }}>
          <VillageOverlayBar nickname={nickname} level={totalLevel} points={points} isOverview={isOverview} onToggleOverview={onToggleOverview} onOpenShop={onOpenShop} onOpenBag={onOpenBag} />
          <EditToolbar isEditMode={isEditMode} selectedObject={selectedObject} onToggleEditMode={onToggleEditMode} onFlip={onFlipSelected} onSave={onSaveEdit} onCancel={onCancelEdit} />

          <div className="absolute inset-0 touch-none overflow-hidden" onPointerDown={handleWorldPointerDown}>
            <div
              className="absolute left-0 top-0"
              style={{
                width: WORLD_WIDTH, height: WORLD_HEIGHT,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: 'top left',
                transition: dragRef.current ? 'none' : 'transform 300ms ease',
              }}
            >
              {backgroundImage ? (
                <img src={backgroundImage} alt="village background" className="absolute inset-0 h-full w-full object-cover" draggable={false} style={{ pointerEvents: 'none' }} />
              ) : (
                <div className="absolute inset-0 bg-[#d8e8b0]" />
              )}

              {decorations.map((item) => {
                const isSelected = selectedObject?.type === 'decoration' && selectedObject?.id === item.id;
                return (
                  <div key={item.id} className="absolute" onPointerDown={(e) => startObjectDrag(e, 'decoration', item.id)}
                    style={{ left: item.x, top: item.y, transform: `translate(-50%, -50%) scaleX(${item.flipped ? -1 : 1})`, outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none', outlineOffset: '3px', borderRadius: '999px', cursor: isEditMode ? 'grab' : 'default', zIndex: 12, pointerEvents: 'auto' }}>
                    <DecorationSprite item={item} />
                  </div>
                );
              })}

              {buildings.map((building) => {
                const isSelected = selectedObject?.type === 'building' && selectedObject?.id === building.category;
                return (
                  <div key={building.id} className="absolute" onPointerDown={(e) => startObjectDrag(e, 'building', building.category)}
                    style={{ left: building.x, top: building.y, width: building.w, height: building.h, transform: `translate(-50%, -50%) scaleX(${building.flipped ? -1 : 1})`, outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none', outlineOffset: '4px', borderRadius: '20px', cursor: isEditMode ? 'grab' : 'default', zIndex: 13, pointerEvents: 'auto' }}>
                    <img src={building.image} alt={building.label} className="h-full w-full object-contain" draggable={false} style={{ pointerEvents: 'none' }} />
                  </div>
                );
              })}

              {characters.map((npc) => {
                const isSelected = selectedObject?.type === 'character' && selectedObject?.id === npc.id;
                return (
                  <div key={npc.id} className="absolute" onPointerDown={(e) => startObjectDrag(e, 'character', npc.id)}
                    style={{ left: npc.x, top: npc.y, width: npc.size, height: npc.size, transform: `translate(-50%, -50%) scaleX(${npc.flipped ? -1 : 1})`, transition: isEditMode ? 'none' : 'left 2200ms ease-in-out, top 2200ms ease-in-out', outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none', outlineOffset: '3px', borderRadius: '999px', cursor: isEditMode ? 'grab' : 'default', zIndex: 14, pointerEvents: 'auto' }}>
                    <img src={npc.image || foxImg} alt={npc.name} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: 'transparent', backgroundColor: 'transparent', border: 'none', boxShadow: 'none', userSelect: 'none', WebkitUserDrag: 'none', pointerEvents: 'none' }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}