import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

import {
  CATEGORY_ROUTE_MAP, CATEGORY_LABELS, VALID_CATEGORIES,
  DEFAULT_BUILDINGS, DEFAULT_VILLAGE_DATA,
} from '@/lib/villageConstants';

import {
  readGuestData, writeGuestDataPatch,
  normalizeCategoryValue,
  getTodayString,
  getWeeklyLogsForAction, getAllLogsForAction, getStreakForAction,
  groupActionGoals,
  calculateExp, calculateVillagePointReward, getDefaultUserLevels,
  buildDerivedStats, getNewlyUnlockedTitle,
  resolveGoalIdForActionGoal, connectActionGoalsToGoals,
  normalizeGuestGoals, normalizeGuestActionGoals,
  validateGoalActionLogChain,
  getCharacterImage, getDecorationImage,
  createInventoryItem, createPlacedObjectFromInventory,
  getVillageState,
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
import VillageWorldLayer from '@/components/home/VillageWorldLayer';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [guestVersion, setGuestVersion] = useState(0);
  const [isOverview, setIsOverview] = useState(false);
  const [debugLevel, setDebugLevel] = useState(null);

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
          goal_id: resolveGoalIdForActionGoal(goal, goals, prev?.category || activeCategory || 'exercise'),
        }));
        return { ...prev, actionGoals: repaired, actionGoalData: repaired[0] || prev?.actionGoalData || null };
      });
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    const updates = actionGoals
      .map((goal) => ({
        id: goal?.id,
        currentGoalId: goal?.goal_id || null,
        nextGoalId: resolveGoalIdForActionGoal(goal, goals, user?.active_category || activeCategory || 'exercise'),
      }))
      .filter((item) => item.id && item.nextGoalId && item.currentGoalId !== item.nextGoalId);

    if (updates.length === 0) return;

    Promise.all(updates.map((item) => base44.entities.ActionGoal.update(item.id, { goal_id: item.nextGoalId })))
      .then(() => { queryClient.invalidateQueries({ queryKey: ['actionGoals'] }); })
      .catch((error) => { console.error('Failed to repair actionGoal.goal_id:', error); });
  }, [actionGoals, goals, isGuest, activeCategory, queryClient, user]);

  useEffect(() => {
    const report = validateGoalActionLogChain(goals, connectedActionGoals, allLogs);
    if (report.actionGoalsWithoutGoalId > 0 || report.logsWithoutGoalId > 0 || report.logsWithUnknownActionGoal > 0 || report.actionGoalsWithUnknownGoal > 0) {
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
      .catch((error) => { console.error('ensureValidEquippedTitle error:', error); });
  }, [isGuest, ownedTitleIds, guestData, queryClient]);

  useEffect(() => {
    if (isUserLoading) return;
    const current = normalizeCategoryValue(activeCategory, 'exercise');

    if (isGuest) {
      const guestCategory = normalizeCategoryValue(
        guestData?.activeCategory || guestData?.guest_active_category || guestData?.category || guestData?.goalData?.category || guestData?.actionGoalData?.category || guestData?.goals?.[0]?.category,
        'exercise'
      );
      if (!hasCategoryInteractionRef.current || !VALID_CATEGORIES.includes(current)) {
        setActiveCategory(guestCategory);
      }
      return;
    }

    const userCategory = normalizeCategoryValue(user?.active_category || goals?.[0]?.category, 'exercise');
    if (!hasCategoryInteractionRef.current || !VALID_CATEGORIES.includes(current)) {
      setActiveCategory(userCategory);
    }
  }, [isUserLoading, isGuest, guestData, user, goals, activeCategory]);

  useEffect(() => {
    const source = isGuest ? guestData : user;
    const village = getVillageState(source || {});

    setDecorations((village.village_decorations || []).map((item) => ({ ...item, image: getDecorationImage(item.type) })));
    setCharacters((village.village_characters || []).map((item) => ({ ...item, isMoving: false, image: getCharacterImage(item.type, false, 0) })));
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
      writeGuestDataPatch((prev) => ({ ...prev, category: normalizedCategory, activeCategory: normalizedCategory, guest_active_category: normalizedCategory }));
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
      if (actionGoal?.status && actionGoal.status !== 'active' && actionGoal.status !== 'completed') return false;
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
      } catch (error) { console.error('persistNewTitle guest error:', error); }
      return titleId;
    }
    try {
      await addOwnedTitle({ titleId, isGuest, user, queryClient });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (error) { console.error('persistNewTitle user error:', error); }
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

    if (currentPoints < item.price) { toast.error('포인트가 부족해요.'); return; }

    const nextPoints = currentPoints - item.price;
    const newInventoryItem = createInventoryItem(item);
    const nextInventoryCharacters = [...inventoryCharacters];
    const nextInventoryDecorations = [...inventoryDecorations];

    if (item.type === 'decoration') nextInventoryDecorations.push(newInventoryItem);
    else nextInventoryCharacters.push(newInventoryItem);

    const nextState = { village_points: nextPoints, village_decorations: decorations, village_characters: characters, village_buildings: buildingLayout, village_inventory_characters: nextInventoryCharacters, village_inventory_decorations: nextInventoryDecorations };

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

    const nextState = { village_points: currentVillage.village_points, village_decorations: nextDecorations, village_characters: nextCharacters, village_buildings: buildingLayout, village_inventory_characters: nextInventoryCharacters, village_inventory_decorations: nextInventoryDecorations };

    try {
      await saveVillageState(nextState);
      setCharacters(nextCharacters);
      setDecorations(nextDecorations);
      setInventoryCharacters(nextInventoryCharacters);
      setInventoryDecorations(nextInventoryDecorations);
      originalVillageRef.current = { ...currentVillage, ...nextState };
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
      if (!target || target.id === 'starter_fox') { toast.error('기본 캐릭터는 가방에 넣을 수 없어요.'); return; }
      const removeIndex = nextCharacters.findIndex((item) => item.id === selectedObject.id);
      if (removeIndex >= 0) nextCharacters.splice(removeIndex, 1);
      nextInventoryCharacters.push({ id: `inv_${target.type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`, type: 'character', subtype: target.type, label: target.name || (target.type === 'alpaca' ? '알파카' : target.type === 'platypus' ? '오리너구리' : '여우') });
    }

    if (selectedObject.type === 'decoration') {
      const target = nextDecorations.find((item) => item.id === selectedObject.id);
      if (!target) return;
      const removeIndex = nextDecorations.findIndex((item) => item.id === selectedObject.id);
      if (removeIndex >= 0) nextDecorations.splice(removeIndex, 1);
      nextInventoryDecorations.push({ id: `inv_${target.type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`, type: 'decoration', subtype: target.type, label: target.type === 'tree' ? '나무' : target.type === 'flower' ? '꽃' : '잔디' });
    }

    const nextState = { village_points: currentVillage.village_points, village_decorations: nextDecorations, village_characters: nextCharacters, village_buildings: buildingLayout, village_inventory_characters: nextInventoryCharacters, village_inventory_decorations: nextInventoryDecorations };

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
    if (isEditMode) { handleSaveEdit(); return; }
    setSelectedObject(null);
    setPlacementPreview(null);
    setIsEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (placementPreview && !placementPreview.valid) { toast.error('빨간 칸 상태에서는 저장할 수 없어요.'); return; }

    const source = isGuest ? guestData : user;
    const currentVillage = getVillageState(source || {});
    const nextState = { village_points: currentVillage.village_points, village_decorations: decorations, village_characters: characters, village_buildings: buildingLayout, village_inventory_characters: inventoryCharacters, village_inventory_decorations: inventoryDecorations };

    try {
      await saveVillageState(nextState);
      originalVillageRef.current = { ...currentVillage, ...nextState };
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
    setDecorations((village.village_decorations || []).map((item) => ({ ...item, image: getDecorationImage(item.type) })));
    setCharacters((village.village_characters || []).map((item) => ({ ...item, isMoving: false, image: getCharacterImage(item.type, false, 0) })));
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
      setDecorations((prev) => prev.map((item) => item.id === selectedObject.id ? { ...item, flipped: !item.flipped } : item));
      return;
    }
    if (selectedObject.type === 'character') {
      setCharacters((prev) => prev.map((item) => item.id === selectedObject.id ? { ...item, flipped: !item.flipped } : item));
      return;
    }
    if (selectedObject.type === 'building') {
      setBuildingLayout((prev) => prev.map((item) => item.category === selectedObject.id ? { ...item, flipped: !item.flipped } : item));
    }
  };

  const handleActionComplete = async (actionGoal, minutes = 0, extra = {}) => {
    try {
      const now = new Date().toISOString();
      const todayStr = getTodayString();
      const earnedExp = calculateExp(actionGoal, minutes);
      const earnedVillagePoints = calculateVillagePointReward(actionGoal, minutes);

      const safeGoalId = actionGoal?.goal_id || resolveGoalIdForActionGoal(actionGoal, goals, activeCategory);
      if (!safeGoalId) { toast.error('행동목표와 결과목표 연결이 끊어졌어요. 새로고침 후 다시 시도해 주세요.'); return; }

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
          guestDataPersistence.updateActionGoal(actionGoal.id, { status: 'completed', completed: true, completed_date: todayStr, updated_date: now });
        }
        writeGuestDataPatch((prev) => ({ ...prev, village_points: nextVillagePoints }));
        queryClient.removeQueries({ queryKey: ['guest-home-data'] });
        queryClient.removeQueries({ queryKey: ['guest-records-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-home-data'] });
        queryClient.invalidateQueries({ queryKey: ['guest-records-data'] });
        window.dispatchEvent(new Event('root-home-data-updated'));
      } else {
        await base44.entities.ActionLog.create({ ...logPayload, id: undefined });
        if (actionGoal.action_type === 'one_time') {
          await base44.entities.ActionGoal.update(actionGoal.id, { status: 'completed', completed: true, completed_date: todayStr, updated_date: now });
        }
        await base44.auth.updateMe({ village_points: nextVillagePoints });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['allLogs'] }),
          queryClient.invalidateQueries({ queryKey: ['actionGoals'] }),
          queryClient.invalidateQueries({ queryKey: ['goals'] }),
          queryClient.invalidateQueries({ queryKey: ['me'] }),
        ]);
      }

      setExpPopup(earnedExp);
      setPointPopup(earnedVillagePoints);

      const currentLogs = isGuest ? (Array.isArray(guestData?.actionLogs) ? guestData.actionLogs : []) : (Array.isArray(allLogs) ? allLogs : []);
      const currentActionGoals = isGuest ? (Array.isArray(guestData?.actionGoals) ? connectActionGoalsToGoals(goals, guestData.actionGoals) : []) : (Array.isArray(connectedActionGoals) ? connectedActionGoals : []);
      const nextLogs = [...currentLogs, logPayload];
      const nextActionGoals = actionGoal.action_type === 'one_time'
        ? currentActionGoals.map((goal) => goal.id === actionGoal.id ? { ...goal, status: 'completed', completed: true, completed_date: todayStr, updated_date: now } : goal)
        : currentActionGoals;

      const nextStats = buildDerivedStats(nextLogs, nextActionGoals);
      const currentOwnedTitleIds = isGuest ? getOwnedTitleIds({ isGuest: true, user: null, guestData: readGuestData() }) : getOwnedTitleIds({ isGuest: false, user, guestData: null });
      const unlocked = getNewlyUnlockedTitle(nextStats, currentOwnedTitleIds);
      if (unlocked) { await persistNewTitle(unlocked.id); setNewTitle(unlocked); }

      toast.success('행동목표를 완료했어요!');
    } catch (error) {
      console.error('handleActionComplete error:', error);
      toast.error('행동목표 완료 처리 중 오류가 발생했어요.');
    }
  };

  const realTotalLevel = useMemo(() => {
    const sum =
      Number(userLevels.exercise_level || 1) +
      Number(userLevels.study_level || 1) +
      Number(userLevels.mental_level || 1) +
      Number(userLevels.daily_level || 1);
    return Math.max(1, Math.floor(sum / 4));
  }, [userLevels]);

  const totalLevel = debugLevel !== null ? debugLevel : realTotalLevel;

  const points = Number(getVillageState(isGuest ? guestData : user).village_points || 0);

  return (
    <div
      className="min-h-screen pb-28"
      style={{ background: 'linear-gradient(180deg, #f8f1df 0%, #f5e8c9 38%, #f2e1bc 68%, #ebd6a9 100%)' }}
    >
      {/* 디버그 레벨 버튼 */}
      <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-1">
        {debugLevel !== null && (
          <button
            onClick={() => setDebugLevel(null)}
            className="px-2 py-1 rounded text-xs font-bold"
            style={{ background: '#7a5020', color: '#fff' }}
          >
            실제 Lv.{realTotalLevel}로 복귀
          </button>
        )}
        {[1, 2, 3, 5, 7, 9].map((lv) => (
          <button
            key={lv}
            onClick={() => setDebugLevel(lv)}
            className="px-2 py-1 rounded text-xs font-bold"
            style={{
              background: totalLevel === lv ? '#8b5a20' : '#e8d4a0',
              color: totalLevel === lv ? '#fff' : '#7a5020',
              border: '1px solid #c49a4a',
            }}
          >
            Lv.{lv}
          </button>
        ))}
      </div>

      {expPopup ? <ExpPopup exp={expPopup} /> : null}
      {pointPopup ? <PointPopup points={pointPopup} /> : null}

      {newTitle ? (
        <TitleUnlockModal title={newTitle} onClose={() => setNewTitle(null)} onEquip={() => handleEquipTitle(newTitle.id)} />
      ) : null}

      <VillageShopModal open={isShopOpen} activeTab={shopTab} onTabChange={setShopTab} points={points} onClose={() => setIsShopOpen(false)} onBuy={handleVillagePurchase} />
      <VillageBagModal open={isBagOpen} activeTab={bagTab} onTabChange={setBagTab} inventoryCharacters={inventoryCharacters} inventoryDecorations={inventoryDecorations} onClose={() => setIsBagOpen(false)} onPlaceItem={handlePlaceInventoryItem} />

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
        onOpenShop={() => { setShopTab('character'); setIsShopOpen(true); }}
        onOpenBag={() => { setBagTab('character'); setIsBagOpen(true); }}
        onToggleEditMode={handleToggleEditMode}
        onFlipSelected={handleFlipSelected}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onStoreSelected={handleStoreSelected}
      />

      <div
        className="sticky top-[314px] z-40 -mx-4 px-4 pt-1 pb-2"
        style={{ background: 'linear-gradient(180deg, rgba(248,241,223,0.98) 0%, rgba(245,232,201,0.95) 78%, rgba(245,232,201,0.88) 100%)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      >
        <div className="px-4">
          <CategoryTabs active={activeCategory} onChange={handleCategoryChange} userLevels={userLevels} />
        </div>
      </div>

      <div className="space-y-4 px-4 pt-4">
        {activeGoal ? (
          <GoalProgress goal={activeGoal} logs={goalLogs} />
        ) : (
          <EmptyGoalState category={activeCategory} onCreateGoal={handleCreateGoal} />
        )}

        {activeGoal ? (
          <div className="space-y-6 pt-1">
            <Section title="오늘 해야 할 것" count={grouped.todayItems.length} emptyText="오늘 해야 할 행동목표가 없어요.">
              {grouped.todayItems.map((actionGoal) => (
                <ActionGoalCard key={actionGoal.id} actionGoal={actionGoal} weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)} allLogs={getAllLogsForAction(allLogs, actionGoal.id)} streak={getStreakForAction(allLogs, actionGoal.id)} onComplete={handleActionComplete} />
              ))}
            </Section>

            <Section title="예정된 목표" count={grouped.scheduledItems.length} emptyText="예정된 목표가 없어요.">
              {grouped.scheduledItems.map((actionGoal) => (
                <ActionGoalCard key={actionGoal.id} actionGoal={actionGoal} weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)} allLogs={getAllLogsForAction(allLogs, actionGoal.id)} streak={getStreakForAction(allLogs, actionGoal.id)} onComplete={handleActionComplete} />
              ))}
            </Section>

            <Section title="기한 지난 목표" count={grouped.overdueItems.length} emptyText="기한 지난 목표가 없어요.">
              {grouped.overdueItems.map((actionGoal) => (
                <ActionGoalCard key={actionGoal.id} actionGoal={actionGoal} weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)} allLogs={getAllLogsForAction(allLogs, actionGoal.id)} streak={getStreakForAction(allLogs, actionGoal.id)} onComplete={handleActionComplete} />
              ))}
            </Section>

            <div className="pt-1">
              <AddActionGoalButton onClick={handleCreateGoal} categoryLabel={CATEGORY_LABELS[activeCategory]} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}