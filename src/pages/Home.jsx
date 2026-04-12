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

//마을 월드 전체를 보여주고, 드래그로 이동하고, 편집모드에서 오브젝트를 옮기고, 건물/캐릭터/꾸미기/타일/UI를 전부 렌더링하는 메인 컴포넌트
function VillageWorldLayer({
  //표시용 데이터 
  nickname, //유저 이름
  totalLevel, // 전체 레벨
  points, // 마을 포인트
  userLevels, // 운동/공부/정신/일상 등 카테고리 베벨 정도
  decorations, //수풀, 꽃, 나무 같은 꾸미기 목록
  characters, // 마을 안 캐릭터 목록
  buildingLayout, //  건물 위치 정보
  //상태 바꾸는 함수로 화면에 보이는 것뿐 아니라 실제로 위치를 바꾸는 권한을 가지고 있음 
  setCharacters, //
  setDecorations,//
  setBuildingLayout,//
  setPlacementPreview,//
  setSelectedObject,//
  //편집관련
  isEditMode,//지금 편집모드인지
  selectedObject,//현재 선택된 오브젝트
  placementPreview,//지금 놓으려는 위치 미리보기
  //버튼연결함수 
  onOpenShop,//상점 열기
  onOpenBag,//가방 열기
  onToggleEditMode,//편집모드 켜기/끄기
  onFlipSelected,//선택한 오브젝트 좌우 반전
  onSaveEdit,//편집 저장
  onCancelEdit,//편직 취소
  onStoreSelected,//선택한 오브젝트 가방 넣기
  isOverview,//
  onToggleOverview,//전체보기/확대 전환 
    }) {
  const dragRef = useRef(null);
  const viewportRef = useRef(null); //마을이 보이는 화면 영역 DOM
  const [viewportSize, setViewportSize] = useState({ width: 0, height: WORLD_VIEWPORT_HEIGHT }); //현재 마을 화면 박스의 크기 저장.
  const [offset, setOffset] = useState({ x: -360, y: -120 }); //이건 월드를 어디로 이동시켜서 보여줄지를 뜻(x가 커지면 좌우 위치 이동, y가 커지면 위아래 위치 이동) 마을 드래그하면 이 값이 바뀜

  const scale = isOverview ? 0.21 : 0.46; //확대/축소 비율, 전체보기면 0.21, 일반 보기면 0.46, 즉: 전체보기 → 더 작게 보여서 많은 범위가 보임, 확대 → 더 크게 보여서 가까이 보임

  //이건 현재 유저 레벨과 건물 위치를 바탕으로 실제로 화면에 그릴 건물 목록을 만듦.
  const buildings = useMemo(
    () => buildWorldBuildings({ userLevels, buildingLayout }),
    [userLevels, buildingLayout]
  );

  //이건 충돌 검사할 때 쓰는 건물 목록, 즉: 장식이나 캐릭터가 건물과 겹치는지, 건물이 다른 건물과 겹치는지, 확인할 때 사용됨.
  const currentCollisionBuildings = useMemo(() => {
    return buildWorldBuildings({ userLevels, buildingLayout }).map((item) => ({
      ...item,
      category: item.category,
    }));
  }, [userLevels, buildingLayout]);

  const tileMap = useMemo(() => buildTileMap(GRID_COLS, GRID_ROWS, OUTER_TILE_PADDING), []); //마을 바닥 타일 전체를 만듦. 즉: 어느 칸에 잔디, 어느 칸에 길, 바깥 패딩은 어떻게 둘지 를 미리 계산해둠.
  const borderTrees = useMemo(() => buildBorderTrees(), []); //마을 바깥 경계에 있는 나무들 목록이야.

  //편집모드 아닐 때만 동작함. 즉: 일반 모드에서는 마을 배경을 잡고 움직일 수 있음, 편집모드에서는 배경 이동보다 오브젝트 이동이 우선
  const handleWorldPointerDown = (e) => {
    if (isEditMode) return;

    //이건 “지금부터 월드를 끌 거다”라고 기억하는 거야. 저장하는 것: 드래그 시작 마우스 위치, 시작 당시 월드 위치
    dragRef.current = {
      mode: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  };

  //
  const startObjectDrag = (e, objType, objId) => {
    if (!isEditMode) return; //편집모드일 때만 가
    e.stopPropagation();

    setSelectedObject({ type: objType, id: objId }); //드래그 시작한 오브젝트를 선택 상태로 만듦.

    let sourceItem = null;

    if (objType === 'decoration') {
      sourceItem = decorations.find((item) => item.id === objId) || null;
    } else if (objType === 'character') {
      sourceItem = characters.find((item) => item.id === objId) || null;
    } else if (objType === 'building') {
      sourceItem = buildingLayout.find((item) => item.category === objId) || null;
    }

    //지금 장식/캐릭터/건물 드래그 중이다”를 기억
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
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.mode === 'pan') {//월드를 끌고 있는 중이면: 현재 마우스가 얼마나 이동했는지 계산, 그만큼 offset 변경, clampWorldOffset(...)로 화면 밖으로 너무 안 나가게 제한
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
          scale
        )
      );
      return;
    }

    if (drag.mode === 'object') { //이건 편집모드에서 오브젝트 이동. 먼저 하는 일 : 마우스가 얼마나 이동했는지 계산, 현재 scale을 반영해서 실제 월드 좌표로 바꿈, gridToScreen, screenToGrid로 화면 좌표 ↔ 타일 좌표를 변환함
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;

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
        });

        //지금 놓으려는 위치가 어디인지, 놓을 수 있는지 없는지 저장해둠 
        setPlacementPreview({
          type: drag.objectType,
          col,
          row,
          item: previewItem,
          valid: previewValid,
        });
      }

      //decoration 이동 : 장식 배열 안에서 드래그한 장식만 찾아서 col, row 바꿈. 단, canPlaceObject(...)로 겹치면 이동 안 함.
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
            });

            if (!canPlace) return item;
            return { ...item, col, row };
          })
        );
      }
     //캐릭터이동
      if (drag.objectType === 'character') {
        setCharacters((prev) =>
          prev.map((item) => {
            if (item.id !== drag.objectId) return item;

            const canPlace = canPlaceObject({
              movingType: 'character',
              movingItem: item,
              nextCol: col,
              nextRow: row,
              decorations,
              characters: prev,
              buildings: currentCollisionBuildings,
            });

            if (!canPlace) return item;
            return { ...item, col, row };
          })
        );
      }
      //빌딩이동
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
            });

            if (!canPlace) return item;
            return { ...item, col, row };
          })
        );
      }
     //이건 드래그 기준점을 새 위치로 갱신하는 것 그래서 계속 자연스럽게 이어서 끌 수 있음.
      dragRef.current = {
        ...drag,
        startX: e.clientX,
        startY: e.clientY,
        startCol: col,
        startRow: row,
      };
    }
  }, [scale, viewportSize.width, viewportSize.height, decorations, characters, currentCollisionBuildings, setDecorations, setCharacters, setBuildingLayout, buildingLayout, setPlacementPreview]);

  // 드래그 끝나면 : 드래그 상태 제거, 미리보기 제거
  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    setPlacementPreview(null);
  }, [setPlacementPreview]);

  //창 크기 바뀌면 viewportSize 다시 계산한다. 즉:모바일/PC 크기 바뀌어도 대응
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

  //왜 window에 다냐면 마우스를 오브젝트 밖으로 빼도 드래그가 계속 자연스럽게 되게 하려고.
  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  //확대/축소하거나 화면 크기 바뀌면 기존 위치가 너무 튀어나가지 않게 재조정.
  useEffect(() => {
    if (!viewportSize.width) return;
    setOffset((prev) => clampWorldOffset(prev, viewportSize.width, viewportSize.height, scale));
  }, [viewportSize, scale]);

  useEffect(() => {
    if (isEditMode) return;

    //편집모드가 아닐 때만 2.4초마다 실행.
    //캐릭터가 조금씩 랜덤하게 돌아다니게 만듦. 동시에:겹치면 안 움직이게 검사, 가끔 좌우반전도 바뀜 -> 마을이 살아 있는 느낌을 줌.
    const timer = setInterval(() => {
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
          });

          return {
            ...npc,
            col: canPlace ? nextCol : npc.col,
            row: canPlace ? nextRow : npc.row,
            flipped: randomBetween(0, 1) > 0.5 ? !npc.flipped : npc.flipped,
          };
        })
      );
    }, 2400);

    return () => clearInterval(timer);
  }, [isEditMode, setCharacters, decorations, currentCollisionBuildings]);

  return (
    <div
      className="sticky top-0 z-40 overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(248,241,223,0.98) 0%, rgba(245,232,201,0.95) 100%)',
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
            background: 'linear-gradient(180deg, #cfe8ff 0%, #eef8ff 26%, #dfeec5 60%, #cfe1a6 100%)',
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

              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 12%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 28%), linear-gradient(180deg, #cfe8ff 0%, #eef8ff 24%, #d9ecbd 56%, #c4dd92 100%)',
                }}
              />


              {tileMap.map((tile) => {
                const pos = gridToScreen(tile.col, tile.row); //타일 좌표(col, row)를 실제 화면 x, y 위치로 바꿈
                const tileImg = getTileImageByKind(tile.kind); //이 타일이 길인지, 잔디인지에 따라 이미지 선택

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


              {borderTrees.map((tree) => (
                <img
                  key={tree.id}
                  src={tree.image}
                  alt=""
                  draggable={false}
                  className="pointer-events-none absolute select-none"
                  style={{
                    left: tree.x,
                    top: tree.y,
                    width: tree.width,
                    height: 'auto',
                    transform: `translate(-50%, -100%) scaleX(${tree.flipped ? -1 : 1}) rotate(${tree.rotation ?? 0}deg)`,
                    transformOrigin: 'bottom center',
                    zIndex: tree.zIndex,
                    opacity: tree.opacity ?? 1,
                    userSelect: 'none',
                    WebkitUserDrag: 'none',
                  }}
                />
              ))}


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
                          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', //div를 마름모 모양으로 자름
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
                const isSelected = selectedObject?.type === 'decoration' && selectedObject?.id === item.id;
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
                const isSelected = selectedObject?.type === 'building' && selectedObject?.id === building.category;
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
                    <img src={building.image} alt={building.label} className="h-full w-full object-contain" draggable={false} />
                  </div>
                );
              })}

              {characters.map((npc) => {
                const isSelected = selectedObject?.type === 'character' && selectedObject?.id === npc.id;
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
                      transform: `translate(-50%, -100%) scaleX(${npc.flipped ? -1 : 1})`,
                      transition: isEditMode ? 'none' : 'left 2200ms ease-in-out, top 2200ms ease-in-out',
                      outline: isSelected ? '3px solid rgba(196,154,74,0.9)' : 'none',
                      outlineOffset: '3px',
                      borderRadius: '999px',
                      cursor: isEditMode ? 'grab' : 'default',
                      zIndex: 5000 + npc.row,
                    }}
                  >
                    <img
                      src={npc.image || getCharacterImage(npc.type)}
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
                      }}
                    />
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

//Home 컴포넌트가 시작될 때 필요한 값들을 준비하는 코드로 
//Home 화면에서 쓸 변수들을 만들고, 특히 현재 선택된 카테고리를 저장된 데이터에서 꺼내와서 시작값으로 넣는 부분
export default function Home() {//Home이라는 함수를 만든다, 이 함수가 Home 화면 컴포넌트다, export default는 “이 파일에서 가장 대표로 내보내는 기본 컴포넌트가 Home이다”라는 뜻, 즉 이 파일을 다른 곳에서 import하면 보통 이 Home을 가져오게 돼.
  const navigate = useNavigate(); //페이지 이동용 함수 준비 즉 ,navigate는 화면 이동 버튼 같은 걸 만들 때 쓰는 도구
  const queryClient = useQueryClient(); //ueryClient는 불러온 데이터들을 관리하는 컨트롤러로 ( 저장 후 다시 데이터 새로고침,캐시 지우기, 특정 쿼리 다시 불러오기)

  const [guestVersion, setGuestVersion] = useState(0); //뜻: 숫자 상태를 하나 만듦, 처음 값은 0으로 게스트 데이터가 바뀌었음을 강제로 다시 반영시키는 용도
  const [isOverview, setIsOverview] = useState(false); //뜻: 현재 마을이 전체보기 상태인지 저장으로 처음에는 false 즉, 시작할 때는:,전체보기 아님, 일반 확대 상태

    const [activeCategory, setActiveCategory] = useState(() => { //뜻: 현재 선택된 카테고리를 저장하는 상태를 만든다, 시작값을 그냥 바로 쓰는 게 아니라, 함수를 실행해서 계산한 값으로 시작한다
    //뜻: 먼저 안전하게 데이터를 읽어보자, 만약 읽다가 에러 나면 기본값 'exercise'를 쓰자
      try {
      const raw = guestDataPersistence.getData(); //뜻: 게스트 저장소에 들어 있는 데이터를 가져옴
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

  //보상/알림 UI 상태
  const [expPopup, setExpPopup] = useState(null); //expPopup → 경험치 팝업 (예: +15 XP)
  const [pointPopup, setPointPopup] = useState(null);//pointPopup → 포인트 팝업 (예: +3)
  const [newTitle, setNewTitle] = useState(null);//newTitle → 새로 얻은 칭호

  // 상점 UI상태 
  const [isShopOpen, setIsShopOpen] = useState(false);//isShopOpen → 상점 열렸는지
  const [shopTab, setShopTab] = useState('character');//shopTab → 어떤 탭인지 (캐릭터 / 꾸미기 등)
  //가방 UI 상태
  const [isBagOpen, setIsBagOpen] = useState(false);//isBagOpen → 가방 열렸는지
  const [bagTab, setBagTab] = useState('character');//bagTab → 어떤 탭인지

  //인벤토리 데이터
  const [inventoryCharacters, setInventoryCharacters] = useState([]); //inventoryCharacters → 가방 안 캐릭터 목록
  const [inventoryDecorations, setInventoryDecorations] = useState([]); //inventoryDecorations → 가방 안 꾸미기 목록

  //편집 모드 상태
  const [isEditMode, setIsEditMode] = useState(false); //isEditMode → 편집모드 켜졌는지
  const [selectedObject, setSelectedObject] = useState(null);//selectedObject → 현재 선택된 오브젝트
  const [placementPreview, setPlacementPreview] = useState(null);//placementPreview → 놓을 위치 미리보기

  //마을 실제 데이터
  const [decorations, setDecorations] = useState([]);
  const [characters, setCharacters] = useState(DEFAULT_VILLAGE_DATA.village_characters);
  const [buildingLayout, setBuildingLayout] = useState(DEFAULT_BUILDINGS);

  //ef는 state랑 다르게:👉 값이 바뀌어도 렌더링 안 일어남, 그냥 내부 기억용
  const originalVillageRef = useRef(null);
  const hasCategoryInteractionRef = useRef(false);
  const chainRepairOnceRef = useRef(false);
  const expPopupTimerRef = useRef(null);
  const pointPopupTimerRef = useRef(null);

  //데이터 바뀌면 자동 새로고침(앱 어디선가 데이터가 바뀌면 자동으로 다시 불러와라")
  useEffect(() => {
    const handleUpdate = () => setGuestVersion((prev) => prev + 1);
    window.addEventListener('root-home-data-updated', handleUpdate);
    return () => window.removeEventListener('root-home-data-updated', handleUpdate);
  }, []);

  //경험치 팝업 자동 사라짐
  useEffect(() => {
    if (!expPopup) return undefined;
    clearTimeout(expPopupTimerRef.current);
    expPopupTimerRef.current = setTimeout(() => setExpPopup(null), 1400);
    return () => clearTimeout(expPopupTimerRef.current);
  }, [expPopup]);

  //포인트 팝업 자동 사라짐
  useEffect(() => {
    if (!pointPopup) return undefined;
    clearTimeout(pointPopupTimerRef.current);
    pointPopupTimerRef.current = setTimeout(() => setPointPopup(null), 1400);
    return () => clearTimeout(pointPopupTimerRef.current);
  }, [pointPopup]);

  //로그인 상태 확인
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 1000 * 30,
  });

  const isGuest = !user;// user 없으면 → 게스트

  //게스트 데이터 가져오기
  const { data: guestData = {} } = useQuery({
    queryKey: ['guest-home-data', guestVersion],
    queryFn: () => readGuestData(),
    staleTime: 0,
  });

  //목표 리스트 가져오기 (게스트 or 로그인)
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
    queryKey: ['actionGoals', isGuest, guestVersion], enabled: !isUserLoading, //행동목표 리스트 가져오기 (게스트 / 로그인 분기)
    queryFn: async () => {
      //게스트일 때
      if (isGuest) {
        // 목표먼저 정리
        const normalizedGoals = normalizeGuestGoals(
          Array.isArray(guestData?.goals) && guestData.goals.length > 0
            ? guestData.goals
            : guestData?.goalData
              ? [guestData.goalData]
              : [],
          guestData?.category || 'exercise'
        );

        //actionGoal 꺼내기( 의미:배열이면 그대로 사용, 하나짜리면 배열로 감쌈, 없으면 빈 배열)
        const rawActionGoals =
          Array.isArray(guestData?.actionGoals) && guestData.actionGoals.length > 0
            ? guestData.actionGoals
            : guestData?.actionGoalData
              ? [guestData.actionGoalData]
              : [];

        //정규화 여기서 하는 일:goal_id 연결, category 맞춤, 구조 통일
        return normalizeGuestActionGoals(
          rawActionGoals,
          normalizedGoals,
          guestData?.category || normalizedGoals[0]?.category || 'exercise'
        );
      }
      //로그인 유저 (의미:서버에서 actionGoal 가져옴, 최신순, 최대 200개)
      return base44.entities.ActionGoal.list('-created_date', 200);
    },
  });

   //행동 기록(로그) 가져오기  
  const { data: allLogs = [] } = useQuery({
    queryKey: ['allLogs', isGuest, guestVersion],
    enabled: !isUserLoading,
    queryFn: async () => {
      //게스트면 localStorage에서 기록 가져옴
      if (isGuest) return guestData?.actionLogs || [];
      //로그인이면 서버에서 기록 가져온다
      return base44.entities.ActionLog.list('-date', 500);
    },
  });

  //"actionGoal을 goal에 연결해서 구조를 완성한다"
  const connectedActionGoals = useMemo(
    () => connectActionGoalsToGoals(goals, actionGoals),
    [goals, actionGoals]
  );

  //actionGoal이 어느 result goal에 속하는지 연결이 깨졌으면, 앱이 자동으로 한 번 점검해서 고쳐주는 useEffect"
  useEffect(() => { //actionGoals, goals, isGuest 같은 값이 바뀔 때마다 이 코드가 실행됨
    if (!Array.isArray(actionGoals) || actionGoals.length === 0) return; //뜻: actionGoals가 배열이 아니거나 행동목표가 하나도 없으면 할 일이 없으니까 그냥 끝냄
    if (chainRepairOnceRef.current) return; //이 복구 작업을 계속 반복하면 무한 수정이 될 수 있으니, `한 번만 실행하도록 막는 장치야.

    //각 행동목표를 하나씩 보면서: 이 행동목표가 원래 어느 goal에 연결되어야 하는지 계산함, 그 계산 결과와 현재 저장된 goal_id를 비교함
    const needsRepair = actionGoals.some((goal) => {
      const resolved = resolveGoalIdForActionGoal(goal, goals, activeCategory);
      return !goal?.goal_id || goal.goal_id !== resolved;
    });


    if (!needsRepair) return; //다 정상 연결되어 있으면 아무것도 안 함
    chainRepairOnceRef.current = true; //“복구 작업 시작했음. 다시 반복하지 마.”

    if (isGuest) { //로그인 안 한 사용자라면 서버가 아니라 로컬 데이터를 고쳐야 해.
      writeGuestDataPatch((prev) => { //기존 게스트 데이터를 가져와서 수정한 뒤 다시 저장
        const prevActionGoals = Array.isArray(prev?.actionGoals) ? prev.actionGoals : []; //guest 데이터 안에 저장된 행동목표 배열 가져오기, 없으면 빈 배열

        //각 행동목표마다 기존 내용은 그대로 두고 goal_id만 다시 계산해서 새로 넣음
        const repaired = prevActionGoals.map((goal) => ({
          ...goal,
          goal_id: resolveGoalIdForActionGoal(
            goal,
            goals,
            prev?.category || activeCategory || 'exercise'
          ),
        }));

        // guest 데이터 전체는 유지하면서 actionGoals를 복구된 배열로 바꾸고 actionGoalData도 첫 번째 값 기준으로 맞춰줌 (actionGoalData는 예전 단일 저장 방식 호환용일 가능성이 큼)
        return {
          ...prev,
          actionGoals: repaired,
          actionGoalData: repaired[0] || prev?.actionGoalData || null,
        };
      });

      //게스트 데이터 바뀌었으니 다시 읽어라”라고 앱에 알림 ,그래서 다른 useQuery나 화면이 다시 갱신됨
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    //어떤 항목을 수정해야 하는지 정리
    //각 행동목표마다(id = 이 행동목표의 id, currentGoalId = 지금 저장된 goal_id, nextGoalId = 새로 계산한 올바른 goal_id 를 만들고, 그 다음 filter로 정말 수정이 필요한 것만 남겨.
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

    //계산해 보니 바꿀 게 없으면 끝
    if (updates.length === 0) return;

    //updates에 들어 있는 모든 actionGoal에 대해 해당 id를 찾아서 goal_id를 새 값으로 업데이트, Promise.all은 여러 개를 동시에 처리하는 거야.
    Promise.all(
      updates.map((item) =>
        base44.entities.ActionGoal.update(item.id, {
          goal_id: item.nextGoalId,
        })
      )
    )
      //수정이 끝나면 React Query에게👉 "actionGoals 데이터는 오래됐으니 다시 불러와"라고 알려줌 그래서 최신 서버 데이터로 화면이 갱신돼.
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['actionGoals'] });
      })
      //뜻: 복구 중 에러가 나면 개발자 콘솔에 기록
      .catch((error) => {
        console.error('Failed to repair actionGoal.goal_id:', error);
      });
  }, [actionGoals, goals, isGuest, activeCategory, queryClient, user]); //뜻:이 값들 중 하나라도 바뀌면 이 useEffect를 다시 검사함

  //goal → actionGoal → log 연결 상태를 검사하는 코드
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

  //기록(log)을 바탕으로 카테고리별 레벨/경험치를 계산하는 코드
  const userLevels = useMemo(() => {
   
    if (isGuest) return getDefaultUserLevels(guestData?.actionLogs || []); //게스트는 서버 로그가 없으니까 로컬의 guestData.actionLogs로 계산
   
    return getDefaultUserLevels(allLogs || []); //로그인 유저일 때  서버에서 불러온 allLogs로 계산
  }, [isGuest, guestData, allLogs]);

  //현재 유저가 가진 칭호 id 목록을 가져오는 코드
  const ownedTitleIds = useMemo(
    () => getOwnedTitleIds({ isGuest, user, guestData }),
    [isGuest, user, guestData, guestVersion]
  );

  //현재 장착 중인 칭호가 진짜 유효한지 자동으로 검사하고, 틀리면 고치는 코드
  useEffect(() => {
    ensureValidEquippedTitle({ isGuest, user, guestData, ownedTitleIds, queryClient })
      .then((nextGuest) => {
        //게스트가 아니면 여기서 할 일 없음, 게스트인데 수정된 데이터가 없으면 할 일 없음
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

  //아직 유저 정보를 불러오는 중이면 기다려라
  useEffect(() => {
    if (isUserLoading) return;

    //뜻: 현재 activeCategory 값을 표준 형태로 바꿔서 current에 저장, 이상한 값이면 기본값은 'exercise'
    const current = normalizeCategoryValue(activeCategory, 'exercise');

    //게스트인 경우 guest 데이터 안에서 “현재 카테고리” 후보를 여러 곳에서 찾아봄
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

      //현재 사용자가 직접 카테고리를 눌러서 바꾼 적이 없거나, 현재 값이 유효한 카테고리가 아니면 → guestCategory로 현재 카테고리를 맞춘다
      if (!hasCategoryInteractionRef.current || !VALID_CATEGORIES.includes(current)) {
        setActiveCategory(guestCategory);
      }
      return;
    }

    //뜻: 로그인 유저면 서버 유저 정보의 active_category를 먼저 쓰고 없으면 첫 번째 goal의 category를 사용
    const userCategory = normalizeCategoryValue(
      user?.active_category || goals?.[0]?.category,
      'exercise'
    );

    //뜻은 게스트 때와 같아. 사용자가 직접 누른 적이 없거나 현재 값이 이상하면→ 서버 기준 카테고리로 맞춘다
    if (!hasCategoryInteractionRef.current || !VALID_CATEGORIES.includes(current)) {
      setActiveCategory(userCategory);
    }
  }, [isUserLoading, isGuest, guestData, user, goals, activeCategory]);

  //게스트면 guestData / 로그인 유저면 user에서 마을 데이터 꺼내기
  useEffect(() => {
    const source = isGuest ? guestData : user;
    const village = getVillageState(source || {});

    //의미: 저장된 장식 데이터를 가져와서 type에 맞는 이미지 붙임
    setDecorations(
      (village.village_decorations || []).map((item) => ({
        ...item,
        image: getDecorationImage(item.type),
      }))
    );

    //캐릭터도 동일
    setCharacters(
      (village.village_characters || []).map((item) => ({
        ...item,
        image: getCharacterImage(item.type),
      }))
    );
    setBuildingLayout(village.village_buildings); //건물 위치/상테 세팅
    setInventoryCharacters(village.village_inventory_characters || []);//가방(보관함)데이터
    setInventoryDecorations(village.village_inventory_decorations || []);
    originalVillageRef.current = village;//편집모드 취소용 원본 저장
  }, [isGuest, guestData, user]);

  //저장된 마을 데이터를 화면용 상태로 변환해서 세팅
  const handleCategoryChange = async (category) => {
    const normalizedCategory = normalizeCategoryValue(category, 'exercise'); //값 정리
    hasCategoryInteractionRef.current = true; //유저가 직접 바꿨다” 표시
    setActiveCategory(normalizedCategory); //현재 카테고리 변경

    if (isGuest) {
      //localStorage에 저장
      writeGuestDataPatch((prev) => ({
        ...prev,
        category: normalizedCategory,
        activeCategory: normalizedCategory,
        guest_active_category: normalizedCategory,
      }));
      //전체 UI 갱신
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    try {
      await base44.auth.updateMe({ active_category: normalizedCategory }); //서버에 저장
      queryClient.invalidateQueries({ queryKey: ['me'] }); //유저 정보 다시 불러오기
    } catch (error) {
      console.error(error);
    }
  };

  //현재 선택된 카테고리에 맞는 목표만 필터링
  const activeGoals = useMemo(() => {
    return (goals || []).filter((goal) => {
      const goalCategory = normalizeCategoryValue(goal?.category, '');
      if (goalCategory !== activeCategory) return false; //active 상태만 포함
      if (goal?.status && goal.status !== 'active') return false;
      return true;
    });
  }, [goals, activeCategory]);

  const activeGoal = activeGoals[0] || null; //여러 개 중 첫 번째 목표를 대표로 사용

  //현재 카테고리 + 현재 목표에 연결된 행동목표만 필터링
  const activeActionGoals = useMemo(() => { 
    const goalIds = new Set(activeGoals.map((goal) => goal.id)); //현재 카테고리 목표들의 id

    return (connectedActionGoals || []).filter((actionGoal) => {
      const actionCategory = normalizeCategoryValue(actionGoal?.category, '');
      if (actionCategory !== activeCategory) return false; //카테고리 맞아야 함
      //상태 체크
      if (
        actionGoal?.status &&
        actionGoal.status !== 'active' &&
        actionGoal.status !== 'completed'
      ) {
        return false;
      }
      if (!actionGoal?.goal_id) return false;//goal_id 있어야 함
      if (goalIds.size === 0) return false;//goal이 존재해야 함

      return goalIds.has(actionGoal.goal_id);//현재 목표에 속한 행동목표만
    });
  }, [connectedActionGoals, activeCategory, activeGoals]);

  //현재 선택된 목표(activeGoal)의 기록만 필터링
  const goalLogs = useMemo(() => {
    if (!activeGoal) return [];
    return (allLogs || []).filter((log) => log?.goal_id === activeGoal.id);
  }, [allLogs, activeGoal]);

  const today = getTodayString();//오늘 날짜
  const grouped = useMemo(() => groupActionGoals(activeActionGoals, today), [activeActionGoals, today]); //행동목표를 오늘 기준으로 그룹화

  const nickname = isGuest ? guestData?.nickname || '용사' : user?.nickname || '용사'; //닉네임 가져오기 (없으면 기본값 '용사')

  //카테고리별 목표 생성 페이지로 이동
  const handleCreateGoal = () => {
    const route = CATEGORY_ROUTE_MAP[activeCategory] || '/CreateGoalExercise';
    navigate(route);
  };

  //새로운 칭호를 얻었을 때 저장하는 함수
  const persistNewTitle = async (titleId) => {
    if (!titleId) return null;

    if (isGuest) {
      try {
        await addOwnedTitle({ titleId, isGuest, user, queryClient });//localStorage에 추가
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

  //대표 칭호 설정 (프로필에 표시되는 칭호)
  const handleEquipTitle = async (titleId) => {
    try {
      await setEquippedTitle({ titleId, isGuest, user, queryClient }); //장착 처리
      setNewTitle(null); //팝업닫기

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

  const saveVillageState = async (nextState) => {//마을 데이터를 저장하는 핵심 함수 (게스트/로그인 분기)
    //데이터 깨짐 방지 숫자 → 무조건 숫자로 변환, 배열 → 아니면 빈 배열
    const safeState = {
      village_points: Number(nextState?.village_points || 0),
      village_decorations: Array.isArray(nextState?.village_decorations) ? nextState.village_decorations : [],
      village_characters: Array.isArray(nextState?.village_characters) ? nextState.village_characters : [],
      village_buildings: Array.isArray(nextState?.village_buildings) ? nextState.village_buildings : [],
      village_inventory_characters: Array.isArray(nextState?.village_inventory_characters) ? nextState.village_inventory_characters : [],
      village_inventory_decorations: Array.isArray(nextState?.village_inventory_decorations) ? nextState.village_inventory_decorations : [],
    };

    if (isGuest) {
      writeGuestDataPatch((prev) => ({  ...prev, //기존 데이터 유지하면서 업데이트
        village_points: safeState.village_points,
        village_decorations: safeState.village_decorations.map(({ image, ...rest }) => rest), //image 제거하고 저장 왜냐면:image는 UI용. 저장하면 용량 커짐 + 필요 없음
        village_characters: safeState.village_characters.map(({ image, ...rest }) => rest),
        village_buildings: safeState.village_buildings,
        village_inventory_characters: safeState.village_inventory_characters,
        village_inventory_decorations: safeState.village_inventory_decorations,
      }));
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    //서버에 저장
    await base44.auth.updateMe({
      village_points: safeState.village_points,
      village_decorations: safeState.village_decorations.map(({ image, ...rest }) => rest),
      village_characters: safeState.village_characters.map(({ image, ...rest }) => rest),
      village_buildings: safeState.village_buildings,
      village_inventory_characters: safeState.village_inventory_characters,
      village_inventory_decorations: safeState.village_inventory_decorations,
    });
    queryClient.invalidateQueries({ queryKey: ['me'] });//유저 데이터 다시 불러오기
  };

  const handleVillagePurchase = async (item) => { //상점에서 아이템 구매 처리
    //현재 마을 상태 + 포인트
    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});
    const currentPoints = Number(currentVillage.village_points || 0);

    //돈 없으면 구매 불가 ❌
    if (currentPoints < item.price) {
      toast.error('포인트가 부족해요.');
      return;
    }

    const nextPoints = currentPoints - item.price; //포인트 차감
    const newInventoryItem = createInventoryItem(item);//아이템 생성
    const nextInventoryCharacters = [...inventoryCharacters];//인벤토리 복사
    const nextInventoryDecorations = [...inventoryDecorations];//아이템 넣기

    if (item.type === 'decoration') {
      nextInventoryDecorations.push(newInventoryItem);
    } else {
      nextInventoryCharacters.push(newInventoryItem);
    }

    //구매 후 전체 마을 상태
    const nextState = {
      village_points: nextPoints,
      village_decorations: decorations,
      village_characters: characters,
      village_buildings: buildingLayout,
      village_inventory_characters: nextInventoryCharacters,
      village_inventory_decorations: nextInventoryDecorations,
    };

    try {
      await saveVillageState(nextState);//위에서 만든 저장 함수 실행
      setInventoryCharacters(nextInventoryCharacters);
      setInventoryDecorations(nextInventoryDecorations);
      originalVillageRef.current = { ...currentVillage, ...nextState };
      toast.success(`${item.label} 구매 완료! 가방에 보관했어요. (-${item.price} 포인트)`);//성공 메시지
    } catch (error) {
      console.error('handleVillagePurchase error:', error);
      toast.error('구매 중 오류가 발생했어요.');
    }
  };

  //인벤토리(가방)에 있는 아이템을 마을에 꺼내서 배치
  const handlePlaceInventoryItem = async (inventoryItem) => {
    //1단계: 현재 상태 가져오기
    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});

    //2단계: 배열 복사
    const nextCharacters = [...characters];
    const nextDecorations = [...decorations];
    const nextInventoryCharacters = [...inventoryCharacters];
    const nextInventoryDecorations = [...inventoryDecorations];

    if (inventoryItem.type === 'character') {
      nextCharacters.push(createPlacedObjectFromInventory(inventoryItem)); //3단계: 캐릭터인 경우 마을에 추가
      const removeIndex = nextInventoryCharacters.findIndex((item) => item.id === inventoryItem.id); //가방에서 제거
      if (removeIndex >= 0) nextInventoryCharacters.splice(removeIndex, 1);
    } else {
      nextDecorations.push(createPlacedObjectFromInventory(inventoryItem)); //장식일 경우 마을에 추가
      const removeIndex = nextInventoryDecorations.findIndex((item) => item.id === inventoryItem.id); //가방에서 제거 
      if (removeIndex >= 0) nextInventoryDecorations.splice(removeIndex, 1);
    }

    //4단계 다음 상태 만들기
    const nextState = {
      village_points: currentVillage.village_points,
      village_decorations: nextDecorations,
      village_characters: nextCharacters,
      village_buildings: buildingLayout,
      village_inventory_characters: nextInventoryCharacters,
      village_inventory_decorations: nextInventoryDecorations,
    };

    try {
      await saveVillageState(nextState); //local or 서버 저장
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

  //마을에 있는 오브젝트를 다시 가방에 넣기
  const handleStoreSelected = async () => {
    if (!selectedObject) return; //아무것도 선택 안 했으면 종료
    if (selectedObject.type !== 'character' && selectedObject.type !== 'decoration') return; //캐릭터/장식만 가능

    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});
    //상태복사
    const nextCharacters = [...characters];
    const nextDecorations = [...decorations];
    const nextInventoryCharacters = [...inventoryCharacters];
    const nextInventoryDecorations = [...inventoryDecorations];

    if (selectedObject.type === 'character') {
      const target = nextCharacters.find((item) => item.id === selectedObject.id); //마을에서 해당 캐릭터 찾기
      if (!target || target.id === 'starter_fox') {//기본 캐릭터는 저장 불가
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

    //4단계 장식 저장
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

    //변경된 마을 상태를 저장하고, 화면 상태를 최신으로 갱신하고, 선택 상태를 초기화하는 코드
    //최종 마을 상태 만들기(현재 상황을 기준으로 ‘완성된 마을 상태’를 하나의 객체로 만든 것)
    const nextState = {
      village_points: currentVillage.village_points,
      village_decorations: nextDecorations,
      village_characters: nextCharacters,
      village_buildings: buildingLayout,
      village_inventory_characters: nextInventoryCharacters,
      village_inventory_decorations: nextInventoryDecorations,
    };

   
    try {
      await saveVillageState(nextState); //저장 실랭( 이 상태를 실제로 저장 게스트 → localStorage,로그인 → 서버(Base44))
      
      //React 상태 업데이트 (화면을 바로 바꾸기 위한 상태 업데이트)
      setCharacters(nextCharacters); 
      setDecorations(nextDecorations);
      setInventoryCharacters(nextInventoryCharacters);
      setInventoryDecorations(nextInventoryDecorations);
      
      //선택 상태 초기화 (🔥 UX 핵심)
      setSelectedObject(null);
      setPlacementPreview(null);
      
      originalVillageRef.current = { ...currentVillage, ...nextState };
      toast.success('가방에 넣었어요!');//성공 메시지

      //에러 처리 (의미 : 실패하면 -> 콘솔 로그,사용자 알림)
    } catch (error) {
      console.error('handleStoreSelected error:', error);
      toast.error('가방에 넣는 중 오류가 발생했어요.');
    }
  };

  //편집모드 ON/OFF를 담당하는 버튼 로직(편집 중이면 저장하고, 아니면 편집모드로 들어간다)
  //지금 편집모드 상태라면 → 저장 버튼처럼 동작
  const handleToggleEditMode = () => {
    if (isEditMode) { handleSaveEdit();  return; }
    setSelectedObject(null); //편집모드 진입 전 초기화 
    setPlacementPreview(null); //편집모드 진입 전 초기화 
    setIsEditMode(true); //편집시작
  };

  //“배치가 유효한지 확인 → 마을 상태 저장 → 편집모드 종료”
  const handleSaveEdit = async () => {
    if (placementPreview && !placementPreview.valid) {
      toast.error('빨간 칸 상태에서는 저장할 수 없어요.');
      return;
    } // 잘못된 위치(충돌/범위 밖)면 저장 막기

    //현재 마을 상태 가져오기( 현재 저장된 마을 상태 불러오기)
    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});

    //지금 화면 상태 그대로 저장할 데이터 만들기
    const nextState = {
      village_points: currentVillage.village_points,
      village_decorations: decorations,
      village_characters: characters,
      village_buildings: buildingLayout,
      village_inventory_characters: inventoryCharacters,
      village_inventory_decorations: inventoryDecorations,
    };

    //try { ... } catch (error) { ... } 이건 try = 일단 실행해봐, catch = 실행하다가 에러 나면 여기로 와 라는 뜻이야.
    try {
      await saveVillageState(nextState); //저장 실행(마을 상태 실제 저장 : 게스트 → localStorage, 로그인 → 서버)
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

  //편집 취소 버튼”을 눌렀을 때 실행되는 함수 👉 “지금까지 바꾼 거 다 버리고, 원래 상태로 되돌린다”
  const handleCancelEdit = () => {//“편집 취소 함수 시작”
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
