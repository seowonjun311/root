import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, RefreshCw } from 'lucide-react';

import { base44 } from '@/api/base44Client';
import CharacterBanner from '../components/home/CharacterBanner';
import CategoryTabs from '../components/home/CategoryTabs';
import GoalProgress from '../components/home/GoalProgress';
import ActionGoalCard from '../components/home/ActionGoalCard';
import EmptyGoalState from '../components/home/EmptyGoalState';
import PhotoConfirmModal from '../components/home/PhotoConfirmModal';
import BossVictoryModal from '../components/home/BossVictoryModal';
import CelebrationToast from '../components/home/CelebrationToast';
import { computeStreak, getBadgeForGoal, getStreakTrigger } from '../components/badgeUtils';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { guestDataPersistence } from '../lib/GuestDataPersistence';

const CATEGORY_KEYS = ['exercise', 'study', 'mental', 'daily'];

function isGoalComplete(goal) {
  if (!goal?.start_date || !goal?.duration_days) return false;

  const start = new Date(goal.start_date);
  if (Number.isNaN(start.getTime())) return false;

  const end = new Date(start);
  end.setDate(start.getDate() + Number(goal.duration_days || 0));

  return new Date() >= end;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 6) return '늦은 밤에도 길은 이어지고 있어요.';
  if (hour < 10) return '좋은 아침이에요. 오늘도 한 걸음 가볼까요?';
  if (hour < 13) return '오늘의 루트를 차근차근 이어가봐요.';
  if (hour < 18) return '오후에도 마왕성을 향해 전진 중이에요.';
  if (hour < 22) return '오늘 하루도 꽤 잘 걸어오고 있어요.';
  return '오늘도 수고했어요. 이제 마지막 한 걸음만 더.';
}

function normalizeGuestGoals(data) {
  if (Array.isArray(data?.goals) && data.goals.length > 0) return data.goals;
  if (data?.goalData) return [data.goalData];
  return [];
}

function normalizeGuestActionGoals(data) {
  if (Array.isArray(data?.actionGoals) && data.actionGoals.length > 0) return data.actionGoals;
  if (data?.actionGoalData) return [data.actionGoalData];
  return [];
}

function sortByCreatedDateDesc(items = []) {
  return [...items].sort((a, b) => {
    const aTime = new Date(a?.created_date || a?.updated_date || 0).getTime();
    const bTime = new Date(b?.created_date || b?.updated_date || 0).getTime();
    return bTime - aTime;
  });
}

function buildGuestLevelStats(logs = []) {
  const stats = {
    exercise_xp: 0,
    exercise_level: 1,
    study_xp: 0,
    study_level: 1,
    mental_xp: 0,
    mental_level: 1,
    daily_xp: 0,
    daily_level: 1,
  };

  CATEGORY_KEYS.forEach((category) => {
    const xp = logs.filter((log) => log?.category === category && log?.completed).length;
    const level = Math.floor(xp / 30) + 1;
    stats[`${category}_xp`] = xp;
    stats[`${category}_level`] = level;
  });

  return stats;
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function getWeekStartString() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(
    monday.getDate()
  ).padStart(2, '0')}`;
}

function getPagePathByCategory(category) {
  const pageMap = {
    exercise: 'CreateGoalExercise',
    study: 'CreateGoalStudy',
    mental: 'CreateGoalMental',
    daily: 'CreateGoalDaily',
  };

  return `/${pageMap[category] || 'CreateGoalExercise'}`;
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const bannerRef = useRef(null);
  const tabsRef = useRef(null);
  const initializedRef = useRef(false);

  const [activeCategory, setActiveCategory] = useState('exercise');
  const [pendingLog, setPendingLog] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [victoryGoal, setVictoryGoal] = useState(null);
  const [isPulling, setIsPulling] = useState(false);
  const [bannerMoveTrigger, setBannerMoveTrigger] = useState(0);
  const [bannerHeight, setBannerHeight] = useState(112);
  const [tabsHeight, setTabsHeight] = useState(64);

  const [shownVictoryIds, setShownVictoryIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('shownVictory') || '[]');
    } catch {
      return [];
    }
  });

  const categoryFromQuery = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const value = searchParams.get('category');
    return CATEGORY_KEYS.includes(value) ? value : null;
  }, [location.search]);

  useLayoutEffect(() => {
    const updateHeights = () => {
      if (bannerRef.current) {
        setBannerHeight(Math.ceil(bannerRef.current.getBoundingClientRect().height));
      }
      if (tabsRef.current) {
        setTabsHeight(Math.ceil(tabsRef.current.getBoundingClientRect().height));
      }
    };

    updateHeights();
    window.addEventListener('resize', updateHeights);
    return () => window.removeEventListener('resize', updateHeights);
  }, []);

  useEffect(() => {
    if (bannerMoveTrigger) {
      requestAnimationFrame(() => {
        if (bannerRef.current) {
          setBannerHeight(Math.ceil(bannerRef.current.getBoundingClientRect().height));
        }
      });
    }
  }, [bannerMoveTrigger]);

  const contentTopSpacer = bannerHeight + tabsHeight + 8;

  const { pullProgress, onTouchStart: handlePullStart } = usePullToRefresh(async () => {
    if (isPulling) return;
    setIsPulling(true);

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['me'] }),
      queryClient.invalidateQueries({ queryKey: ['goals'] }),
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] }),
      queryClient.invalidateQueries({ queryKey: ['allLogs'] }),
    ]);

    setIsPulling(false);
  });

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const isGuest = !isUserLoading && !user;

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', isGuest],
    enabled: !isUserLoading,
    staleTime: 1000 * 60,
    queryFn: async () => {
      if (isGuest) {
        const guestData = guestDataPersistence.loadOnboardingData();
        return normalizeGuestGoals(guestData);
      }

      const resultGoals = await base44.entities.Goal.filter({
        status: 'active',
        goal_type: 'result',
      });

      return Array.isArray(resultGoals) ? resultGoals : [];
    },
  });

  const { data: actionGoals = [] } = useQuery({
    queryKey: ['actionGoals', isGuest],
    enabled: !isUserLoading,
    staleTime: 1000 * 60,
    queryFn: async () => {
      if (isGuest) {
        const guestData = guestDataPersistence.loadOnboardingData();
        return normalizeGuestActionGoals(guestData);
      }

      const results = await base44.entities.ActionGoal.filter({ status: 'active' });
      return Array.isArray(results) ? results : [];
    },
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allLogs', isGuest],
    enabled: !isUserLoading,
    staleTime: 1000 * 15,
    queryFn: async () => {
      if (isGuest) {
        const guestData = guestDataPersistence.loadOnboardingData();
        return Array.isArray(guestData?.actionLogs) ? guestData.actionLogs : [];
      }

      const results = await base44.entities.ActionLog.list('-created_date', 200);
      return Array.isArray(results) ? results : [];
    },
  });

  const createBadgeMutation = useMutation({
    mutationFn: async (data) => {
      if (isGuest) return null;
      return base44.entities.Badge.create(data);
    },
  });

  useEffect(() => {
    if (isUserLoading) return;

    if (user && !user.onboarding_complete) {
      navigate('/Onboarding', { replace: true });
      return;
    }

    if (!user) {
      const guestData = guestDataPersistence.loadOnboardingData();
      const guestCompleted = guestData?.onboardingComplete === true;

      if (!guestCompleted) {
        navigate('/Onboarding', { replace: true });
        return;
      }
    }

    if (!initializedRef.current && categoryFromQuery) {
      setActiveCategory(categoryFromQuery);
      initializedRef.current = true;

      if (user) {
        if (user.active_category !== categoryFromQuery) {
          base44.auth.updateMe({ active_category: categoryFromQuery }).catch(() => {});
        }
      } else {
        const guestData = guestDataPersistence.loadOnboardingData();
        if (guestData?.activeCategory !== categoryFromQuery) {
          guestDataPersistence.saveData('guest_active_category', categoryFromQuery);
        }
      }

      navigate('/Home', { replace: true });
      return;
    }

    if (initializedRef.current) return;

    if (user) {
      if (user.active_category && CATEGORY_KEYS.includes(user.active_category)) {
        setActiveCategory(user.active_category);
      }
      initializedRef.current = true;
      return;
    }

    const guestData = guestDataPersistence.loadOnboardingData();
    const savedCategory = guestData?.activeCategory;

    if (savedCategory && CATEGORY_KEYS.includes(savedCategory)) {
      setActiveCategory(savedCategory);
    }

    initializedRef.current = true;
  }, [isUserLoading, user, categoryFromQuery, navigate]);

  useEffect(() => {
    const refreshHomeData = async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
        queryClient.invalidateQueries({ queryKey: ['actionGoals'] }),
        queryClient.invalidateQueries({ queryKey: ['allLogs'] }),
      ]);
    };

    window.addEventListener('root-home-data-updated', refreshHomeData);
    return () => window.removeEventListener('root-home-data-updated', refreshHomeData);
  }, [queryClient]);

  useEffect(() => {
    if (!goals.length) return;

    for (const goal of goals) {
      if (goal?.status !== 'active') continue;
      if (isGoalComplete(goal) && !shownVictoryIds.includes(goal.id)) {
        setVictoryGoal(goal);
        break;
      }
    }
  }, [goals, shownVictoryIds]);

  const guestData = useMemo(() => {
    if (!isGuest) return null;
    return guestDataPersistence.loadOnboardingData();
  }, [isGuest, goals, actionGoals, allLogs]);

  const guestLevels = useMemo(() => buildGuestLevelStats(allLogs), [allLogs]);

  const userLevels = useMemo(() => {
    if (isGuest) return guestLevels;

    return {
      exercise_xp: user?.exercise_xp || 0,
      exercise_level: user?.exercise_level || 1,
      study_xp: user?.study_xp || 0,
      study_level: user?.study_level || 1,
      mental_xp: user?.mental_xp || 0,
      mental_level: user?.mental_level || 1,
      daily_xp: user?.daily_xp || 0,
      daily_level: user?.daily_level || 1,
    };
  }, [isGuest, guestLevels, user]);

  const totalLevel = useMemo(() => {
    return (
      (userLevels.exercise_level || 1) +
      (userLevels.study_level || 1) +
      (userLevels.mental_level || 1) +
      (userLevels.daily_level || 1)
    );
  }, [userLevels]);

  const nickname = isGuest ? guestData?.nickname || '용사님' : user?.nickname || '용사님';

  const activeGoal = useMemo(() => {
    const filtered = sortByCreatedDateDesc(
      goals.filter((goal) => goal?.category === activeCategory && goal?.status === 'active')
    );
    return filtered[0] || null;
  }, [goals, activeCategory]);

  const categoryActionGoals = useMemo(() => {
    if (!activeGoal) return [];

    return sortByCreatedDateDesc(
      actionGoals.filter(
        (actionGoal) =>
          actionGoal?.goal_id === activeGoal.id &&
          actionGoal?.category === activeCategory &&
          actionGoal?.status === 'active'
      )
    );
  }, [actionGoals, activeGoal, activeCategory]);

  const getWeeklyLogs = (actionGoalId) => {
    const weekStart = getWeekStartString();
    return allLogs.filter(
      (log) => log?.action_goal_id === actionGoalId && log?.date && log.date >= weekStart
    );
  };

  const handleCategoryChange = (nextCategory) => {
    if (!CATEGORY_KEYS.includes(nextCategory)) return;
    if (nextCategory === activeCategory) return;

    initializedRef.current = true;
    setActiveCategory(nextCategory);

    if (isGuest) {
      guestDataPersistence.saveData('guest_active_category', nextCategory);
      return;
    }

    base44.auth.updateMe({ active_category: nextCategory }).catch(() => {});
  };

  const handleComplete = (actionGoal, minutes = 0, gpsData = {}) => {
    setPendingLog({ actionGoal, minutes, gpsData });
  };

  const handlePhotoSave = async (photoUrl, receivedGpsData) => {
    if (!pendingLog?.actionGoal) return;

    const { actionGoal, minutes, gpsData } = pendingLog;
    const finalGpsData = receivedGpsData || gpsData || {};
    const todayStr = getTodayString();
    const weekStart = getWeekStartString();
    const isOneTime = actionGoal.action_type === 'one_time';

    const logData = {
      action_goal_id: actionGoal.id,
      goal_id: actionGoal.goal_id,
      category: actionGoal.category,
      date: todayStr,
      duration_minutes: minutes || 0,
      completed: true,
      photo_url: photoUrl || null,
      gps_enabled: !!(finalGpsData?.gpsEnabled && finalGpsData?.distance),
    };

    if (finalGpsData?.gpsEnabled && finalGpsData?.distance) {
      logData.distance_km = finalGpsData.distance;
      logData.route_coordinates = JSON.stringify(finalGpsData.coords || []);
    }

    if (isGuest) {
      const currentGuestData = guestDataPersistence.loadOnboardingData();
      const existingLogs = Array.isArray(currentGuestData?.actionLogs)
        ? currentGuestData.actionLogs
        : [];

      const savedLog = {
        ...logData,
        id: `local_log_${Date.now()}`,
        created_date: new Date().toISOString(),
      };

      const currentActionGoals = Array.isArray(currentGuestData?.actionGoals)
        ? currentGuestData.actionGoals
        : [];

      const nextActionGoals = currentActionGoals.map((goal) =>
        goal.id === actionGoal.id
          ? {
              ...goal,
              ...(isOneTime
                ? {
                    status: 'completed',
                    completed: true,
                    completed_date: todayStr,
                  }
                : {}),
            }
          : goal
      );

      guestDataPersistence.saveData('local_action_logs', [...existingLogs, savedLog]);

      if (isOneTime) {
        guestDataPersistence.saveData('local_action_goals', nextActionGoals);
      }
    } else {
      await base44.entities.ActionLog.create(logData);

      if (isOneTime) {
        await base44.entities.ActionGoal.update(actionGoal.id, {
          status: 'completed',
          completed: true,
          completed_date: todayStr,
        });
      }

      const currentXp = user?.[`${actionGoal.category}_xp`] || 0;
      const newXp = currentXp + 1;
      const newLevel = Math.floor(newXp / 30) + 1;

      await base44.auth
        .updateMe({
          [`${actionGoal.category}_xp`]: newXp,
          [`${actionGoal.category}_level`]: newLevel,
        })
        .catch(() => {});
    }

    const optimisticLogs = [
      ...allLogs,
      {
        ...logData,
        id: `temp_${Date.now()}`,
      },
    ];

    if (!isOneTime) {
      const streak = computeStreak(actionGoal.id, optimisticLogs);
      const streakTrigger = getStreakTrigger(streak);

      const thisWeekLogs = optimisticLogs.filter(
        (log) => log?.action_goal_id === actionGoal.id && log?.date && log.date >= weekStart
      );

      const target = actionGoal.weekly_frequency || 7;
      const weeklyComplete = thisWeekLogs.length >= target && thisWeekLogs.length - 1 < target;

      if (streakTrigger) {
        setCelebration(streakTrigger);

        const badge = getBadgeForGoal({ title: actionGoal.title });
        createBadgeMutation.mutate({
          title: `${badge?.title || '칭호'} (${streak}일 연속)`,
          description: `${actionGoal.title} ${streak}일 연속 성공`,
          category: actionGoal.category,
          badge_type: 'cumulative',
          earned_date: todayStr,
          streak,
        });
      } else if (weeklyComplete) {
        setCelebration('weekly_complete');
      }
    } else {
      setCelebration('goal_complete');
    }

    setPendingLog(null);
    setBannerMoveTrigger(Date.now());

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['me'] }),
      queryClient.invalidateQueries({ queryKey: ['goals'] }),
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] }),
      queryClient.invalidateQueries({ queryKey: ['allLogs'] }),
    ]);

    window.dispatchEvent(new Event('root-home-data-updated'));
  };

  const handleVictoryClose = () => {
    if (!victoryGoal?.id) return;

    const nextShown = [...shownVictoryIds, victoryGoal.id];
    setShownVictoryIds(nextShown);
    localStorage.setItem('shownVictory', JSON.stringify(nextShown));
    setVictoryGoal(null);
  };

  const handleVictoryNewGoal = () => {
    const category = victoryGoal?.category || activeCategory;
    handleVictoryClose();
    navigate(`/CreateGoal?category=${category}`);
  };

  const bannerNickname = `${nickname} · Lv.${totalLevel}`;
  const bannerMessage = getGreeting();

  if (isUserLoading) {
    return (
      <div className="bg-background min-h-full px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-24 rounded-3xl bg-secondary/60" />
          <div className="h-14 rounded-2xl bg-secondary/60" />
          <div className="h-24 rounded-2xl bg-secondary/60" />
          <div className="h-20 rounded-2xl bg-secondary/60" />
          <div className="h-20 rounded-2xl bg-secondary/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background" style={{ minHeight: '100%' }} onTouchStart={handlePullStart}>
      <motion.div
        className="fixed top-12 left-0 right-0 flex justify-center pt-2 z-50 pointer-events-none"
        animate={{ opacity: pullProgress > 0 ? 1 : 0 }}
      >
        <motion.div
          animate={{ rotate: pullProgress * 360 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <RefreshCw className="w-6 h-6 text-amber-600" />
        </motion.div>
      </motion.div>

      <div
        ref={bannerRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: 'hsl(var(--background))',
        }}
      >
        <CharacterBanner
          nickname={bannerNickname}
          message={bannerMessage}
          activeCategory={activeCategory}
          moveTrigger={bannerMoveTrigger}
          expText="+1 EXP"
        />
      </div>

      <div
        ref={tabsRef}
        style={{
          position: 'fixed',
          top: `${bannerHeight}px`,
          left: 0,
          right: 0,
          zIndex: 29,
          background: 'hsl(var(--background))',
          paddingTop: '2px',
          paddingBottom: '2px',
        }}
      >
        <CategoryTabs active={activeCategory} onChange={handleCategoryChange} userLevels={userLevels} />
      </div>

      <div style={{ height: `${contentTopSpacer}px` }} />

      <div className="px-4 pb-5">
        {activeGoal ? (
          <div className="space-y-3">
            <GoalProgress
              goal={activeGoal}
              logs={allLogs.filter((log) => log?.goal_id === activeGoal.id)}
            />

            <div className="space-y-2">
              {categoryActionGoals.length > 0 ? (
                categoryActionGoals.map((actionGoal) => (
                  <ActionGoalCard
                    key={actionGoal.id}
                    actionGoal={actionGoal}
                    weeklyLogs={getWeeklyLogs(actionGoal.id)}
                    allLogs={allLogs.filter((log) => log?.action_goal_id === actionGoal.id)}
                    onComplete={handleComplete}
                  />
                ))
              ) : (
                <div
                  className="rounded-2xl px-4 py-4 text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #f0e0bc 100%)',
                    border: '1px solid #d7b97b',
                    color: '#6e4a1a',
                  }}
                >
                  아직 이 결과목표를 위한 행동목표가 없어요.
                </div>
              )}
            </div>

            <button
              onClick={() => {
                navigate(`${getPagePathByCategory(activeCategory)}?goalId=${activeGoal.id}`);
              }}
              className="w-full rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              style={{
                minHeight: '46px',
                background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #f0e0bc 100%)',
                border: '2px dashed #a07840',
                color: '#7a5020',
              }}
            >
              <Plus className="w-4 h-4" />
              행동목표 추가하기
            </button>
          </div>
        ) : (
          <EmptyGoalState
            category={activeCategory}
            onCreateGoal={() => {
              navigate(getPagePathByCategory(activeCategory));
            }}
          />
        )}
      </div>

      {pendingLog && (
        <PhotoConfirmModal
          actionGoal={pendingLog.actionGoal}
          gpsData={pendingLog.gpsData}
          onSave={handlePhotoSave}
          onSkip={() => handlePhotoSave(null, pendingLog.gpsData)}
          onCancel={() => setPendingLog(null)}
        />
      )}

      {celebration && <CelebrationToast trigger={celebration} onDone={() => setCelebration(null)} />}

      {victoryGoal && (
        <BossVictoryModal
          goal={victoryGoal}
          badge={getBadgeForGoal(victoryGoal)?.title}
          onClose={handleVictoryClose}
          onNewGoal={handleVictoryNewGoal}
        />
      )}
    </div>
  );
}
