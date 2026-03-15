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
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  });

  const completeGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.update(id, { status: 'completed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] }),
  });

  const createBadgeMutation = useMutation({
    mutationFn: (data) => base44.entities.Badge.create(data),
  });

  const categoryGoals = goals.filter(g => g.category === activeCategory);
  const categoryActionGoals = actionGoals.filter(ag => ag.category === activeCategory);
  const activeGoal = categoryGoals[0];

  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const getWeeklyLogs = (actionGoalId) =>
    allLogs.filter(l => l.action_goal_id === actionGoalId && l.date >= weekStartStr);

  const handleComplete = (actionGoal, minutes) => {
    setPendingLog({ actionGoal, minutes });
  };

  const handlePhotoSave = async (photoUrl) => {
    const { actionGoal, minutes } = pendingLog;
    const todayStr = new Date().toISOString().split('T')[0];

    const newLogs = [...allLogs, { action_goal_id: actionGoal.id, date: todayStr, completed: true }];
    const streak = computeStreak(actionGoal.id, newLogs);
    const streakTrigger = getStreakTrigger(streak);

    const thisWeekLogs = newLogs.filter(l => l.action_goal_id === actionGoal.id && l.date >= weekStartStr);
    const target = actionGoal.weekly_frequency || 7;
    const weeklyComplete = thisWeekLogs.length >= target && thisWeekLogs.length - 1 < target;

    createLogMutation.mutate({
      action_goal_id: actionGoal.id,
      goal_id: actionGoal.goal_id,
      category: actionGoal.category,
      date: todayStr,
      duration_minutes: minutes,
      completed: true,
      photo_url: photoUrl || null,
    });

    setPendingLog(null);

    if (streakTrigger) {
      setCelebration(streakTrigger);
      const { title, description } = getBadgeForGoal({ title: actionGoal.title });
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
    completeGoalMutation.mutate(victoryGoal.id);
    const { title, description } = getBadgeForGoal(victoryGoal);
    createBadgeMutation.mutate({
      title,
      description,
      category: victoryGoal.category,
      badge_type: 'result',
      earned_date: new Date().toISOString().split('T')[0],
      goal_id: victoryGoal.id,
    });
    setVictoryGoal(null);
  };

  const handleVictoryNewGoal = () => {
    const cat = victoryGoal?.category || activeCategory;
    handleVictoryClose();
    navigate('/CreateGoal?category=' + cat);
  };

  return (
    <div className="bg-background min-h-screen">
      <CharacterBanner nickname={user?.nickname} message={getGreeting()} />
      <CategoryTabs active={activeCategory} onChange={handleCategoryChange} />

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
            <Button
              variant="outline"
              onClick={() => navigate('/CreateGoal?category=' + activeCategory)}
              className="w-full h-11 rounded-xl border-dashed border-amber-400/60 text-amber-700 hover:bg-amber-50/50 font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              행동 목표 직접 추가하기
            </Button>
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
          onSave={handlePhotoSave}
          onSkip={() => handlePhotoSave(null)}
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