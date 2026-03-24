import React, { useEffect, useMemo, useState } from 'react';
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
    if (!Object.prototype.hasOwnProperty.call(result, `${category}_xp`)) return;
    result[`${category}_xp`] += 10;
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

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [guestVersion, setGuestVersion] = useState(0);
  const [activeCategory, setActiveCategory] = useState('exercise');
  const [moveTrigger, setMoveTrigger] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setGuestVersion((prev) => prev + 1);
    window.addEventListener('root-home-data-updated', handleUpdate);
    return () => window.removeEventListener('root-home-data-updated', handleUpdate);
  }, []);

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
    return (goals || []).filter((goal) => {
      if (!goal) return false;
      if (goal.category !== activeCategory) return false;
      if (goal.status && goal.status !== 'active') return false;
      return true;
    });
  }, [goals, activeCategory]);

  const activeGoal = activeGoals[0] || null;

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

  const nickname = isGuest
    ? guestData?.nickname || '용사'
    : user?.nickname || '용사';

  const handleCreateGoal = () => {
    const route = CATEGORY_ROUTE_MAP[activeCategory] || '/CreateGoalExercise';
    navigate(route);
  };

  const handleActionComplete = async (actionGoal, minutes = 0, extra = {}) => {
    try {
      const now = new Date().toISOString();
      const todayStr = getTodayString();

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

      if (actionGoal.action_type === 'one_time') {
        toast.success('1회성 목표를 완료했어요! 🎉');
      } else if (actionGoal.action_type === 'timer') {
        toast.success(`${Math.max(1, Number(minutes || 0))}분 기록 완료! ⏱️`);
      } else if (actionGoal.action_type === 'abstain') {
        toast.success('오늘도 잘 지켜냈어요! 🛡️');
      } else {
        toast.success('행동 목표를 완료했어요! ✨');
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
      <div className="sticky top-0 z-30 bg-background">
        <CharacterBanner
          nickname={`${nickname}님`}
          message={`${CATEGORY_LABELS[activeCategory]} 루트를 한 걸음씩 이어가고 있어요`}
          activeCategory={activeCategory}
          moveTrigger={moveTrigger}
          expText="+10 EXP"
        />

        <div className="border-b bg-background/95 backdrop-blur">
          <CategoryTabs
            active={activeCategory}
            onChange={handleCategoryChange}
            userLevels={userLevels}
          />
        </div>
      </div>

      <div className="pt-3">
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
