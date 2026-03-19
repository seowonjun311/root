import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import CharacterBanner from '../components/home/CharacterBanner';
import CategoryTabs from '../components/home/CategoryTabs';
import GoalProgress from '../components/home/GoalProgress';
import WeekDays from '../components/home/WeekDays';
import ActionGoalCard from '../components/home/ActionGoalCard';
import EmptyGoalState from '../components/home/EmptyGoalState';
import PhotoConfirmModal from '../components/home/PhotoConfirmModal';
import BossVictoryModal from '../components/home/BossVictoryModal';
import CelebrationToast from '../components/home/CelebrationToast';
import { computeStreak, getStreakTrigger, getBadgeForGoal } from '../components/badgeUtils';
import { Plus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { guestDataPersistence } from '../lib/GuestDataPersistence';

function isGoalComplete(goal) {
  if (!goal || !goal.start_date || !goal.duration_days) return false;
  const start = new Date(goal.start_date);
  const end = new Date(start);
  end.setDate(start.getDate() + goal.duration_days);
  return new Date() >= end;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '늦은 밤, 오늘도 수고했어요.';
  if (hour < 10) return '좋은 아침이에요. 오늘도 천천히 걸어볼까요?';
  if (hour < 13) return '당신을 기다리고 있습니다.';
  if (hour < 18) return '오후에도 한 걸음씩, 용사님.';
  if (hour < 22) return '오늘 하루도 잘 걸어왔어요.';
  return '오늘 하루도 수고했어요, 용사님.';
}

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('exercise');
  const [pendingLog, setPendingLog] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [victoryGoal, setVictoryGoal] = useState(null);
  const [shownVictoryIds, setShownVictoryIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('shownVictory') || '[]'); } catch { return []; }
  });

  const { pullProgress, onTouchStart: handlePullStart } = usePullToRefresh(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['goals'] }),
      queryClient.invalidateQueries({ queryKey: ['actionLogs'] }),
      queryClient.invalidateQueries({ queryKey: ['actionGoals'] }),
    ]);
  });

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  useEffect(() => {
    // 로딩 중엔 아무것도 하지 않음
    if (isUserLoading) return;

    if (user) {
      // 로그인 사용자: onboarding_complete 체크
      if (!user.onboarding_complete) {
        // 캐시된 데이터일 수 있으므로 재조회 후 판단
        queryClient.invalidateQueries({ queryKey: ['me'] });
        navigate('/Onboarding');
        return;
      }
      if (user.active_category) setActiveCategory(user.active_category);
    } else {
      // 비로그인 게스트: localStorage 체크
      const guestOnboardingComplete = localStorage.getItem('guest_onboarding_complete') === 'true';
      if (!guestOnboardingComplete) {
        navigate('/Onboarding');
        return;
      }
      const guestCat = localStorage.getItem('guest_active_category');
      if (guestCat) setActiveCategory(guestCat);
    }
  }, [user, isUserLoading, navigate]);

  const isGuest = !isUserLoading && !user;

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', isGuest],
    queryFn: () => {
      if (isGuest) {
        const data = guestDataPersistence.loadOnboardingData();
        return (data.goals || []).filter(g => g.status === 'active');
      }
      return base44.entities.Goal.filter({ status: 'active' });
    },
    enabled: !isUserLoading,
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId) => base44.entities.Goal.delete(goalId),
    onMutate: async (deletedGoalId) => {
      await queryClient.cancelQueries({ queryKey: ['goals'] });
      const previousGoals = queryClient.getQueryData(['goals']);
      queryClient.setQueryData(['goals'], (old) => old.filter(g => g.id !== deletedGoalId));
      return { previousGoals };
    },
    onError: (err, goalId, context) => {
      if (context?.previousGoals) queryClient.setQueryData(['goals'], context.previousGoals);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const { data: actionGoals = [] } = useQuery({
    queryKey: ['actionGoals', isGuest],
    queryFn: () => {
      if (isGuest) {
        const data = guestDataPersistence.loadOnboardingData();
        return (data.actionGoals || []).filter(ag => ag.status === 'active');
      }
      return base44.entities.ActionGoal.filter({ status: 'active' });
    },
    enabled: !isUserLoading,
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['actionLogs', isGuest],
    queryFn: () => {
      if (isGuest) {
        const data = guestDataPersistence.loadOnboardingData();
        return data.actionLogs || [];
      }
      return base44.entities.ActionLog.list('-created_date', 200);
    },
    enabled: !isUserLoading,
  });

  useEffect(() => {
    if (!goals.length) return;
    for (const goal of goals) {
      if (isGoalComplete(goal) && !shownVictoryIds.includes(goal.id)) {
        setVictoryGoal(goal);
        break;
      }
    }
  }, [goals, shownVictoryIds]);

  const createLogMutation = useMutation({
    mutationFn: (data) => base44.entities.ActionLog.create(data),
    onMutate: async (newLog) => {
      await queryClient.cancelQueries({ queryKey: ['actionLogs'] });
      const previousLogs = queryClient.getQueryData(['actionLogs']);
      queryClient.setQueryData(['actionLogs'], (old) => [newLog, ...old]);
      return { previousLogs };
    },
    onError: (err, newLog, context) => {
      if (context?.previousLogs) queryClient.setQueryData(['actionLogs'], context.previousLogs);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['actionLogs'] }),
  });

  const createBadgeMutation = useMutation({
    mutationFn: (data) => base44.entities.Badge.create(data),
  });

  const categoryGoals = goals.filter(g => g.category === activeCategory);
  const activeGoal = categoryGoals[0];
  const categoryActionGoals = activeGoal
    ? actionGoals.filter(ag => ag.goal_id === activeGoal.id)
    : [];

  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStartDate = new Date(today);
  weekStartDate.setDate(today.getDate() + mondayOffset);
  const weekStartStr = `${weekStartDate.getFullYear()}-${String(weekStartDate.getMonth() + 1).padStart(2, '0')}-${String(weekStartDate.getDate()).padStart(2, '0')}`;

  const getWeeklyLogs = (actionGoalId) =>
    allLogs.filter(l => l.action_goal_id === actionGoalId && l.date >= weekStartStr);

  const handleComplete = (actionGoal, minutes, gpsData = {}) => {
    setPendingLog({ actionGoal, minutes, gpsData });
  };

  const handlePhotoSave = async (photoUrl, receivedGpsData) => {
    const { actionGoal, minutes, gpsData } = pendingLog;
    const todayStr = new Date().toISOString().split('T')[0];

    const newLogs = [...allLogs, { action_goal_id: actionGoal.id, date: todayStr, completed: true }];
    const streak = computeStreak(actionGoal.id, newLogs);
    const streakTrigger = getStreakTrigger(streak);

    const thisWeekLogs = newLogs.filter(l => l.action_goal_id === actionGoal.id && l.date >= weekStartStr);
    const target = actionGoal.weekly_frequency || 7;
    const weeklyComplete = thisWeekLogs.length >= target && thisWeekLogs.length - 1 < target;

    const logData = {
      action_goal_id: actionGoal.id,
      goal_id: actionGoal.goal_id,
      category: actionGoal.category,
      date: todayStr,
      duration_minutes: minutes,
      completed: true,
      photo_url: photoUrl || null,
      gps_enabled: !!(gpsData?.gpsEnabled && gpsData?.distance),
    };

    if (gpsData?.gpsEnabled && gpsData?.distance) {
      logData.distance_km = gpsData.distance;
      logData.route_coordinates = JSON.stringify(gpsData.coords || []);
    }

    if (isGuest) {
      // 게스트: localStorage에 저장
      const guestData = guestDataPersistence.loadOnboardingData();
      const existingLogs = guestData.actionLogs || [];
      guestDataPersistence.saveData('local_action_logs', [...existingLogs, { ...logData, id: `local_log_${Date.now()}`, created_date: new Date().toISOString() }]);
      queryClient.invalidateQueries({ queryKey: ['actionLogs', true] });
    } else {
      createLogMutation.mutate(logData);
    }

    const catKey = actionGoal.category;
    const xpKey = `${catKey}_xp`;
    const levelKey = `${catKey}_level`;
    const currentXp = user?.[xpKey] || 0;
    const newXp = currentXp + 1;
    const newLevel = Math.floor(newXp / 30) + 1;

    if (!isGuest) await base44.auth.updateMe({ [xpKey]: newXp, [levelKey]: newLevel }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['me'] });
    setPendingLog(null);

    if (streakTrigger) {
      setCelebration(streakTrigger);
      const { title } = getBadgeForGoal({ title: actionGoal.title });
      createBadgeMutation.mutate({
        title: `${title} (${streak}일 연속)`,
        description: `${actionGoal.title} ${streak}일 연속 성공`,
        category: actionGoal.category,
        badge_type: 'cumulative',
        earned_date: todayStr,
        streak,
      });
    } else if (weeklyComplete) {
      setCelebration('weekly_complete');
    }
  };

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    if (!isGuest) base44.auth.updateMe({ active_category: cat }).catch(() => {});
  };

  const handleVictoryClose = () => {
    if (!victoryGoal) return;
    const newShown = [...shownVictoryIds, victoryGoal.id];
    setShownVictoryIds(newShown);
    localStorage.setItem('shownVictory', JSON.stringify(newShown));
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    setVictoryGoal(null);
  };

  const handleVictoryNewGoal = () => {
    const cat = victoryGoal?.category || activeCategory;
    handleVictoryClose();
    navigate('/CreateGoal?category=' + cat);
  };

  return (
    <div className="bg-background" style={{ minHeight: '100%' }} onTouchStart={handlePullStart}>
      <motion.div
        className="fixed top-12 left-0 right-0 flex justify-center pt-2 z-50 pointer-events-none"
        animate={{ opacity: pullProgress > 0 ? 1 : 0 }}
      >
        <motion.div animate={{ rotate: pullProgress * 360 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
          <RefreshCw className="w-6 h-6 text-amber-600" />
        </motion.div>
      </motion.div>

      <CharacterBanner
        nickname={user?.nickname}
        message={getGreeting()}
      />
      <CategoryTabs active={activeCategory} onChange={handleCategoryChange} userLevels={{
        exercise_level: user?.exercise_level || 1,
        exercise_xp: user?.exercise_xp || 0,
        study_level: user?.study_level || 1,
        study_xp: user?.study_xp || 0,
        mental_level: user?.mental_level || 1,
        mental_xp: user?.mental_xp || 0,
        daily_level: user?.daily_level || 1,
        daily_xp: user?.daily_xp || 0,
      }} />

      {activeGoal ? (
        <div className="space-y-3">
          <GoalProgress goal={activeGoal} logs={allLogs.filter(l => l.goal_id === activeGoal.id)} />
          <WeekDays logs={allLogs.filter(l => l.category === activeCategory)} />

          {categoryActionGoals.map(ag => (
            <ActionGoalCard
              key={ag.id}
              actionGoal={ag}
              weeklyLogs={getWeeklyLogs(ag.id)}
              onComplete={handleComplete}
            />
          ))}

          <div className="px-4 pb-4">
            <button
              onClick={() => navigate(`/CreateGoal?category=${activeCategory}&goalId=${activeGoal.id}`)}
              className="w-full rounded-lg font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{
                minHeight: '44px',
                background: 'linear-gradient(135deg, #f5e6c8 0%, #eedcb0 60%, #f0e0bc 100%)',
                border: '2px dashed #a07840',
                color: '#7a5020',
              }}
            >
              <Plus className="w-4 h-4" />
              행동 목표 직접 추가하기
            </button>
          </div>
        </div>
      ) : (
        <EmptyGoalState
          category={activeCategory}
          onCreateGoal={() => navigate('/CreateGoal?category=' + activeCategory)}
        />
      )}

      {pendingLog && (
        <PhotoConfirmModal
          actionGoal={pendingLog.actionGoal}
          gpsData={pendingLog.gpsData}
          onSave={handlePhotoSave}
          onSkip={() => handlePhotoSave(null, pendingLog.gpsData)}
        />
      )}

      {celebration && (
        <CelebrationToast trigger={celebration} onDone={() => setCelebration(null)} />
      )}

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