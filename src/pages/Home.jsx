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

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user && !user.onboarding_complete) navigate('/Onboarding');
    if (user?.active_category) setActiveCategory(user.active_category);
  }, [user, navigate]);

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goal.filter({ status: 'active' }),
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
    queryKey: ['actionGoals'],
    queryFn: () => base44.entities.ActionGoal.filter({ status: 'active' }),
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['actionLogs'],
    queryFn: () => base44.entities.ActionLog.list('-created_date', 200),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actionLogs'] }),
    onMutate: async (newLog) => {
      await queryClient.cancelQueries({ queryKey: ['actionLogs'] });
      const previousLogs = queryClient.getQueryData(['actionLogs']);
      queryClient.setQueryData(['actionLogs'], (old) => [newLog, ...old]);
      return { previousLogs };
    },
    onError: (err, newLog, context) => {
      queryClient.setQueryData(['actionLogs'], context.previousLogs);
    },
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

    createLogMutation.mutate(logData);

    const catKey = actionGoal.category;
    const xpKey = `${catKey}_xp`;
    const levelKey = `${catKey}_level`;
    const currentXp = user?.[xpKey] || 0;
    const newXp = currentXp + 1;
    const newLevel = Math.floor(newXp / 30) + 1;

    await base44.auth.updateMe({ [xpKey]: newXp, [levelKey]: newLevel }).catch(() => {});
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
    base44.auth.updateMe({ active_category: cat }).catch(() => {});
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
    <div className="bg-background" style={{ minHeight: '100dvh' }} onTouchStart={handlePullStart}>
      {/* Pull-to-Refresh indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 flex justify-center pt-4 z-50 pointer-events-none"
        animate={{ opacity: pullProgress > 0 ? 1 : 0 }}
      >
        <motion.div animate={{ rotate: pullProgress * 360 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
          <RefreshCw className="w-6 h-6 text-amber-600" />
        </motion.div>
      </motion.div>

      <CharacterBanner
        nickname={user?.nickname}
        message={getGreeting()}
        category={activeCategory}
        userLevels={{
          exercise_level: user?.exercise_level || 1,
          study_level: user?.study_level || 1,
          mental_level: user?.mental_level || 1,
          daily_level: user?.daily_level || 1,
        }}
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

      {/* 🧪 임시 테스트 버튼 */}
      <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-1.5">
        {[
          { label: '🏃 운동', category: 'exercise', title: '10kg 감량', days: 56 },
          { label: '📚 공부', category: 'study', title: '토익 900점', days: 49 },
          { label: '🧘 정신', category: 'mental', title: '명상 습관', days: 42 },
          { label: '🏠 일상', category: 'daily', title: '금연 성공', days: 30 },
        ].map(({ label, category, title, days }) => (
          <button
            key={category}
            onClick={() => setVictoryGoal({ id: 'test-id', title, duration_days: days, category })}
            className="bg-red-500 text-white text-xs px-3 py-2 rounded-xl shadow-lg font-bold"
          >
            🧪 {label}
          </button>
        ))}
      </div>

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