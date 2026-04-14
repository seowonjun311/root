import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  WORLD_VIEWPORT_HEIGHT, GRID_COLS, GRID_ROWS, OUTER_TILE_PADDING,
  TILE_W, TILE_H, WORLD_WIDTH, WORLD_HEIGHT,
} from '@/lib/villageConstants';
import {
  gridToScreen, screenToGrid,
  canPlaceObject, getObjectScreenPosition, getPreviewTiles, getPreviewColor,
  getCharacterImage,
  buildWorldBuildings,
  getTileImageByKind, buildTileMap,
  clampWorldOffset, randomBetween, clamp,
  getWorldExpansionByLevel,
} from '@/lib/villageUtils';
import VillageOverlayBar from '@/components/home/VillageOverlayBar';
import EditToolbar from '@/components/home/EditToolbar';

function DecorationSprite({ item }) {
  return (
    <img
      src={item.image}
      alt={item.type}
      draggable={false}
      style={{
        width: item.size,
        height: item.size,
        objectFit: 'contain',
        display: 'block',
        background: 'transparent',
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        userSelect: 'none',
        WebkitUserDrag: 'none',
      }}
    />
  );
}

function CharacterSprite({ npc }) {
  const [frame, setFrame] = React.useState(0);

  React.useEffect(() => {
    setFrame(0);
    const speed = npc.isMoving ? 220 : 800;
    const maxFrame = npc.isMoving ? 3 : 6;
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % maxFrame);
    }, speed);
    return () => clearInterval(timer);
  }, [npc.isMoving]);

  const src = getCharacterImage(npc.type, npc.isMoving, frame);

  return (
    <img
      src={src}
      alt={npc.name}
      draggable={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
        background: 'transparent',
        backgroundColor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        userSelect: 'none',
        WebkitUserDrag: 'none',
        transform: `scaleX(${npc.flipped ? -1 : 1}) scale(${npc.isMoving ? 3 : 1})`,
      }}
    />
  );
}

export default function VillageWorldLayer({
  nickname,
  totalLevel,
  points,
  userLevels,
  decorations,
  characters,
  buildingLayout,
  setCharacters,
  setDecorations,
  setBuildingLayout,
  setPlacementPreview,
  setSelectedObject,
  isEditMode,
  selectedObject,
  placementPreview,
  onOpenShop,
  onOpenBag,
  onToggleEditMode,
  onFlipSelected,
  onSaveEdit,
  onCancelEdit,
  onStoreSelected,
  isOverview,
  onToggleOverview,
}) {
  const dragRef = useRef(null);
  const viewportRef = useRef(null);
  const touchGestureRef = useRef(null);

  const [viewportSize, setViewportSize] = useState({ width: 0, height: WORLD_VIEWPORT_HEIGHT });
  const [offset, setOffset] = useState({ x: -360, y: -120 });
  const [scale, setScale] = useState(isOverview ? 0.21 : 0.46);
  const [revealedTiles, setRevealedTiles] = useState([]);
  const prevExpansionRef = useRef(getWorldExpansionByLevel(totalLevel));

  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);

  const MIN_SCALE = 0.16;
  const MAX_SCALE = 0.92;
  const OVERVIEW_SCALE = 0.21;
  const DETAIL_SCALE = 0.46;

  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { offsetRef.current = offset; }, [offset]);

  const buildings = useMemo(() => buildWorldBuildings({ userLevels, buildingLayout }), [userLevels, buildingLayout]);
  const currentCollisionBuildings = useMemo(() => buildWorldBuildings({ userLevels, buildingLayout }), [userLevels, buildingLayout]);
  const expansion = useMemo(() => getWorldExpansionByLevel(totalLevel), [totalLevel]);

  function getNewlyUnlockedTiles(prevExpansion, nextExpansion) {
    const prevPadding = OUTER_TILE_PADDING + prevExpansion;
    const nextPadding = OUTER_TILE_PADDING + nextExpansion;
    const newlyUnlocked = [];
    for (let row = -nextPadding; row < GRID_ROWS + nextPadding; row += 1) {
      for (let col = -nextPadding; col < GRID_COLS + nextPadding; col += 1) {
        const wasVisible = col >= -prevPadding && row >= -prevPadding && col < GRID_COLS + prevPadding && row < GRID_ROWS + prevPadding;
        const isNowVisible = col >= -nextPadding && row >= -nextPadding && col < GRID_COLS + nextPadding && row < GRID_ROWS + nextPadding;
        if (!wasVisible && isNowVisible) {
          newlyUnlocked.push({ id: `unlock-${col}-${row}`, col, row, delay: newlyUnlocked.length * 35 });
        }
      }
    }
    return newlyUnlocked;
  }

  const tileMap = useMemo(() => buildTileMap(GRID_COLS, GRID_ROWS, OUTER_TILE_PADDING + expansion), [expansion]);

  useEffect(() => {
    const nextExpansion = getWorldExpansionByLevel(totalLevel);
    const prevExpansion = prevExpansionRef.current;
    if (nextExpansion > prevExpansion) {
      const unlocked = getNewlyUnlockedTiles(prevExpansion, nextExpansion);
      setRevealedTiles(unlocked);
      const clearTimer = setTimeout(() => setRevealedTiles([]), 2200);
      prevExpansionRef.current = nextExpansion;
      return () => clearTimeout(clearTimer);
    }
    prevExpansionRef.current = nextExpansion;
  }, [totalLevel]);

  const stars = useMemo(() =>
    Array.from({ length: 900 }).map((_, i) => ({
      id: `star_${i}`,
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * WORLD_HEIGHT,
      size: Math.random() < 0.75 ? Math.random() * 1.8 + 0.6 : Math.random() * 2.8 + 1.2,
      opacity: Math.random() * 0.35 + 0.25,
      blur: Math.random() < 0.2 ? 10 : 5,
    })), []);

  const getTouchDistance = (touches) => {
    if (!touches || touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches) => {
    if (!touches || touches.length === 0) return { x: 0, y: 0 };
    if (touches.length === 1) return { x: touches[0].clientX, y: touches[0].clientY };
    return { x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 };
  };

  const zoomTo = useCallback((nextScale, clientX, clientY) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) { setScale(clamp(nextScale, MIN_SCALE, MAX_SCALE)); return; }
    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const currentScale = scaleRef.current;
    const currentOffset = offsetRef.current;
    const localX = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const localY = (clientY ?? rect.top + rect.height / 2) - rect.top;
    const worldX = (localX - currentOffset.x) / currentScale;
    const worldY = (localY - currentOffset.y) / currentScale;
    const nextOffset = { x: localX - worldX * clampedScale, y: localY - worldY * clampedScale };
    const safeOffset = clampWorldOffset(nextOffset, rect.width, rect.height || WORLD_VIEWPORT_HEIGHT, clampedScale);
    setScale(clampedScale);
    setOffset(safeOffset);
  }, []);

  useEffect(() => {
    const rect = viewportRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : undefined;
    const centerY = rect ? rect.top + rect.height / 2 : undefined;
    zoomTo(isOverview ? OVERVIEW_SCALE : DETAIL_SCALE, centerX, centerY);
  }, [isOverview, zoomTo]);

  const handleWorldPointerDown = (e) => {
    if (e.pointerType === 'touch') return;
    if (isEditMode) return;
    dragRef.current = { mode: 'pan', startX: e.clientX, startY: e.clientY, originX: offsetRef.current.x, originY: offsetRef.current.y };
  };

  const startObjectDrag = (e, objType, objId) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setSelectedObject({ type: objType, id: objId });
    let sourceItem = null;
    if (objType === 'decoration') sourceItem = decorations.find((item) => item.id === objId) || null;
    else if (objType === 'character') sourceItem = characters.find((item) => item.id === objId) || null;
    else if (objType === 'building') sourceItem = buildingLayout.find((item) => item.category === objId) || null;
    dragRef.current = { mode: 'object', objectType: objType, objectId: objId, startX: e.clientX, startY: e.clientY, startCol: sourceItem?.col ?? 0, startRow: sourceItem?.row ?? 0 };
  };

  const handlePointerMove = useCallback((e) => {
    if (touchGestureRef.current) return;
    const drag = dragRef.current;
    if (!drag) return;
    if (drag.mode === 'pan') {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      setOffset(clampWorldOffset({ x: drag.originX + dx, y: drag.originY + dy }, viewportSize.width, viewportSize.height, scaleRef.current));
      return;
    }
    if (drag.mode === 'object') {
      const dx = (e.clientX - drag.startX) / scaleRef.current;
      const dy = (e.clientY - drag.startY) / scaleRef.current;
      const startScreen = gridToScreen(drag.startCol, drag.startRow);
      const { col, row } = screenToGrid(startScreen.x + dx, startScreen.y + dy);
      let previewItem = null;
      if (drag.objectType === 'decoration') previewItem = decorations.find((item) => item.id === drag.objectId) || null;
      if (drag.objectType === 'character') previewItem = characters.find((item) => item.id === drag.objectId) || null;
      if (drag.objectType === 'building') previewItem = buildingLayout.find((item) => item.category === drag.objectId) || null;
      if (previewItem) {
        const previewValid = canPlaceObject({ movingType: drag.objectType, movingItem: previewItem, nextCol: col, nextRow: row, decorations, characters, buildings: drag.objectType === 'building' ? buildingLayout : currentCollisionBuildings, totalLevel });
        setPlacementPreview({ type: drag.objectType, col, row, item: previewItem, valid: previewValid });
      }
      if (drag.objectType === 'decoration') {
        setDecorations((prev) => prev.map((item) => {
          if (item.id !== drag.objectId) return item;
          const canPlace = canPlaceObject({ movingType: 'decoration', movingItem: item, nextCol: col, nextRow: row, decorations: prev, characters, buildings: currentCollisionBuildings, totalLevel });
          if (!canPlace) return item;
          return { ...item, col, row };
        }));
      }
      if (drag.objectType === 'character') {
        setCharacters((prev) => prev.map((npc) => {
          if (npc.id !== drag.objectId) return npc;
          const canPlace = canPlaceObject({ movingType: 'character', movingItem: npc, nextCol: col, nextRow: row, decorations, characters: prev, buildings: currentCollisionBuildings, totalLevel });
          if (!canPlace) return npc;
          let nextFlipped = npc.flipped;
          if (col > npc.col) nextFlipped = false;
          else if (col < npc.col) nextFlipped = true;
          return { ...npc, col, row, flipped: nextFlipped };
        }));
      }
      if (drag.objectType === 'building') {
        setBuildingLayout((prev) => prev.map((item) => {
          if (item.category !== drag.objectId) return item;
          const canPlace = canPlaceObject({ movingType: 'building', movingItem: item, nextCol: col, nextRow: row, decorations, characters, buildings: prev, totalLevel });
          if (!canPlace) return item;
          return { ...item, col, row };
        }));
      }
      dragRef.current = { ...drag, startX: e.clientX, startY: e.clientY, startCol: col, startRow: row };
    }
  }, [viewportSize.width, viewportSize.height, decorations, characters, currentCollisionBuildings, setDecorations, setCharacters, setBuildingLayout, buildingLayout, setPlacementPreview, totalLevel]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setPlacementPreview(null);
  }, [setPlacementPreview]);

  const handleTouchStart = useCallback((e) => {
    if (!viewportRef.current) return;
    if (e.touches.length >= 2) {
      const center = getTouchCenter(e.touches);
      touchGestureRef.current = { mode: 'pinch', startDistance: getTouchDistance(e.touches), startScale: scaleRef.current, centerX: center.x, centerY: center.y };
      return;
    }
    if (e.touches.length === 1 && !isEditMode) {
      touchGestureRef.current = { mode: 'pan', startX: e.touches[0].clientX, startY: e.touches[0].clientY, originX: offsetRef.current.x, originY: offsetRef.current.y };
    }
  }, [isEditMode]);

  const handleTouchMove = useCallback((e) => {
    if (!touchGestureRef.current) return;
    const gesture = touchGestureRef.current;
    if (gesture.mode === 'pinch' && e.touches.length >= 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      if (!gesture.startDistance) return;
      zoomTo(gesture.startScale * (distance / gesture.startDistance), center.x, center.y);
      return;
    }
    if (gesture.mode === 'pan' && e.touches.length === 1 && !isEditMode) {
      e.preventDefault();
      const dx = e.touches[0].clientX - gesture.startX;
      const dy = e.touches[0].clientY - gesture.startY;
      setOffset(clampWorldOffset({ x: gesture.originX + dx, y: gesture.originY + dy }, viewportSize.width, viewportSize.height, scaleRef.current));
    }
  }, [viewportSize.width, viewportSize.height, zoomTo, isEditMode]);

  const handleTouchEnd = useCallback((e) => {
    if (!touchGestureRef.current) return;
    if (e.touches.length >= 2) {
      const center = getTouchCenter(e.touches);
      touchGestureRef.current = { mode: 'pinch', startDistance: getTouchDistance(e.touches), startScale: scaleRef.current, centerX: center.x, centerY: center.y };
      return;
    }
    if (e.touches.length === 1 && !isEditMode) {
      touchGestureRef.current = { mode: 'pan', startX: e.touches[0].clientX, startY: e.touches[0].clientY, originX: offsetRef.current.x, originY: offsetRef.current.y };
      return;
    }
    touchGestureRef.current = null;
  }, [isEditMode]);

  useEffect(() => {
    const updateViewportSize = () => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      setViewportSize({ width: rect.width, height: rect.height || WORLD_VIEWPORT_HEIGHT });
    };
    updateViewportSize();
    window.addEventListener('resize', updateViewportSize);
    return () => window.removeEventListener('resize', updateViewportSize);
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    if (!viewportSize.width) return;
    setOffset((prev) => clampWorldOffset(prev, viewportSize.width, viewportSize.height, scale));
  }, [viewportSize, scale]);

  useEffect(() => {
    if (isEditMode) return;
    const timer = setInterval(() => {
      setCharacters((prev) => prev.map((npc) => {
        const moveCol = Math.round(randomBetween(-1, 1));
        const moveRow = Math.round(randomBetween(-1, 1));
        const nextCol = clamp(npc.col + moveCol, 0, GRID_COLS - 1);
        const nextRow = clamp(npc.row + moveRow, 0, GRID_ROWS - 1);
        const canPlace = canPlaceObject({ movingType: 'character', movingItem: npc, nextCol, nextRow, decorations, characters: prev, buildings: currentCollisionBuildings, totalLevel });
        const finalCol = canPlace ? nextCol : npc.col;
        const finalRow = canPlace ? nextRow : npc.row;
        const isActuallyMoving = canPlace && (finalCol !== npc.col || finalRow !== npc.row);
        let nextFlipped = npc.flipped;
        if (isActuallyMoving) {
          if (finalCol > npc.col) nextFlipped = false;
          else if (finalCol < npc.col) nextFlipped = true;
        }
        return { ...npc, col: finalCol, row: finalRow, flipped: nextFlipped, isMoving: isActuallyMoving };
      }));
    }, 240);
    return () => clearInterval(timer);
  }, [isEditMode, setCharacters, decorations, currentCollisionBuildings, totalLevel]);

  return (
    <>
    <style>{`
      @keyframes tileReveal {
        0% { opacity: 0; transform: translateY(10px) scale(0.88); }
        60% { opacity: 1; transform: translateY(-2px) scale(1.04); }
        100% { opacity: 1; transform: translateY(0px) scale(1); }
      }
    `}</style>
    <div
      className="sticky top-0 z-40 overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 35%, #2a315f 0%, #161a35 45%, #0a0d1f 75%, #05070f 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div className="px-4 pt-3 pb-2">
        <div
          ref={viewportRef}
          className="relative overflow-hidden rounded-[28px]"
          style={{
            height: WORLD_VIEWPORT_HEIGHT,
            border: '1px solid rgba(160,120,64,0.18)',
            boxShadow: '0 12px 24px rgba(80,50,10,0.08)',
            background: 'radial-gradient(circle at 50% 20%, rgba(120,150,255,0.22) 0%, rgba(120,150,255,0.08) 16%, rgba(0,0,0,0) 34%), radial-gradient(circle at 18% 28%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 10%, rgba(0,0,0,0) 24%), radial-gradient(circle at 82% 18%, rgba(180,120,255,0.16) 0%, rgba(180,120,255,0.05) 12%, rgba(0,0,0,0) 24%), linear-gradient(180deg, #1d2550 0%, #131938 38%, #0a0f24 68%, #05070f 100%)',
            touchAction: 'none',
          }}
        >
          <VillageOverlayBar nickname={nickname} level={totalLevel} points={points} onOpenShop={onOpenShop} onOpenBag={onOpenBag} onToggleOverview={onToggleOverview} isOverview={isOverview} />
          <EditToolbar isEditMode={isEditMode} selectedObject={selectedObject} onToggleEditMode={onToggleEditMode} onFlip={onFlipSelected} onSave={onSaveEdit} onCancel={onCancelEdit} onStoreSelected={onStoreSelected} canSave={!placementPreview || placementPreview.valid} />

          <div className="absolute inset-0 touch-none overflow-hidden" onPointerDown={handleWorldPointerDown} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} onTouchCancel={handleTouchEnd}>
            <div
              className="absolute left-0 top-0"
              style={{
                width: WORLD_WIDTH,
                height: WORLD_HEIGHT,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: 'top left',
                transition: dragRef.current || touchGestureRef.current ? 'none' : 'transform 260ms ease',
                willChange: 'transform',
              }}
            >
              <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 14%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 12%), radial-gradient(circle at 28% 24%, rgba(109,140,255,0.16) 0%, rgba(109,140,255,0.06) 14%, rgba(0,0,0,0) 28%), radial-gradient(circle at 74% 18%, rgba(199,132,255,0.14) 0%, rgba(199,132,255,0.05) 12%, rgba(0,0,0,0) 25%), radial-gradient(circle at 52% 52%, rgba(90,120,255,0.08) 0%, rgba(90,120,255,0.03) 18%, rgba(0,0,0,0) 42%), linear-gradient(180deg, #1a2148 0%, #111733 34%, #0a0f24 68%, #04060d 100%)' }} />

              {stars.map((star) => (
                <div key={star.id} className="pointer-events-none absolute rounded-full" style={{ left: star.x, top: star.y, width: star.size, height: star.size, background: star.size > 2 ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,1)', opacity: star.opacity, boxShadow: `0 0 ${star.blur}px rgba(255,255,255,0.9), 0 0 ${star.blur * 2}px rgba(255,255,255,0.6)` }} />
              ))}

              <div className="pointer-events-none absolute" style={{ left: GRID_COLS * (TILE_W / 2), top: GRID_ROWS * (TILE_H / 2) + 260, width: 980, height: 300, transform: 'translate(-50%, -50%)', background: 'radial-gradient(ellipse, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.18) 38%, rgba(0,0,0,0) 72%)', filter: 'blur(18px)' }} />

              {tileMap.map((tile) => {
                const pos = gridToScreen(tile.col, tile.row);
                const tileImg = getTileImageByKind(tile.kind);
                const revealed = revealedTiles.find((item) => item.col === tile.col && item.row === tile.row);
                return (
                  <img key={tile.id} src={tileImg} alt="" draggable={false} className="pointer-events-none absolute select-none"
                    style={{
                      left: pos.x - TILE_W / 2, top: pos.y - TILE_H / 2, width: TILE_W, height: TILE_H, objectFit: 'contain', userSelect: 'none', WebkitUserDrag: 'none',
                      opacity: revealed ? 0 : 1,
                      transform: revealed ? 'translateY(10px) scale(0.88)' : 'translateY(0px) scale(1)',
                      filter: revealed ? 'brightness(1.5) drop-shadow(0 0 10px rgba(255,255,180,0.7))' : 'none',
                      animation: revealed ? `tileReveal 520ms ease-out ${revealed.delay}ms forwards` : 'none',
                    }}
                  />
                );
              })}

              {isEditMode && placementPreview
                ? getPreviewTiles(placementPreview.item, placementPreview.type, placementPreview.col, placementPreview.row).map((tile) => {
                    const pos = gridToScreen(tile.col, tile.row);
                    const color = getPreviewColor(placementPreview.valid);
                    return (
                      <div key={`preview-${tile.col}-${tile.row}`} className="absolute pointer-events-none"
                        style={{ left: pos.x - TILE_W / 2, top: pos.y - TILE_H / 2, width: TILE_W, height: TILE_H, clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', border: color.border, background: color.background, boxSizing: 'border-box', zIndex: 2000 }}
                      />
                    );
                  })
                : null}

              {decorations.map((item) => {
                const isSelected = selectedObject?.type === 'decoration' && selectedObject?.id === item.id;
                const pos = getObjectScreenPosition(item, 'decoration');
                return (
                  <div key={item.id} className="absolute" onPointerDown={(e) => startObjectDrag(e, 'decoration', item.id)}
                    style={{ left: pos.x, top: pos.y, transform: `translate(-50%, -100%) scaleX(${item.flipped ? -1 : 1})`, outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none', outlineOffset: '3px', borderRadius: '999px', cursor: isEditMode ? 'grab' : 'default', zIndex: 3000 + item.row }}>
                    <DecorationSprite item={item} />
                  </div>
                );
              })}

              {buildings.map((building) => {
                const isSelected = selectedObject?.type === 'building' && selectedObject?.id === building.category;
                const pos = getObjectScreenPosition(building, 'building');
                return (
                  <div key={building.id} className="absolute" onPointerDown={(e) => startObjectDrag(e, 'building', building.category)}
                    style={{ left: pos.x, top: pos.y, width: 338, height: 270, transform: `translate(-50%, -100%) scaleX(${building.flipped ? -1 : 1})`, outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none', outlineOffset: '4px', borderRadius: '20px', cursor: isEditMode ? 'grab' : 'default', zIndex: 4000 + building.row }}>
                    <img src={building.image} alt={building.label} className="h-full w-full object-contain" draggable={false} />
                  </div>
                );
              })}

              {characters.map((npc) => {
                const isSelected = selectedObject?.type === 'character' && selectedObject?.id === npc.id;
                const pos = getObjectScreenPosition(npc, 'character');
                return (
                  <div key={npc.id} className="absolute" onPointerDown={(e) => startObjectDrag(e, 'character', npc.id)}
                    style={{ left: pos.x, top: pos.y, width: npc.size, height: npc.size, transform: 'translate(-50%, -100%)', transition: isEditMode ? 'none' : 'left 2200ms ease-in-out, top 2200ms ease-in-out', outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none', outlineOffset: '3px', borderRadius: '999px', cursor: isEditMode ? 'grab' : 'default', zIndex: 5000 + npc.row }}>
                    <CharacterSprite npc={npc} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}