import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { guestDataPersistence } from '@/lib/GuestDataPersistence';
import { toast } from 'sonner';

import CharacterBanner from '@/components/home/CharacterBanner';
import CategoryTabs from '@/components/home/CategoryTabs';
import GoalProgress from '@/components/home/GoalProgress';
import ActionGoalCard from '@/components/home/ActionGoalCard';
import EmptyGoalState from '@/components/home/EmptyGoalState';

const CATEGORY_ROUTE_MAP = {
  exercise: '/CreateGoalExercise',
  study: '/CreateGoalStudy',
  mental: '/CreateGoalMental',
  daily: '/CreateGoalDaily',
};

const CATEGORY_LABELS = {
  exercise: '운동',
  study: '공부',
  mental: '정신',
  daily: '일상',
};

const GUEST_TITLES_KEY = 'root_guest_titles';
const GUEST_EQUIPPED_TITLE_KEY = 'root_guest_equipped_title';

const TITLES = [
  { id: 'common_first_step', name: '첫 걸음을 뗀 자', description: '첫 행동목표를 완료한 용사', metric: 'total_actions', value: 1, category: 'common' },
  { id: 'common_route_walker', name: '루트를 걷는 자', description: '전체 행동목표 100회 달성', metric: 'total_actions', value: 100, category: 'common' },

  { id: 'exercise_001', name: '몸을 깨운 자', description: '운동 행동목표 10회 달성', metric: 'total_exercise_count', value: 10, category: 'exercise' },
  { id: 'exercise_002', name: '꾸준함의 전사', description: '운동 행동목표 50회 달성', metric: 'total_exercise_count', value: 50, category: 'exercise' },
  { id: 'exercise_003', name: '바람을 걷는 자', description: '러닝 거리 50km 누적', metric: 'total_running_km', value: 50, category: 'exercise' },
  { id: 'exercise_004', name: '운동의 장인', description: '운동 행동목표 200회 달성', metric: 'total_exercise_count', value: 200, category: 'exercise' },

  { id: 'study_001', name: '집중 입문자', description: '공부 10시간 누적', metric: 'total_study_minutes', value: 600, category: 'study' },
  { id: 'study_002', name: '집중 수련생', description: '공부 30시간 누적', metric: 'total_study_minutes', value: 1800, category: 'study' },
  { id: 'study_003', name: '몰입의 실천가', description: '공부 100시간 누적', metric: 'total_study_minutes', value: 6000, category: 'study' },
  { id: 'study_004', name: '집중의 장인', description: '공부 300시간 누적', metric: 'total_study_minutes', value: 18000, category: 'study' },

  { id: 'mental_001', name: '마음을 들여다본 자', description: '정신 행동목표 10회 달성', metric: 'total_mental_count', value: 10, category: 'mental' },
  { id: 'mental_002', name: '유혹 저항가', description: '금연/금주 7일 누적', metric: 'total_no_smoking_days', value: 7, category: 'mental' },
  { id: 'mental_003', name: '절제의 기사', description: '금연/금주 30일 누적', metric: 'total_no_smoking_days', value: 30, category: 'mental' },
  { id: 'mental_004', name: '내면의 관리자', description: '정신 행동목표 100회 달성', metric: 'total_mental_count', value: 100, category: 'mental' },

  { id: 'daily_001', name: '하루를 시작한 자', description: '일상 행동목표 5회 달성', metric: 'total_daily_count', value: 5, category: 'daily' },
  { id: 'daily_002', name: '생활의 입문자', description: '일상 행동목표 30회 달성', metric: 'total_daily_count', value: 30, category: 'daily' },
  { id: 'daily_003', name: '생활의 관리자', description: '일상 행동목표 100회 달성', metric: 'total_daily_count', value: 100, category: 'daily' },
  { id: 'daily_004', name: '삶을 다듬는 자', description: '일상 행동목표 200회 달성', metric: 'total_daily_count', value: 200, category: 'daily' },
];

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function normalizeDateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function getGoalEndDate(goal) {
  if (!goal?.start_date || !goal?.duration_days) return null;

  const start = new Date(goal.start_date);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start);
  end.setDate(end.getDate() + Number(goal.duration_days || 0));
  end.setHours(23, 59, 59, 999);
  return end;
}

function getMonday(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getSunday(date = new Date()) {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

function getWeeklyLogsForAction(logs, actionGoalId) {
  const monday = getMonday();
  const sunday = getSunday();

  return (logs || []).filter((log) => {
    if (log?.action_goal_id !== actionGoalId) return false;
    if (!log?.date) return false;

    const logDate = new Date(log.date);
    if (Number.isNaN(logDate.getTime())) return false;

    return logDate >= monday && logDate <= sunday;
  });
}

function getAllLogsForAction(logs, actionGoalId) {
  return (logs || []).filter((log) => log?.action_goal_id === actionGoalId);
}

function getStreakForAction(logs, actionGoalId) {
  const completedDates = (logs || [])
    .filter((log) => log?.action_goal_id === actionGoalId && log?.completed && log?.date)
    .map((log) => normalizeDateOnly(log.date))
    .filter(Boolean);

  const dateSet = new Set(completedDates);

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (true) {
    const dateStr = normalizeDateOnly(cursor);
    if (!dateSet.has(dateStr)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getDefaultUserLevels(logs = []) {
  const result = {
    exercise_level: 1,
    exercise_xp: 0,
    study_level: 1,
    study_xp: 0,
    mental_level: 1,
    mental_xp: 0,
    daily_level: 1,
    daily_xp: 0,
  };

  (logs || []).forEach((log) => {
    const category = log?.category;
    if (!category) return;

    let addXp = 10;
    if (log?.duration_minutes && Number(log.duration_minutes) > 0) addXp = 15;
    if (log?.meta_action_type === 'one_time') addXp = 20;

    if (!Object.prototype.hasOwnProperty.call(result, `${category}_xp`)) return;
    result[`${category}_xp`] += addXp;
  });

  ['exercise', 'study', 'mental', 'daily'].forEach((category) => {
    const xp = result[`${category}_xp`] || 0;
    result[`${category}_level`] = Math.max(1, Math.floor(xp / 30) + 1);
  });

  return result;
}

function groupActionGoals(actionGoals, today) {
  const todayItems = [];
  const scheduledItems = [];
  const overdueItems = [];

  (actionGoals || []).forEach((actionGoal) => {
    const isOneTime = actionGoal?.action_type === 'one_time';

    if (isOneTime) {
      const scheduledDate = normalizeDateOnly(actionGoal?.scheduled_date);

      if (!scheduledDate) {
        scheduledItems.push(actionGoal);
        return;
      }

      const isCompleted =
        actionGoal?.status === 'completed' || actionGoal?.completed === true;

      if (isCompleted) {
        scheduledItems.push(actionGoal);
        return;
      }

      if (scheduledDate < today) {
        overdueItems.push(actionGoal);
        return;
      }

      if (scheduledDate === today) {
        todayItems.push(actionGoal);
        return;
      }

      scheduledItems.push(actionGoal);
      return;
    }

    const endDate = getGoalEndDate(actionGoal);

    if (endDate) {
      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const compareEnd = new Date(endDate);
      compareEnd.setHours(0, 0, 0, 0);

      if (compareEnd < todayDate) {
        overdueItems.push(actionGoal);
        return;
      }
    }

    todayItems.push(actionGoal);
  });

  scheduledItems.sort((a, b) => {
    const aDate = normalizeDateOnly(a?.scheduled_date) || '9999-12-31';
    const bDate = normalizeDateOnly(b?.scheduled_date) || '9999-12-31';
    return aDate.localeCompare(bDate);
  });

  overdueItems.sort((a, b) => {
    const aDate = normalizeDateOnly(a?.scheduled_date) || '0000-01-01';
    const bDate = normalizeDateOnly(b?.scheduled_date) || '0000-01-01';
    return aDate.localeCompare(bDate);
  });

  return { todayItems, scheduledItems, overdueItems };
}

function getStoredGuestTitles() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_TITLES_KEY) || '[]');
  } catch {
    return [];
  }
}

function setStoredGuestTitles(nextTitles) {
  localStorage.setItem(GUEST_TITLES_KEY, JSON.stringify(nextTitles));
}

function getStoredGuestEquippedTitle() {
  return localStorage.getItem(GUEST_EQUIPPED_TITLE_KEY) || '';
}

function setStoredGuestEquippedTitle(titleId) {
  localStorage.setItem(GUEST_EQUIPPED_TITLE_KEY, titleId);
}

function calculateExp(actionGoal, minutes = 0) {
  if (actionGoal?.action_type === 'one_time') return 20;
  if (actionGoal?.action_type === 'timer' || Number(minutes || 0) > 0) return 15;
  return 10;
}

function buildDerivedStats(logs = [], actionGoals = []) {
  const stats = {
    total_actions: 0,
    total_exercise_count: 0,
    total_study_minutes: 0,
    total_mental_count: 0,
    total_daily_count: 0,
    total_running_km: 0,
    total_no_smoking_days: 0,
  };

  (logs || []).forEach((log) => {
    if (!log?.completed) return;

    stats.total_actions += 1;

    if (log.category === 'exercise') {
      stats.total_exercise_count += 1;
      stats.total_running_km += Number(log.distance_km || 0);
    }

    if (log.category === 'study') {
      stats.total_study_minutes += Number(log.duration_minutes || 0);
      if (!log.duration_minutes || Number(log.duration_minutes) === 0) {
        stats.total_study_minutes += 10;
      }
    }

    if (log.category === 'mental') {
      stats.total_mental_count += 1;
    }

    if (log.category === 'daily') {
      stats.total_daily_count += 1;
    }
  });

  const abstainGoalIds = new Set(
    (actionGoals || [])
      .filter((goal) => goal?.category === 'mental' && goal?.action_type === 'abstain')
      .map((goal) => goal.id)
  );

  stats.total_no_smoking_days = (logs || []).filter(
    (log) => log?.completed && abstainGoalIds.has(log?.action_goal_id)
  ).length;

  return stats;
}

function getUnlockedTitles(stats, ownedTitleIds = []) {
  const ownedSet = new Set(ownedTitleIds);
  return TITLES.filter((title) => ownedSet.has(title.id) || Number(stats?.[title.metric] || 0) >= title.value);
}

function getNewlyUnlockedTitle(stats, ownedTitleIds = []) {
  const ownedSet = new Set(ownedTitleIds);
  return TITLES.find(
    (title) => !ownedSet.has(title.id) && Number(stats?.[title.metric] || 0) >= title.value
  );
}

function Section({ title, count, emptyText, children }) {
  const hasItems = React.Children.count(children) > 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[15px] font-extrabold" style={{ color: '#4a2c08' }}>
          {title}
        </h2>
        <div
          className="px-2 py-1 rounded-full text-[11px] font-bold"
          style={{
            background: 'rgba(196,154,74,0.14)',
            color: '#8a5a17',
            border: '1px solid rgba(196,154,74,0.18)',
          }}
        >
          {count}개
        </div>
      </div>

      {hasItems ? (
        <div className="space-y-3">{children}</div>
      ) : (
        <div
          className="rounded-2xl px-4 py-4 text-sm"
          style={{
            background: '#fffaf0',
            border: '1px solid rgba(160,120,64,0.16)',
            color: '#8f6a33',
          }}
        >
          {emptyText}
        </div>
      )}
    </section>
  );
}

function ExpPopup({ exp }) {
  return (
    <div
      className="fixed left-1/2 top-24 -translate-x-1/2 z-[70] px-4 py-2 rounded-full text-sm font-extrabold shadow-lg animate-[fadeInOut_1.4s_ease-in-out_forwards]"
      style={{
        background: 'linear-gradient(180deg, #f6d98c 0%, #d9a83e 100%)',
        color: '#4a2c08',
        border: '2px solid #8a6520',
      }}
    >
      +{exp} EXP
    </div>
  );
}

function TitleUnlockModal({ title, onClose, onEquip }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-5">
      <div
        className="w-full max-w-sm rounded-3xl p-5 shadow-2xl"
        style={{
          background: 'linear-gradient(180deg, #fff6df 0%, #f5e3b8 100%)',
          border: '2px solid #c89b45',
        }}
      >
        <div className="text-center">
          <div className="text-sm font-bold mb-2" style={{ color: '#8a5a17' }}>
            ✨ 새로운 칭호 획득
          </div>

          <div
            className="inline-flex px-4 py-2 rounded-full text-lg font-extrabold mb-3"
            style={{
              background: 'rgba(255,255,255,0.55)',
              color: '#4a2c08',
              border: '1px solid rgba(138,90,23,0.15)',
            }}
          >
            {title.name}
          </div>

          <p className="text-sm mb-5" style={{ color: '#7a5020' }}>
            {title.description}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl font-bold text-sm"
              style={{
                background: '#fff',
                border: '1px solid #d8c08e',
                color: '#7a5020',
              }}
            >
              닫기
            </button>

            <button
              type="button"
              onClick={onEquip}
              className="flex-1 h-11 rounded-2xl font-bold text-sm"
              style={{
                background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 100%)',
                color: '#fff8e8',
                border: '2px solid #6b4e15',
              }}
            >
              대표 칭호 장착
            </button>
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
  const [activeCategory, setActiveCategory] = useState('exercise');
  const [moveTrigger, setMoveTrigger] = useState(0);
  const [expPopup, setExpPopup] = useState(null);
  const [newTitle, setNewTitle] = useState(null);

  const expPopupTimerRef = useRef(null);

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

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 1000 * 30,
  });

  const isGuest = !user;

  const { data: guestData = {} } = useQuery({
    queryKey: ['guest-home-data', guestVersion],
    queryFn: () => guestDataPersistence.loadOnboardingData(),
    staleTime: 0,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', isGuest, guestVersion],
    enabled: !isUserLoading,
    queryFn: async () => {
      if (isGuest) return guestData?.goals || [];
      return base44.entities.Goal.list('-created_date', 100);
    },
  });

  const { data: actionGoals = [] } = useQuery({
    queryKey: ['actionGoals', isGuest, guestVersion],
    enabled: !isUserLoading,
    queryFn: async () => {
      if (isGuest) return guestData?.actionGoals || [];
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

  const userLevels = useMemo(() => {
    if (isGuest) return getDefaultUserLevels(guestData?.actionLogs || []);
    return getDefaultUserLevels(allLogs || []);
  }, [isGuest, guestData, allLogs]);

  const derivedStats = useMemo(() => {
    const sourceLogs = isGuest ? guestData?.actionLogs || [] : allLogs || [];
    const sourceGoals = isGuest ? guestData?.actionGoals || [] : actionGoals || [];
    return buildDerivedStats(sourceLogs, sourceGoals);
  }, [isGuest, guestData, allLogs, actionGoals]);

  const ownedTitleIds = useMemo(() => {
  if (isGuest) {
    return Array.isArray(guestData?.titles)
      ? guestData.titles
      : getStoredGuestTitles();
  }
  const serverTitles = Array.isArray(user?.titles) ? user.titles : [];
  return serverTitles;
}, [isGuest, user, guestData, guestVersion]);

  const unlockedTitles = useMemo(() => {
    return getUnlockedTitles(derivedStats, ownedTitleIds);
  }, [derivedStats, ownedTitleIds]);

  const equippedTitle = useMemo(() => {
    const equippedId = isGuest ? getStoredGuestEquippedTitle() : user?.equipped_title || '';
    return unlockedTitles.find((title) => title.id === equippedId) || null;
  }, [isGuest, user, unlockedTitles, guestVersion]);

  useEffect(() => {
    if (isUserLoading) return;

    if (isGuest) {
      const guestCategory =
        guestData?.activeCategory ||
        guestData?.guest_active_category ||
        guestData?.goalData?.category ||
        guestData?.actionGoalData?.category ||
        guestData?.goals?.[0]?.category ||
        'exercise';

      setActiveCategory(guestCategory);
      return;
    }

    setActiveCategory(user?.active_category || goals?.[0]?.category || 'exercise');
  }, [isUserLoading, isGuest, guestData, user, goals]);

  const handleCategoryChange = async (category) => {
    setActiveCategory(category);

    if (isGuest) {
      guestDataPersistence.saveData('guest_active_category', category);
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    try {
      await base44.auth.updateMe({ active_category: category });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (error) {
      console.error(error);
    }
  };

const activeGoals = useMemo(() => {
  const sourceGoals =
    isGuest
      ? (Array.isArray(guestData?.goals) && guestData.goals.length > 0
          ? guestData.goals
          : guestData?.goalData
            ? [guestData.goalData]
            : [])
      : goals || [];

  return sourceGoals.filter((goal) => {
    if (!goal) return false;
    if (goal.category !== activeCategory) return false;
    if (goal.status && goal.status !== 'active') return false;
    return true;
  });
}, [isGuest, guestData, goals, activeCategory]);

const activeGoal = activeGoals[0] || (isGuest ? guestData?.goalData || null : null);

  const activeActionGoals = useMemo(() => {
    const goalIds = new Set(activeGoals.map((goal) => goal.id));

    return (actionGoals || []).filter((actionGoal) => {
      if (!actionGoal) return false;
      if (actionGoal.category !== activeCategory) return false;
      if (
        actionGoal.status &&
        actionGoal.status !== 'active' &&
        actionGoal.status !== 'completed'
      ) {
        return false;
      }

      if (!actionGoal.goal_id) return true;
      if (goalIds.size === 0) return true;

      return goalIds.has(actionGoal.goal_id);
    });
  }, [actionGoals, activeCategory, activeGoals]);

  const goalLogs = useMemo(() => {
    if (!activeGoal) return [];
    return (allLogs || []).filter((log) => log?.goal_id === activeGoal.id);
  }, [allLogs, activeGoal]);

  const today = getTodayString();

  const grouped = useMemo(() => {
    return groupActionGoals(activeActionGoals, today);
  }, [activeActionGoals, today]);

  const nickname = isGuest ? guestData?.nickname || '용사' : user?.nickname || '용사';

  const bannerMessage = equippedTitle
    ? `${equippedTitle.name} · ${CATEGORY_LABELS[activeCategory]} 루트를 이어가고 있어요`
    : `${CATEGORY_LABELS[activeCategory]} 루트를 한 걸음씩 이어가고 있어요`;

  const handleCreateGoal = () => {
    const route = CATEGORY_ROUTE_MAP[activeCategory] || '/CreateGoalExercise';
    navigate(route);
  };

  const persistNewTitle = async (titleId) => {
    if (isGuest) {
      const prev = getStoredGuestTitles();
      const next = Array.from(new Set([...prev, titleId]));
      setStoredGuestTitles(next);
          guestDataPersistence.saveData('titles', next);
      window.dispatchEvent(new Event('root-home-data-updated'));
      return;
    }

    try {
      const currentTitles = Array.isArray(user?.titles) ? user.titles : [];
      const nextTitles = Array.from(new Set([...currentTitles, titleId]));
      await base44.auth.updateMe({ titles: nextTitles });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    } catch (error) {
      console.error(error);
    }
  };

  const handleEquipTitle = async (title) => {
    if (!title) return;

    if (isGuest) {
      setStoredGuestEquippedTitle(title.id);
      setNewTitle(null);
      window.dispatchEvent(new Event('root-home-data-updated'));
      toast.success(`대표 칭호가 "${title.name}"(으)로 설정되었어요.`);
      return;
    }

    try {
      await base44.auth.updateMe({ equipped_title: title.id });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setNewTitle(null);
      toast.success(`대표 칭호가 "${title.name}"(으)로 설정되었어요.`);
    } catch (error) {
      console.error(error);
      toast.error('대표 칭호 설정에 실패했어요.');
    }
  };

  const handleActionComplete = async (actionGoal, minutes = 0, extra = {}) => {
    try {
      const now = new Date().toISOString();
      const todayStr = getTodayString();
      const earnedExp = calculateExp(actionGoal, minutes);

      const logPayload = {
        action_goal_id: actionGoal.id,
        goal_id: actionGoal.goal_id || null,
        category: actionGoal.category,
        title: actionGoal.title || '',
        completed: true,
        date: todayStr,
        duration_minutes: Number(minutes || 0),
        gps_enabled: !!extra?.gpsEnabled,
        distance_km: extra?.distance ?? null,
        coords: extra?.coords || null,
        photo: extra?.photo || null,
        meta_action_type: actionGoal.action_type || 'confirm',
        created_date: now,
        updated_date: now,
      };

      if (isGuest) {
        guestDataPersistence.addActionLog(logPayload);

        if (actionGoal.action_type === 'one_time') {
          guestDataPersistence.updateActionGoal(actionGoal.id, {
            status: 'completed',
            completed: true,
            completed_date: todayStr,
          });
        }

        window.dispatchEvent(new Event('root-home-data-updated'));
      } else {
        await base44.entities.ActionLog.create(logPayload);

        if (actionGoal.action_type === 'one_time') {
          await base44.entities.ActionGoal.update(actionGoal.id, {
            status: 'completed',
            completed: true,
            completed_date: todayStr,
          });
        }

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['allLogs'] }),
          queryClient.invalidateQueries({ queryKey: ['actionGoals'] }),
          queryClient.invalidateQueries({ queryKey: ['goals'] }),
        ]);
      }

      setMoveTrigger((prev) => prev + 1);
      setExpPopup(earnedExp);

      const nextLogs = [...(isGuest ? guestData?.actionLogs || [] : allLogs || []), logPayload];
      const nextStats = buildDerivedStats(nextLogs, isGuest ? guestData?.actionGoals || [] : actionGoals || []);
      const newlyUnlocked = getNewlyUnlockedTitle(nextStats, ownedTitleIds);

      if (newlyUnlocked) {
        await persistNewTitle(newlyUnlocked.id);
        setNewTitle(newlyUnlocked);
      }

      if (actionGoal.action_type === 'one_time') {
        toast.success(`1회성 목표 완료! +${earnedExp} EXP`);
      } else if (actionGoal.action_type === 'timer') {
        toast.success(`${Math.max(1, Number(minutes || 0))}분 기록 완료! +${earnedExp} EXP`);
      } else if (actionGoal.action_type === 'abstain') {
        toast.success(`오늘도 잘 지켜냈어요! +${earnedExp} EXP`);
      } else {
        toast.success(`행동 목표를 완료했어요! +${earnedExp} EXP`);
      }
    } catch (error) {
      console.error(error);
      toast.error('완료 처리 중 문제가 생겼어요.');
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-full px-4 py-4 space-y-4">
        <div className="h-28 rounded-3xl bg-secondary/60 animate-pulse" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 rounded-2xl bg-secondary/60 animate-pulse" />
          ))}
        </div>
        <div className="h-32 rounded-3xl bg-secondary/60 animate-pulse" />
        <div className="h-24 rounded-3xl bg-secondary/60 animate-pulse" />
        <div className="h-24 rounded-3xl bg-secondary/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background pb-28">
      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -8px); }
          15% { opacity: 1; transform: translate(-50%, 0); }
          80% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -10px); }
        }
      `}</style>

      {expPopup ? <ExpPopup exp={expPopup} /> : null}

      {newTitle ? (
        <TitleUnlockModal
          title={newTitle}
          onClose={() => setNewTitle(null)}
          onEquip={() => handleEquipTitle(newTitle)}
        />
      ) : null}

      <div className="sticky top-0 z-30 bg-background">
        <CharacterBanner
          nickname={`${nickname}님`}
          message={bannerMessage}
          activeCategory={activeCategory}
          moveTrigger={moveTrigger}
          expText={expPopup ? `+${expPopup} EXP` : ''}
        />

        <div className="border-b bg-background/95 backdrop-blur">
          <CategoryTabs
            active={activeCategory}
            onChange={handleCategoryChange}
            userLevels={userLevels}
          />
        </div>
      </div>

      <div className="px-4 pt-3">
        

        {activeGoal ? (
          <GoalProgress goal={activeGoal} logs={goalLogs} />
        ) : (
          <EmptyGoalState category={activeCategory} onCreateGoal={handleCreateGoal} />
        )}
      </div>

      <div className="px-4 pt-5 space-y-6">
        <Section
          title="오늘 해야 할 것"
          count={grouped.todayItems.length}
          emptyText="오늘 해야 할 행동목표가 없습니다."
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
          emptyText="예정된 목표가 없습니다."
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
          emptyText="기한 지난 목표가 없습니다."
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
      </div>

      <div className="px-4 pt-5">
        <button
          type="button"
          onClick={handleCreateGoal}
          className="w-full h-12 rounded-2xl font-bold text-sm"
          style={{
            background: 'linear-gradient(180deg, #c49a4a 0%, #a07830 50%, #8a6520 100%)',
            border: '2px solid #6b4e15',
            color: '#fff8e8',
            boxShadow:
              'inset 0 1px 2px rgba(255,220,120,0.4), 0 3px 6px rgba(60,35,5,0.3)',
          }}
        >
          + 행동목표 추가
        </button>
      </div>
    </div>
  );
}
