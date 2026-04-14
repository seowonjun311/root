import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

import {
  CATEGORY_ROUTE_MAP, CATEGORY_LABELS, VALID_CATEGORIES,
  SHOP_ITEMS, DEFAULT_BUILDINGS, DEFAULT_VILLAGE_DATA,
  WORLD_VIEWPORT_HEIGHT, GRID_COLS, GRID_ROWS, OUTER_TILE_PADDING,
  TILE_W, TILE_H, WORLD_WIDTH, WORLD_HEIGHT,
} from '@/lib/villageConstants';

import {
  readGuestData, writeGuestDataPatch,
  normalizeCategoryValue,
  getTodayString,
  gridToScreen, screenToGrid,
  canPlaceObject, getObjectScreenPosition, getPreviewTiles, getPreviewColor,
  getWeeklyLogsForAction, getAllLogsForAction, getStreakForAction,
  groupActionGoals,
  calculateExp, calculateVillagePointReward, getDefaultUserLevels,
  buildDerivedStats, getNewlyUnlockedTitle,
  resolveGoalIdForActionGoal, connectActionGoalsToGoals,
  normalizeGuestGoals, normalizeGuestActionGoals,
  validateGoalActionLogChain,
  getCharacterImage, getDecorationImage,
  createInventoryItem, createPlacedObjectFromInventory,
  getVillageState, buildWorldBuildings,
  getTileImageByKind, buildTileMap,
  clampWorldOffset, randomBetween, clamp,
  getWorldExpansionByLevel,
} from '@/lib/villageUtils';

import {
  addOwnedTitle, ensureValidEquippedTitle, getOwnedTitleIds, setEquippedTitle,
} from '@/lib/titleStorage';

import guestDataPersistence from '@/lib/GuestDataPersistence';

import CategoryTabs from '@/components/home/CategoryTabs';
import GoalProgress from '@/components/home/GoalProgress';
import ActionGoalCard from '@/components/home/ActionGoalCard';
import EmptyGoalState from '@/components/home/EmptyGoalState';

import VillageShopModal from '@/components/home/VillageShopModal';
import VillageBagModal from '@/components/home/VillageBagModal';
import ExpPopup from '@/components/home/ExpPopup';
import PointPopup from '@/components/home/PointPopup';
import TitleUnlockModal from '@/components/home/TitleUnlockModal';
import Section from '@/components/home/Section';
import AddActionGoalButton from '@/components/home/AddActionGoalButton';
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
    if (!npc.isMoving && !npc.isThinking) return undefined;
    const speed = npc.isThinking ? 800 : 220;
    const maxFrame = npc.isThinking ? 6 : 3;
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % maxFrame);
    }, speed);
    return () => clearInterval(timer);
  }, [npc.isMoving, npc.isThinking]);

  // isMoving: 걷기 프레임, isThinking: 생각 프레임, 둘 다 아님: 정지 이미지
  const src = npc.isMoving
    ? getCharacterImage(npc.type, true, frame, false)
    : npc.isThinking
      ? getCharacterImage(npc.type, false, frame, true)
      : getCharacterImage(npc.type, false, 0, false);

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
        transform: `scaleX(${npc.flipped ? -1 : 1})`,
      }}
    />
  );
}

function VillageWorldLayer({
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

  const [viewportSize, setViewportSize] = useState({
    width: 0,
    height: WORLD_VIEWPORT_HEIGHT,
  });
  const [offset, setOffset] = useState({ x: -360, y: -120 });
  const [scale, setScale] = useState(isOverview ? 0.21 : 0.46);

  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);

  const MIN_SCALE = 0.16;
  const MAX_SCALE = 0.92;
  const OVERVIEW_SCALE = 0.21;
  const DETAIL_SCALE = 0.46;

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  const buildings = useMemo(
    () => buildWorldBuildings({ userLevels, buildingLayout }),
    [userLevels, buildingLayout]
  );

  const currentCollisionBuildings = useMemo(() => {
    return buildWorldBuildings({ userLevels, buildingLayout }).map((item) => ({
      ...item,
      category: item.category,
    }));
  }, [userLevels, buildingLayout]);

  const expansion = useMemo(() => getWorldExpansionByLevel(totalLevel), [totalLevel]);

  const tileMap = useMemo(
    () => buildTileMap(GRID_COLS, GRID_ROWS, OUTER_TILE_PADDING + expansion),
    [expansion]
  );

  const stars = useMemo(
    () =>
      Array.from({ length: 900 }).map((_, i) => ({
        id: `star_${i}`,
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        size: Math.random() < 0.75 ? Math.random() * 1.8 + 0.6 : Math.random() * 2.8 + 1.2,
        opacity: Math.random() * 0.35 + 0.25,
        blur: Math.random() < 0.2 ? 10 : 5,
      })),
    []
  );

  const getTouchDistance = (touches) => {
    if (!touches || touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touches) => {
    if (!touches || touches.length === 0) return { x: 0, y: 0 };
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const zoomTo = useCallback((nextScale, clientX, clientY) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) {
      setScale(clamp(nextScale, MIN_SCALE, MAX_SCALE));
      return;
    }

    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const currentScale = scaleRef.current;
    const currentOffset = offsetRef.current;

    const localX = (clientX ?? rect.left + rect.width / 2) - rect.left;
    const localY = (clientY ?? rect.top + rect.height / 2) - rect.top;

    const worldX = (localX - currentOffset.x) / currentScale;
    const worldY = (localY - currentOffset.y) / currentScale;

    const nextOffset = {
      x: localX - worldX * clampedScale,
      y: localY - worldY * clampedScale,
    };

    const safeOffset = clampWorldOffset(
      nextOffset,
      rect.width,
      rect.height || WORLD_VIEWPORT_HEIGHT,
      clampedScale
    );

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

    dragRef.current = {
      mode: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      originX: offsetRef.current.x,
      originY: offsetRef.current.y,
    };
  };

  const startObjectDrag = (e, objType, objId) => {
    if (!isEditMode) return;
    e.stopPropagation();

    setSelectedObject({ type: objType, id: objId });

    let sourceItem = null;

    if (objType === 'decoration') {
      sourceItem = decorations.find((item) => item.id === objId) || null;
    } else if (objType === 'character') {
      sourceItem = characters.find((item) => item.id === objId) || null;
    } else if (objType === 'building') {
      sourceItem = buildingLayout.find((item) => item.category === objId) || null;
    }

    dragRef.current = {
      mode: 'object',
      objectType: objType,
      objectId: objId,
      startX: e.clientX,
      startY: e.clientY,
      startCol: sourceItem?.col ?? 0,
      startRow: sourceItem?.row ?? 0,
    };
  };

  const handlePointerMove = useCallback((e) => {
    if (touchGestureRef.current) return;

    const drag = dragRef.current;
    if (!drag) return;

    if (drag.mode === 'pan') {
      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      setOffset(
        clampWorldOffset(
          {
            x: drag.originX + dx,
            y: drag.originY + dy,
          },
          viewportSize.width,
          viewportSize.height,
          scaleRef.current
        )
      );
      return;
    }

    if (drag.mode === 'object') {
      const dx = (e.clientX - drag.startX) / scaleRef.current;
      const dy = (e.clientY - drag.startY) / scaleRef.current;

      const startScreen = gridToScreen(drag.startCol, drag.startRow);
      const previewX = startScreen.x + dx;
      const previewY = startScreen.y + dy;
      const { col, row } = screenToGrid(previewX, previewY);

      let previewItem = null;

      if (drag.objectType === 'decoration') {
        previewItem = decorations.find((item) => item.id === drag.objectId) || null;
      }
      if (drag.objectType === 'character') {
        previewItem = characters.find((item) => item.id === drag.objectId) || null;
      }
      if (drag.objectType === 'building') {
        previewItem = buildingLayout.find((item) => item.category === drag.objectId) || null;
      }

      if (previewItem) {
        const previewValid = canPlaceObject({
          movingType: drag.objectType,
          movingItem: previewItem,
          nextCol: col,
          nextRow: row,
          decorations,
          characters,
          buildings: drag.objectType === 'building' ? buildingLayout : currentCollisionBuildings,
          totalLevel,
        });

        setPlacementPreview({
          type: drag.objectType,
          col,
          row,
          item: previewItem,
          valid: previewValid,
        });
      }

      if (drag.objectType === 'decoration') {
        setDecorations((prev) =>
          prev.map((item) => {
            if (item.id !== drag.objectId) return item;

            const canPlace = canPlaceObject({
              movingType: 'decoration',
              movingItem: item,
              nextCol: col,
              nextRow: row,
              decorations: prev,
              characters,
              buildings: currentCollisionBuildings,
              totalLevel,
            });

            if (!canPlace) return item;
            return { ...item, col, row };
          })
        );
      }

      if (drag.objectType === 'character') {
        setCharacters((prev) =>
  prev.map((npc) => {
    const nextCol = clamp(npc.col + Math.round(randomBetween(-1, 1)), 0, GRID_COLS - 1);
    const nextRow = clamp(npc.row + Math.round(randomBetween(-1, 1)), 0, GRID_ROWS - 1);

    const canPlace = canPlaceObject({
      movingType: 'character',
      movingItem: npc,
      nextCol,
      nextRow,
      decorations,
      characters: prev,
      buildings: currentCollisionBuildings,
      totalLevel,
    });

    const finalCol = canPlace ? nextCol : npc.col;
    const finalRow = canPlace ? nextRow : npc.row;

    let nextFlipped = npc.flipped;

    if (canPlace) {
      if (finalCol > npc.col) {
        nextFlipped = false; // 오른쪽 이동
      } else if (finalCol < npc.col) {
        nextFlipped = true; // 왼쪽 이동
      }
    }

    return {
      ...npc,
      col: finalCol,
      row: finalRow,
      flipped: nextFlipped,
    };
  })
);
      }

      if (drag.objectType === 'building') {
        setBuildingLayout((prev) =>
          prev.map((item) => {
            if (item.category !== drag.objectId) return item;

            const canPlace = canPlaceObject({
              movingType: 'building',
              movingItem: item,
              nextCol: col,
              nextRow: row,
              decorations,
              characters,
              buildings: prev,
              totalLevel,
            });

            if (!canPlace) return item;
            return { ...item, col, row };
          })
        );
      }

      dragRef.current = {
        ...drag,
        startX: e.clientX,
        startY: e.clientY,
        startCol: col,
        startRow: row,
      };
    }
  }, [
    viewportSize.width,
    viewportSize.height,
    decorations,
    characters,
    currentCollisionBuildings,
    setDecorations,
    setCharacters,
    setBuildingLayout,
    buildingLayout,
    setPlacementPreview,
    totalLevel,
  ]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setPlacementPreview(null);
  }, [setPlacementPreview]);

  const handleTouchStart = useCallback((e) => {
    if (!viewportRef.current) return;

    if (e.touches.length >= 2) {
      const center = getTouchCenter(e.touches);
      touchGestureRef.current = {
        mode: 'pinch',
        startDistance: getTouchDistance(e.touches),
        startScale: scaleRef.current,
        centerX: center.x,
        centerY: center.y,
      };
      return;
    }

    if (e.touches.length === 1 && !isEditMode) {
      touchGestureRef.current = {
        mode: 'pan',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        originX: offsetRef.current.x,
        originY: offsetRef.current.y,
      };
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

      const nextScale = gesture.startScale * (distance / gesture.startDistance);
      zoomTo(nextScale, center.x, center.y);
      return;
    }

    if (gesture.mode === 'pan' && e.touches.length === 1 && !isEditMode) {
      e.preventDefault();

      const dx = e.touches[0].clientX - gesture.startX;
      const dy = e.touches[0].clientY - gesture.startY;

      setOffset(
        clampWorldOffset(
          {
            x: gesture.originX + dx,
            y: gesture.originY + dy,
          },
          viewportSize.width,
          viewportSize.height,
          scaleRef.current
        )
      );
    }
  }, [viewportSize.width, viewportSize.height, zoomTo, isEditMode]);

  const handleTouchEnd = useCallback((e) => {
    if (!touchGestureRef.current) return;

    if (e.touches.length >= 2) {
      const center = getTouchCenter(e.touches);
      touchGestureRef.current = {
        mode: 'pinch',
        startDistance: getTouchDistance(e.touches),
        startScale: scaleRef.current,
        centerX: center.x,
        centerY: center.y,
      };
      return;
    }

    if (e.touches.length === 1 && !isEditMode) {
      touchGestureRef.current = {
        mode: 'pan',
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        originX: offsetRef.current.x,
        originY: offsetRef.current.y,
      };
      return;
    }

    touchGestureRef.current = null;
  }, [isEditMode]);

  useEffect(() => {
    const updateViewportSize = () => {
      const rect = viewportRef.current?.getBoundingClientRect();
      if (!rect) return;
      setViewportSize({
        width: rect.width,
        height: rect.height || WORLD_VIEWPORT_HEIGHT,
      });
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
    setOffset((prev) =>
      clampWorldOffset(prev, viewportSize.width, viewportSize.height, scale)
    );
  }, [viewportSize, scale]);

  useEffect(() => {
  if (isEditMode) return;

  const timer = setInterval(() => {
    const now = Date.now();

    setCharacters((prev) =>
      prev.map((npc) => {
        // thinking 상태이면 남은 틱을 소모하고 멈춤
        if (npc.thinkTicks > 0) {
          return {
            ...npc,
            thinkTicks: npc.thinkTicks - 1,
            isMoving: false,
            isThinking: true,
          };
        }

        // 15% 확률로 생각하기 상태 진입 (8~16틱 = 약 2~4초)
        if (!npc.isMoving && Math.random() < 0.15) {
          const ticks = Math.floor(randomBetween(8, 16));
          return {
            ...npc,
            thinkTicks: ticks,
            isMoving: false,
            isThinking: true,
          };
        }

        const moveCol = Math.round(randomBetween(-1, 1));
        const moveRow = Math.round(randomBetween(-1, 1));

        const nextCol = clamp(npc.col + moveCol, 0, GRID_COLS - 1);
        const nextRow = clamp(npc.row + moveRow, 0, GRID_ROWS - 1);

        const canPlace = canPlaceObject({
          movingType: 'character',
          movingItem: npc,
          nextCol,
          nextRow,
          decorations,
          characters: prev,
          buildings: currentCollisionBuildings,
          totalLevel,
        });

        const finalCol = canPlace ? nextCol : npc.col;
        const finalRow = canPlace ? nextRow : npc.row;

        const isActuallyMoving = canPlace && (finalCol !== npc.col || finalRow !== npc.row);

        let nextFlipped = npc.flipped;

        if (isActuallyMoving) {
          if (finalCol > npc.col) {
            nextFlipped = false;
          } else if (finalCol < npc.col) {
            nextFlipped = true;
          }
        }

        return {
          ...npc,
          col: finalCol,
          row: finalRow,
          flipped: nextFlipped,
          isMoving: isActuallyMoving,
          isThinking: false,
          thinkTicks: 0,
        };
      })
    );
  }, 240);

  return () => clearInterval(timer);
}, [isEditMode, setCharacters, decorations, currentCollisionBuildings, totalLevel]);
  return (
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
            background:
              'radial-gradient(circle at 50% 20%, rgba(120,150,255,0.22) 0%, rgba(120,150,255,0.08) 16%, rgba(0,0,0,0) 34%), radial-gradient(circle at 18% 28%, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 10%, rgba(0,0,0,0) 24%), radial-gradient(circle at 82% 18%, rgba(180,120,255,0.16) 0%, rgba(180,120,255,0.05) 12%, rgba(0,0,0,0) 24%), linear-gradient(180deg, #1d2550 0%, #131938 38%, #0a0f24 68%, #05070f 100%)',
            touchAction: 'none',
          }}
        >
          <VillageOverlayBar
            nickname={nickname}
            level={totalLevel}
            points={points}
            onOpenShop={onOpenShop}
            onOpenBag={onOpenBag}
            onToggleOverview={onToggleOverview}
            isOverview={isOverview}
          />

          <EditToolbar
            isEditMode={isEditMode}
            selectedObject={selectedObject}
            onToggleEditMode={onToggleEditMode}
            onFlip={onFlipSelected}
            onSave={onSaveEdit}
            onCancel={onCancelEdit}
            onStoreSelected={onStoreSelected}
            canSave={!placementPreview || placementPreview.valid}
          />

          <div
            className="absolute inset-0 touch-none overflow-hidden"
            onPointerDown={handleWorldPointerDown}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: WORLD_WIDTH,
                height: WORLD_HEIGHT,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: 'top left',
                transition:
                  dragRef.current || touchGestureRef.current
                    ? 'none'
                    : 'transform 260ms ease',
                willChange: 'transform',
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 14%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 12%), radial-gradient(circle at 28% 24%, rgba(109,140,255,0.16) 0%, rgba(109,140,255,0.06) 14%, rgba(0,0,0,0) 28%), radial-gradient(circle at 74% 18%, rgba(199,132,255,0.14) 0%, rgba(199,132,255,0.05) 12%, rgba(0,0,0,0) 25%), radial-gradient(circle at 52% 52%, rgba(90,120,255,0.08) 0%, rgba(90,120,255,0.03) 18%, rgba(0,0,0,0) 42%), linear-gradient(180deg, #1a2148 0%, #111733 34%, #0a0f24 68%, #04060d 100%)',
                }}
              />

              {stars.map((star) => (
                <div
                  key={star.id}
                  className="pointer-events-none absolute rounded-full"
                  style={{
                    left: star.x,
                    top: star.y,
                    width: star.size,
                    height: star.size,
                    background:
                      star.size > 2
                        ? 'rgba(255,255,255,0.98)'
                        : 'rgba(255,255,255,1)',
                    opacity: star.opacity,
                    boxShadow: `
                      0 0 ${star.blur}px rgba(255,255,255,0.9),
                      0 0 ${star.blur * 2}px rgba(255,255,255,0.6)
                    `,
                  }}
                />
              ))}

              <div
                className="pointer-events-none absolute"
                style={{
                  left: GRID_COLS * (TILE_W / 2),
                  top: GRID_ROWS * (TILE_H / 2) + 260,
                  width: 980,
                  height: 300,
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.18) 38%, rgba(0,0,0,0) 72%)',
                  filter: 'blur(18px)',
                }}
              />

              {tileMap.map((tile) => {
                const pos = gridToScreen(tile.col, tile.row);
                const tileImg = getTileImageByKind(tile.kind);

                return (
                  <img
                    key={tile.id}
                    src={tileImg}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute select-none"
                    style={{
                      left: pos.x - TILE_W / 2,
                      top: pos.y - TILE_H / 2,
                      width: TILE_W,
                      height: TILE_H,
                      objectFit: 'contain',
                      userSelect: 'none',
                      WebkitUserDrag: 'none',
                    }}
                  />
                );
              })}

              {isEditMode && placementPreview
                ? getPreviewTiles(
                    placementPreview.item,
                    placementPreview.type,
                    placementPreview.col,
                    placementPreview.row
                  ).map((tile) => {
                    const pos = gridToScreen(tile.col, tile.row);
                    const color = getPreviewColor(placementPreview.valid);

                    return (
                      <div
                        key={`preview-${tile.col}-${tile.row}`}
                        className="absolute pointer-events-none"
                        style={{
                          left: pos.x - TILE_W / 2,
                          top: pos.y - TILE_H / 2,
                          width: TILE_W,
                          height: TILE_H,
                          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                          border: color.border,
                          background: color.background,
                          boxSizing: 'border-box',
                          zIndex: 2000,
                        }}
                      />
                    );
                  })
                : null}

              {decorations.map((item) => {
                const isSelected =
                  selectedObject?.type === 'decoration' && selectedObject?.id === item.id;
                const pos = getObjectScreenPosition(item, 'decoration');

                return (
                  <div
                    key={item.id}
                    className="absolute"
                    onPointerDown={(e) => startObjectDrag(e, 'decoration', item.id)}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      transform: `translate(-50%, -100%) scaleX(${item.flipped ? -1 : 1})`,
                      outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none',
                      outlineOffset: '3px',
                      borderRadius: '999px',
                      cursor: isEditMode ? 'grab' : 'default',
                      zIndex: 3000 + item.row,
                    }}
                  >
                    <DecorationSprite item={item} />
                  </div>
                );
              })}

              {buildings.map((building) => {
                const isSelected =
                  selectedObject?.type === 'building' &&
                  selectedObject?.id === building.category;
                const pos = getObjectScreenPosition(building, 'building');

                return (
                  <div
                    key={building.id}
                    className="absolute"
                    onPointerDown={(e) => startObjectDrag(e, 'building', building.category)}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: 225,
                      height: 180,
                      transform: `translate(-50%, -100%) scaleX(${building.flipped ? -1 : 1})`,
                      outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none',
                      outlineOffset: '4px',
                      borderRadius: '20px',
                      cursor: isEditMode ? 'grab' : 'default',
                      zIndex: 4000 + building.row,
                    }}
                  >
                    <img
                      src={building.image}
                      alt={building.label}
                      className="h-full w-full object-contain"
                      draggable={false}
                    />
                  </div>
                );
              })}

              {characters.map((npc) => {
                const isSelected =
                  selectedObject?.type === 'character' && selectedObject?.id === npc.id;
                const pos = getObjectScreenPosition(npc, 'character');

                return (
                  <div
                    key={npc.id}
                    className="absolute"
                    onPointerDown={(e) => startObjectDrag(e, 'character', npc.id)}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      width: npc.size,
                      height: npc.size,
                      transform: 'translate(-50%, -100%)',
                      transition: isEditMode ? 'none' : 'left 2200ms ease-in-out, top 2200ms ease-in-out',
                      outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none',
                      outlineOffset: '3px',
                      borderRadius: '999px',
                      cursor: isEditMode ? 'grab' : 'default',
                      zIndex: 5000 + npc.row,
                    }}
                  >
                    <CharacterSprite npc={npc} />
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

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [guestVersion, setGuestVersion] = useState(0);
  const [isOverview, setIsOverview] = useState(false);

  const [activeCategory, setActiveCategory] = useState(() => {
    try {
      const raw = guestDataPersistence.getData();
      const cat =
        raw?.activeCategory ||
        raw?.guest_active_category ||
        raw?.category ||
        raw?.goals?.[0]?.category;
      return normalizeCategoryValue(cat, 'exercise');
    } catch {
      return 'exercise';
    }
  });

  const [expPopup, setExpPopup] = useState(null);
  const [pointPopup, setPointPopup] = useState(null);
  const [newTitle, setNewTitle] = useState(null);

  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState('character');

  const [isBagOpen, setIsBagOpen] = useState(false);
  const [bagTab, setBagTab] = useState('character');

  const [inventoryCharacters, setInventoryCharacters] = useState([]);
  const [inventoryDecorations, setInventoryDecorations] = useState([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [placementPreview, setPlacementPreview] = useState(null);

  const [decorations, setDecorations] = useState([]);
  const [characters, setCharacters] = useState(DEFAULT_VILLAGE_DATA.village_characters);
  const [buildingLayout, setBuildingLayout] = useState(DEFAULT_BUILDINGS);

  const originalVillageRef = useRef(null);
  const hasCategoryInteractionRef = useRef(false);
  const chainRepairOnceRef = useRef(false);
  const expPopupTimerRef = useRef(null);
  const pointPopupTimerRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => setGuestVersion((prev) => prev + 1);
    window.addEventListener('root-home-data-updated', handleUpdate);
    return () => window.removeEventListener('root-home-data-updated', handleUpdate);
  }, []);

  useEffect(() => {
    if (!expPopup) return undefined;
    clearTimeout(expPopupTimerRef.current);
    expPopupTimerRef.current = setTimeout(() => setExpPopup(null), 1400);
    return () => clearTimeout(expPopupTimerRef.current);
  }, [expPopup]);

  useEffect(() => {
    if (!pointPopup) return undefined;
    clearTimeout(pointPopupTimerRef.current);
    pointPopupTimerRef.current = setTimeout(() => setPointPopup(null), 1400);
    return () => clearTimeout(pointPopupTimerRef.current);
  }, [pointPopup]);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 1000 * 30,
  });

  const isGuest = !user;

  const { data: guestData = {} } = useQuery({
    queryKey: ['guest-home-data', guestVersion],
    queryFn: () => readGuestData(),
    staleTime: 0,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', isGuest, guestVersion],
    enabled: !isUserLoading,
    queryFn: async () => {
      if (isGuest) {
        const rawGoals =
          Array.isArray(guestData?.goals) && guestData.goals.length > 0
            ? guestData.goals
            : guestData?.goalData
              ? [guestData.goalData]
              : [];
        return normalizeGuestGoals(rawGoals, guestData?.category || 'exercise');
      }
      return base44.entities.Goal.list('-created_date', 100);
    },
  });

  const { data: actionGoals = [] } = useQuery({
    queryKey: ['actionGoals', isGuest, guestVersion],
    enabled: !isUserLoading,
    queryFn: async () => {
      if (isGuest) {
        const normalizedGoals = normalizeGuestGoals(
          Array.isArray(guestData?.goals) && guestData.goals.length > 0
            ? guestData.goals
            : guestData?.goalData
              ? [guestData.goalData]
              : [],
          guestData?.category || 'exercise'
        );

        const rawActionGoals =
          Array.isArray(guestData?.actionGoals) && guestData.actionGoals.length > 0
            ? guestData.actionGoals
            : guestData?.actionGoalData
              ? [guestData.actionGoalData]
              : [];

        return normalizeGuestActionGoals(
          rawActionGoals,
          normalizedGoals,
          guestData?.category || normalizedGoals[0]?.category || 'exercise'
        );
      }

      return base44.entities.ActionGoal.list('-created_date', 200);
    },
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allLogs', isGuest, guestVersion],
    enabled: !isUserLoading,
    queryFn: async () => {
      if (isGuest) return guestData?.actionLogs || [];
      return base44.entities.ActionLog.list('-date', 500);
    },
  });

  const connectedActionGoals = useMemo(
    () => connectActionGoalsToGoals(goals, actionGoals),
    [goals, actionGoals]
  );

  useEffect(() => {
    if (!Array.isArray(actionGoals) || actionGoals.length === 0) return;
    if (chainRepairOnceRef.current) return;

    const needsRepair = actionGoals.some((goal) => {
      const resolved = resolveGoalIdForActionGoal(goal, goals, activeCategory);
      return !goal?.goal_id || goal.goal_id !== resolved;
    });

    if (!needsRepair) return;
    chainRepairOnceRef.current = true;

    if (isGuest) {
      writeGuestDataPatch((prev) => {
        const prevActionGoals = Array.isArray(prev?.actionGoals) ? prev.actionGoals : [];

        const repaired = prevActionGoals.map((goal) => ({
          ...goal,
          goal_id: resolveGoalIdForActionGoal(
            goal,
            goals,
            prev?.category || activeCategory || 'exercise'
          ),
        }));

        return {
          ...prev,
          actionGoals: repaired,
          actionGoalData: repaired[0] || prev?.actionGoalData || null,
        };
      });

      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    const updates = actionGoals
      .map((goal) => ({
        id: goal?.id,
        currentGoalId: goal?.goal_id || null,
        nextGoalId: resolveGoalIdForActionGoal(
          goal,
          goals,
          user?.active_category || activeCategory || 'exercise'
        ),
      }))
      .filter((item) => item.id && item.nextGoalId && item.currentGoalId !== item.nextGoalId);

    if (updates.length === 0) return;

    Promise.all(
      updates.map((item) =>
        base44.entities.ActionGoal.update(item.id, {
          goal_id: item.nextGoalId,
        })
      )
    )
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      })
      .catch((error) => {
        console.error('Failed to repair actionGoal.goal_id:', error);
      });
  }, [actionGoals, goals, isGuest, activeCategory, queryClient, user]);

  useEffect(() => {
    const report = validateGoalActionLogChain(goals, connectedActionGoals, allLogs);
    if (
      report.actionGoalsWithoutGoalId > 0 ||
      report.logsWithoutGoalId > 0 ||
      report.logsWithUnknownActionGoal > 0 ||
      report.actionGoalsWithUnknownGoal > 0
    ) {
      console.warn('[Home] goal→actionGoal→log chain issue detected:', report);
    }
  }, [goals, connectedActionGoals, allLogs]);

  const userLevels = useMemo(() => {
    if (isGuest) return getDefaultUserLevels(guestData?.actionLogs || []);
    return getDefaultUserLevels(allLogs || []);
  }, [isGuest, guestData, allLogs]);

  const ownedTitleIds = useMemo(
    () => getOwnedTitleIds({ isGuest, user, guestData }),
    [isGuest, user, guestData, guestVersion]
  );

  useEffect(() => {
    ensureValidEquippedTitle({ isGuest, user, guestData, ownedTitleIds, queryClient })
      .then((nextGuest) => {
        if (!isGuest || !nextGuest) return;
        queryClient.removeQueries({ queryKey: ['guest-home-data'] });
        queryClient.removeQueries({ queryKey: ['guest-records-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-home-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-records-data'] });
        window.dispatchEvent(new Event('root-home-data-updated'));
        setGuestVersion((v) => v + 1);
      })
      .catch((error) => {
        console.error('ensureValidEquippedTitle error:', error);
      });
  }, [isGuest, ownedTitleIds, guestData, queryClient]);

  useEffect(() => {
    if (isUserLoading) return;

    const current = normalizeCategoryValue(activeCategory, 'exercise');

    if (isGuest) {
      const guestCategory = normalizeCategoryValue(
        guestData?.activeCategory ||
          guestData?.guest_active_category ||
          guestData?.category ||
          guestData?.goalData?.category ||
          guestData?.actionGoalData?.category ||
          guestData?.goals?.[0]?.category,
        'exercise'
      );

      if (!hasCategoryInteractionRef.current || !VALID_CATEGORIES.includes(current)) {
        setActiveCategory(guestCategory);
      }
      return;
    }

    const userCategory = normalizeCategoryValue(
      user?.active_category || goals?.[0]?.category,
      'exercise'
    );

    if (!hasCategoryInteractionRef.current || !VALID_CATEGORIES.includes(current)) {
      setActiveCategory(userCategory);
    }
  }, [isUserLoading, isGuest, guestData, user, goals, activeCategory]);

  useEffect(() => {
    const source = isGuest ? guestData : user;
    const village = getVillageState(source || {});

    setDecorations(
      (village.village_decorations || []).map((item) => ({
        ...item,
        image: getDecorationImage(item.type),
      }))
    );

   setCharacters(
  (village.village_characters || []).map((item) => ({
    ...item,
    isMoving: false,
    image: getCharacterImage(item.type, false),
  }))
);

    setBuildingLayout(village.village_buildings || DEFAULT_BUILDINGS);
    setInventoryCharacters(village.village_inventory_characters || []);
    setInventoryDecorations(village.village_inventory_decorations || []);
    originalVillageRef.current = village;
  }, [isGuest, guestData, user]);

  const handleCategoryChange = async (category) => {
    const normalizedCategory = normalizeCategoryValue(category, 'exercise');
    hasCategoryInteractionRef.current = true;
    setActiveCategory(normalizedCategory);

    if (isGuest) {
      writeGuestDataPatch((prev) => ({
        ...prev,
        category: normalizedCategory,
        activeCategory: normalizedCategory,
        guest_active_category: normalizedCategory,
      }));
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    try {
      await base44.auth.updateMe({ active_category: normalizedCategory });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (error) {
      console.error(error);
    }
  };

  const activeGoals = useMemo(() => {
    return (goals || []).filter((goal) => {
      const goalCategory = normalizeCategoryValue(goal?.category, '');
      if (goalCategory !== activeCategory) return false;
      if (goal?.status && goal.status !== 'active') return false;
      return true;
    });
  }, [goals, activeCategory]);

  const activeGoal = activeGoals[0] || null;

  const activeActionGoals = useMemo(() => {
    const goalIds = new Set(activeGoals.map((goal) => goal.id));

    return (connectedActionGoals || []).filter((actionGoal) => {
      const actionCategory = normalizeCategoryValue(actionGoal?.category, '');
      if (actionCategory !== activeCategory) return false;

      if (
        actionGoal?.status &&
        actionGoal.status !== 'active' &&
        actionGoal.status !== 'completed'
      ) {
        return false;
      }

      if (!actionGoal?.goal_id) return false;
      if (goalIds.size === 0) return false;

      return goalIds.has(actionGoal.goal_id);
    });
  }, [connectedActionGoals, activeCategory, activeGoals]);

  const goalLogs = useMemo(() => {
    if (!activeGoal) return [];
    return (allLogs || []).filter((log) => log?.goal_id === activeGoal.id);
  }, [allLogs, activeGoal]);

  const today = getTodayString();
  const grouped = useMemo(() => groupActionGoals(activeActionGoals, today), [activeActionGoals, today]);

  const nickname = isGuest ? guestData?.nickname || '용사' : user?.nickname || '용사';

  const handleCreateGoal = () => {
    const route = CATEGORY_ROUTE_MAP[activeCategory] || '/CreateGoalExercise';
    navigate(route);
  };

  const persistNewTitle = async (titleId) => {
    if (!titleId) return null;

    if (isGuest) {
      try {
        await addOwnedTitle({ titleId, isGuest, user, queryClient });
        queryClient.removeQueries({ queryKey: ['guest-home-data'] });
        queryClient.removeQueries({ queryKey: ['guest-records-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-home-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-records-data'] });
        window.dispatchEvent(new Event('root-home-data-updated'));
        setGuestVersion((v) => v + 1);
      } catch (error) {
        console.error('persistNewTitle guest error:', error);
      }
      return titleId;
    }

    try {
      await addOwnedTitle({ titleId, isGuest, user, queryClient });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (error) {
      console.error('persistNewTitle user error:', error);
    }
    return titleId;
  };

  const handleEquipTitle = async (titleId) => {
    try {
      await setEquippedTitle({ titleId, isGuest, user, queryClient });
      setNewTitle(null);

      if (isGuest) {
        queryClient.invalidateQueries({ queryKey: ['guest-home-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-records-data'] });
        window.dispatchEvent(new Event('root-home-data-updated'));
        setGuestVersion((v) => v + 1);
      } else {
        queryClient.invalidateQueries({ queryKey: ['me'] });
      }

      toast.success('대표 칭호가 설정되었어요.');
    } catch (error) {
      console.error('handleEquipTitle error:', error);
      toast.error('대표 칭호 설정에 실패했어요.');
    }
  };

  const saveVillageState = async (nextState) => {
    const safeState = {
      village_points: Number(nextState?.village_points || 0),
      village_decorations: Array.isArray(nextState?.village_decorations) ? nextState.village_decorations : [],
      village_characters: Array.isArray(nextState?.village_characters) ? nextState.village_characters : [],
      village_buildings: Array.isArray(nextState?.village_buildings) ? nextState.village_buildings : [],
      village_inventory_characters: Array.isArray(nextState?.village_inventory_characters) ? nextState.village_inventory_characters : [],
      village_inventory_decorations: Array.isArray(nextState?.village_inventory_decorations) ? nextState.village_inventory_decorations : [],
    };

    if (isGuest) {
      writeGuestDataPatch((prev) => ({
        ...prev,
        village_points: safeState.village_points,
        village_decorations: safeState.village_decorations.map(({ image, ...rest }) => rest),
        village_characters: safeState.village_characters.map(({ image, ...rest }) => rest),
        village_buildings: safeState.village_buildings,
        village_inventory_characters: safeState.village_inventory_characters,
        village_inventory_decorations: safeState.village_inventory_decorations,
      }));
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    await base44.auth.updateMe({
      village_points: safeState.village_points,
      village_decorations: safeState.village_decorations.map(({ image, ...rest }) => rest),
      village_characters: safeState.village_characters.map(({ image, ...rest }) => rest),
      village_buildings: safeState.village_buildings,
      village_inventory_characters: safeState.village_inventory_characters,
      village_inventory_decorations: safeState.village_inventory_decorations,
    });

    queryClient.invalidateQueries({ queryKey: ['me'] });
  };

  const handleVillagePurchase = async (item) => {
    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});
    const currentPoints = Number(currentVillage.village_points || 0);

    if (currentPoints < item.price) {
      toast.error('포인트가 부족해요.');
      return;
    }

    const nextPoints = currentPoints - item.price;
    const newInventoryItem = createInventoryItem(item);
    const nextInventoryCharacters = [...inventoryCharacters];
    const nextInventoryDecorations = [...inventoryDecorations];

    if (item.type === 'decoration') {
      nextInventoryDecorations.push(newInventoryItem);
    } else {
      nextInventoryCharacters.push(newInventoryItem);
    }

    const nextState = {
      village_points: nextPoints,
      village_decorations: decorations,
      village_characters: characters,
      village_buildings: buildingLayout,
      village_inventory_characters: nextInventoryCharacters,
      village_inventory_decorations: nextInventoryDecorations,
    };

    try {
      await saveVillageState(nextState);
      setInventoryCharacters(nextInventoryCharacters);
      setInventoryDecorations(nextInventoryDecorations);
      originalVillageRef.current = { ...currentVillage, ...nextState };
      toast.success(`${item.label} 구매 완료! 가방에 보관했어요. (-${item.price} 포인트)`);
    } catch (error) {
      console.error('handleVillagePurchase error:', error);
      toast.error('구매 중 오류가 발생했어요.');
    }
  };

  const handlePlaceInventoryItem = async (inventoryItem) => {
    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});

    const nextCharacters = [...characters];
    const nextDecorations = [...decorations];
    const nextInventoryCharacters = [...inventoryCharacters];
    const nextInventoryDecorations = [...inventoryDecorations];

    if (inventoryItem.type === 'character') {
      nextCharacters.push(createPlacedObjectFromInventory(inventoryItem));
      const removeIndex = nextInventoryCharacters.findIndex((item) => item.id === inventoryItem.id);
      if (removeIndex >= 0) nextInventoryCharacters.splice(removeIndex, 1);
    } else {
      nextDecorations.push(createPlacedObjectFromInventory(inventoryItem));
      const removeIndex = nextInventoryDecorations.findIndex((item) => item.id === inventoryItem.id);
      if (removeIndex >= 0) nextInventoryDecorations.splice(removeIndex, 1);
    }

    const nextState = {
      village_points: currentVillage.village_points,
      village_decorations: nextDecorations,
      village_characters: nextCharacters,
      village_buildings: buildingLayout,
      village_inventory_characters: nextInventoryCharacters,
      village_inventory_decorations: nextInventoryDecorations,
    };

    try {
      await saveVillageState(nextState);
      setCharacters(nextCharacters);
      setDecorations(nextDecorations);
      setInventoryCharacters(nextInventoryCharacters);
      setInventoryDecorations(nextInventoryDecorations);
      originalVillageRef.current = {
        ...currentVillage,
        ...nextState,
      };
      toast.success(`${inventoryItem.label}을(를) 마을에 꺼냈어요!`);
    } catch (error) {
      console.error('handlePlaceInventoryItem error:', error);
      toast.error('가방에서 꺼내는 중 오류가 발생했어요.');
    }
  };

  const handleStoreSelected = async () => {
    if (!selectedObject) return;
    if (selectedObject.type !== 'character' && selectedObject.type !== 'decoration') return;

    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});
    const nextCharacters = [...characters];
    const nextDecorations = [...decorations];
    const nextInventoryCharacters = [...inventoryCharacters];
    const nextInventoryDecorations = [...inventoryDecorations];

    if (selectedObject.type === 'character') {
      const target = nextCharacters.find((item) => item.id === selectedObject.id);
      if (!target || target.id === 'starter_fox') {
        toast.error('기본 캐릭터는 가방에 넣을 수 없어요.');
        return;
      }
      const removeIndex = nextCharacters.findIndex((item) => item.id === selectedObject.id);
      if (removeIndex >= 0) nextCharacters.splice(removeIndex, 1);
      nextInventoryCharacters.push({
        id: `inv_${target.type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        type: 'character',
        subtype: target.type,
        label: target.name || (target.type === 'alpaca' ? '알파카' : target.type === 'platypus' ? '오리너구리' : '여우'),
      });
    }

    if (selectedObject.type === 'decoration') {
      const target = nextDecorations.find((item) => item.id === selectedObject.id);
      if (!target) return;
      const removeIndex = nextDecorations.findIndex((item) => item.id === selectedObject.id);
      if (removeIndex >= 0) nextDecorations.splice(removeIndex, 1);
      nextInventoryDecorations.push({
        id: `inv_${target.type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        type: 'decoration',
        subtype: target.type,
        label: target.type === 'tree' ? '나무' : target.type === 'flower' ? '꽃' : '잔디',
      });
    }

    const nextState = {
      village_points: currentVillage.village_points,
      village_decorations: nextDecorations,
      village_characters: nextCharacters,
      village_buildings: buildingLayout,
      village_inventory_characters: nextInventoryCharacters,
      village_inventory_decorations: nextInventoryDecorations,
    };

    try {
      await saveVillageState(nextState);
      setCharacters(nextCharacters);
      setDecorations(nextDecorations);
      setInventoryCharacters(nextInventoryCharacters);
      setInventoryDecorations(nextInventoryDecorations);
      setSelectedObject(null);
      setPlacementPreview(null);
      originalVillageRef.current = { ...currentVillage, ...nextState };
      toast.success('가방에 넣었어요!');
    } catch (error) {
      console.error('handleStoreSelected error:', error);
      toast.error('가방에 넣는 중 오류가 발생했어요.');
    }
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      handleSaveEdit();
      return;
    }
    setSelectedObject(null);
    setPlacementPreview(null);
    setIsEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (placementPreview && !placementPreview.valid) {
      toast.error('빨간 칸 상태에서는 저장할 수 없어요.');
      return;
    }

    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});

    const nextState = {
      village_points: currentVillage.village_points,
      village_decorations: decorations,
      village_characters: characters,
      village_buildings: buildingLayout,
      village_inventory_characters: inventoryCharacters,
      village_inventory_decorations: inventoryDecorations,
    };

    try {
      await saveVillageState(nextState);
      originalVillageRef.current = {
        ...currentVillage,
        ...nextState,
      };
      setIsEditMode(false);
      setSelectedObject(null);
      setPlacementPreview(null);
      toast.success('마을 편집이 저장되었어요.');
    } catch (error) {
      console.error('handleSaveEdit error:', error);
      toast.error('마을 저장 중 오류가 발생했어요.');
    }
  };

  const handleCancelEdit = () => {
    const village = originalVillageRef.current || getVillageState(isGuest ? guestData : user || {});

    setDecorations(
      (village.village_decorations || []).map((item) => ({
        ...item,
        image: getDecorationImage(item.type),
      }))
    );
    setCharacters(
      (village.village_characters || []).map((item) => ({
        ...item,
        image: getCharacterImage(item.type),
      }))
    );
    setBuildingLayout(village.village_buildings || DEFAULT_BUILDINGS);
    setInventoryCharacters(village.village_inventory_characters || []);
    setInventoryDecorations(village.village_inventory_decorations || []);
    setSelectedObject(null);
    setPlacementPreview(null);
    setIsEditMode(false);
  };

  const handleFlipSelected = () => {
    if (!selectedObject) return;

    if (selectedObject.type === 'decoration') {
      setDecorations((prev) =>
        prev.map((item) =>
          item.id === selectedObject.id ? { ...item, flipped: !item.flipped } : item
        )
      );
      return;
    }

    if (selectedObject.type === 'character') {
      setCharacters((prev) =>
        prev.map((item) =>
          item.id === selectedObject.id ? { ...item, flipped: !item.flipped } : item
        )
      );
      return;
    }

    if (selectedObject.type === 'building') {
      setBuildingLayout((prev) =>
        prev.map((item) =>
          item.category === selectedObject.id ? { ...item, flipped: !item.flipped } : item
        )
      );
    }
  };

  const handleActionComplete = async (actionGoal, minutes = 0, extra = {}) => {
    try {
      const now = new Date().toISOString();
      const todayStr = getTodayString();
      const earnedExp = calculateExp(actionGoal, minutes);
      const earnedVillagePoints = calculateVillagePointReward(actionGoal, minutes);

      const safeGoalId =
        actionGoal?.goal_id ||
        resolveGoalIdForActionGoal(actionGoal, goals, activeCategory);

      if (!safeGoalId) {
        toast.error('행동목표와 결과목표 연결이 끊어졌어요. 새로고침 후 다시 시도해 주세요.');
        return;
      }

      const logPayload = {
        id: `local_log_${Date.now()}`,
        action_goal_id: actionGoal.id,
        goal_id: safeGoalId,
        category: actionGoal.category,
        title: actionGoal.title || '',
        completed: true,
        date: todayStr,
        duration_minutes: Number(minutes || 0),
        gps_enabled: !!extra?.gpsEnabled,
        distance_km: extra?.distance ?? null,
        route_coordinates: extra?.coords ? JSON.stringify(extra.coords) : null,
        photo_url: extra?.photo || null,
        memo: extra?.memo || '',
        meta_action_type: actionGoal.action_type || 'confirm',
        created_date: now,
        updated_date: now,
      };

      const currentVillageSource = isGuest ? guestData : user;
      const currentVillage = getVillageState(currentVillageSource || {});
      const nextVillagePoints = Number(currentVillage.village_points || 0) + earnedVillagePoints;

      if (isGuest) {
        guestDataPersistence.addActionLog(logPayload);

        if (actionGoal.action_type === 'one_time') {
          guestDataPersistence.updateActionGoal(actionGoal.id, {
            status: 'completed',
            completed: true,
            completed_date: todayStr,
            updated_date: now,
          });
        }

        writeGuestDataPatch((prev) => ({
          ...prev,
          village_points: nextVillagePoints,
        }));

        queryClient.removeQueries({ queryKey: ['guest-home-data'] });
        queryClient.removeQueries({ queryKey: ['guest-records-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-home-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-records-data'] });

        window.dispatchEvent(new Event('root-home-data-updated'));
      } else {
        await base44.entities.ActionLog.create({
          ...logPayload,
          id: undefined,
        });

        if (actionGoal.action_type === 'one_time') {
          await base44.entities.ActionGoal.update(actionGoal.id, {
            status: 'completed',
            completed: true,
            completed_date: todayStr,
            updated_date: now,
          });
        }

        await base44.auth.updateMe({
          village_points: nextVillagePoints,
        });

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['allLogs'] }),
          queryClient.invalidateQueries({ queryKey: ['actionGoals'] }),
          queryClient.invalidateQueries({ queryKey: ['goals'] }),
          queryClient.invalidateQueries({ queryKey: ['me'] }),
        ]);
      }

      setExpPopup(earnedExp);
      setPointPopup(earnedVillagePoints);

      const currentLogs = isGuest
        ? (Array.isArray(guestData?.actionLogs) ? guestData.actionLogs : [])
        : (Array.isArray(allLogs) ? allLogs : []);

      const currentActionGoals = isGuest
        ? (Array.isArray(guestData?.actionGoals)
            ? connectActionGoalsToGoals(goals, guestData.actionGoals)
            : [])
        : (Array.isArray(connectedActionGoals) ? connectedActionGoals : []);

      const nextLogs = [...currentLogs, logPayload];

      const nextActionGoals =
        actionGoal.action_type === 'one_time'
          ? currentActionGoals.map((goal) =>
              goal.id === actionGoal.id
                ? {
                    ...goal,
                    status: 'completed',
                    completed: true,
                    completed_date: todayStr,
                    updated_date: now,
                  }
                : goal
            )
          : currentActionGoals;

      const nextStats = buildDerivedStats(nextLogs, nextActionGoals);

      const currentOwnedTitleIds = isGuest
        ? getOwnedTitleIds({ isGuest: true, user: null, guestData: readGuestData() })
        : getOwnedTitleIds({ isGuest: false, user, guestData: null });

      const unlocked = getNewlyUnlockedTitle(nextStats, currentOwnedTitleIds);

      if (unlocked) {
        await persistNewTitle(unlocked.id);
        setNewTitle(unlocked);
      }

      toast.success('행동목표를 완료했어요!');
    } catch (error) {
      console.error('handleActionComplete error:', error);
      toast.error('행동목표 완료 처리 중 오류가 발생했어요.');
    }
  };

  const totalLevel = useMemo(() => {
    const sum =
      Number(userLevels.exercise_level || 1) +
      Number(userLevels.study_level || 1) +
      Number(userLevels.mental_level || 1) +
      Number(userLevels.daily_level || 1);

    return Math.max(1, Math.floor(sum / 4));
  }, [userLevels]);

  const points = Number(getVillageState(isGuest ? guestData : user).village_points || 0);

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background:
          'linear-gradient(180deg, #f8f1df 0%, #f5e8c9 38%, #f2e1bc 68%, #ebd6a9 100%)',
      }}
    >
      {expPopup ? <ExpPopup exp={expPopup} /> : null}
      {pointPopup ? <PointPopup points={pointPopup} /> : null}

      {newTitle ? (
        <TitleUnlockModal
          title={newTitle}
          onClose={() => setNewTitle(null)}
          onEquip={() => handleEquipTitle(newTitle.id)}
        />
      ) : null}

      <VillageShopModal
        open={isShopOpen}
        activeTab={shopTab}
        onTabChange={setShopTab}
        points={points}
        onClose={() => setIsShopOpen(false)}
        onBuy={handleVillagePurchase}
      />

      <VillageBagModal
        open={isBagOpen}
        activeTab={bagTab}
        onTabChange={setBagTab}
        inventoryCharacters={inventoryCharacters}
        inventoryDecorations={inventoryDecorations}
        onClose={() => setIsBagOpen(false)}
        onPlaceItem={handlePlaceInventoryItem}
      />

      <VillageWorldLayer
        isOverview={isOverview}
        nickname={nickname}
        totalLevel={totalLevel}
        points={points}
        userLevels={userLevels}
        decorations={decorations}
        setDecorations={setDecorations}
        characters={characters}
        setCharacters={setCharacters}
        buildingLayout={buildingLayout}
        setBuildingLayout={setBuildingLayout}
        isEditMode={isEditMode}
        selectedObject={selectedObject}
        setSelectedObject={setSelectedObject}
        placementPreview={placementPreview}
        setPlacementPreview={setPlacementPreview}
        onToggleOverview={() => setIsOverview((prev) => !prev)}
        onOpenShop={() => {
          setShopTab('character');
          setIsShopOpen(true);
        }}
        onOpenBag={() => {
          setBagTab('character');
          setIsBagOpen(true);
        }}
        onToggleEditMode={handleToggleEditMode}
        onFlipSelected={handleFlipSelected}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onStoreSelected={handleStoreSelected}
      />

      <div
        className="sticky top-[314px] z-40 -mx-4 px-4 pt-1 pb-2"
        style={{
          background:
            'linear-gradient(180deg, rgba(248,241,223,0.98) 0%, rgba(245,232,201,0.95) 78%, rgba(245,232,201,0.88) 100%)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <div className="px-4">
          <CategoryTabs
            active={activeCategory}
            onChange={handleCategoryChange}
            userLevels={userLevels}
          />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4">
        {activeGoal ? (
          <GoalProgress goal={activeGoal} logs={goalLogs} />
        ) : (
          <EmptyGoalState
            category={activeCategory}
            onCreateGoal={handleCreateGoal}
          />
        )}

        {activeGoal ? (
          <div className="space-y-6 pt-1">
            <Section
              title="오늘 해야 할 것"
              count={grouped.todayItems.length}
              emptyText="오늘 해야 할 행동목표가 없어요."
            >
              {grouped.todayItems.map((actionGoal) => (
                <ActionGoalCard
                  key={actionGoal.id}
                  actionGoal={actionGoal}
                  weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)}
                  allLogs={getAllLogsForAction(allLogs, actionGoal.id)}
                  streak={getStreakForAction(allLogs, actionGoal.id)}
                  onComplete={handleActionComplete}
                />
              ))}
            </Section>

            <Section
              title="예정된 목표"
              count={grouped.scheduledItems.length}
              emptyText="예정된 목표가 없어요."
            >
              {grouped.scheduledItems.map((actionGoal) => (
                <ActionGoalCard
                  key={actionGoal.id}
                  actionGoal={actionGoal}
                  weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)}
                  allLogs={getAllLogsForAction(allLogs, actionGoal.id)}
                  streak={getStreakForAction(allLogs, actionGoal.id)}
                  onComplete={handleActionComplete}
                />
              ))}
            </Section>

            <Section
              title="기한 지난 목표"
              count={grouped.overdueItems.length}
              emptyText="기한 지난 목표가 없어요."
            >
              {grouped.overdueItems.map((actionGoal) => (
                <ActionGoalCard
                  key={actionGoal.id}
                  actionGoal={actionGoal}
                  weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)}
                  allLogs={getAllLogsForAction(allLogs, actionGoal.id)}
                  streak={getStreakForAction(allLogs, actionGoal.id)}
                  onComplete={handleActionComplete}
                />
              ))}
            </Section>

            <div className="pt-1">
              <AddActionGoalButton
                onClick={handleCreateGoal}
                categoryLabel={CATEGORY_LABELS[activeCategory]}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}