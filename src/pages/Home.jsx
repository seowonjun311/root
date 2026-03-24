import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import CategoryTabs from '@/components/home/CategoryTabs';
import GoalProgress from '@/components/home/GoalProgress';
import ActionGoalCard from '@/components/home/ActionGoalCard';
import EmptyGoalState from '@/components/home/EmptyGoalState';

const GUEST_STORAGE_KEY = 'root_guest_data';

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

function loadGuestData() {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('guest data load error:', error);
    return {};
  }
}

function saveGuestData(nextData) {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(nextData));
    window.dispatchEvent(new Event('root-home-data-updated'));
  } catch (error) {
    console.error('guest data save error:', error);
  }
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function normalizeDateOnly(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function getGoalEndDate(goal) {
  if (!goal?.start_date || !goal?.duration_days) return null;

  const start = new Date(goal.start_date);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start);
  end.setDate(end.getDate() + Number(goal.duration_days || 0));
  return end;
}

function isGoalExpired(goal) {
  const end = getGoalEndDate(goal);
  if (!end) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  return end < today;
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
  const filtered = (logs || [])
    .filter((log) => log?.action_goal_id === actionGoalId && log?.completed && log?.date)
    .map((log) => normalizeDateOnly(log.date))
    .filter(Boolean);

  const dateSet = new Set(filtered);
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
  const base = {
    exercise_level: 1,
    exercise_xp: 0,
    study_level: 1,
    study_xp: 0,
    mental_level: 1,
    mental_xp: 0,
    daily_level: 1,
    daily_xp: 0,
  };

  for (const log of logs) {
    const cat = log?.category;
    if (!cat || !Object.prototype.hasOwnProperty.call(base, `${cat}_xp`)) continue;
    base[`${cat}_xp`] += 10;
  }

  ['exercise', 'study', 'mental', 'daily'].forEach((cat) => {
    const xp = base[`${cat}_xp`];
    base[`${cat}_level`] = Math.max(1, Math.floor(xp / 30) + 1);
  });

  return base;
}

export default function Home() {
  const navigate = useNavigate();
  const [guestVersion, setGuestVersion] = useState(0);
  const [activeCategory, setActiveCategory] = useState('exercise');

  useEffect(() => {
    const handleGuestUpdate = () => {
      setGuestVersion((prev) => prev + 1);
    };

    window.addEventListener('root-home-data-updated', handleGuestUpdate);
    return () => {
      window.removeEventListener('root-home-data-updated', handleGuestUpdate);
    };
  }, []);

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me().catch(() => null),
    staleTime: 1000 * 30,
  });

  const isGuest = !user;

  const { data: guestData = {} } = useQuery({
    queryKey: ['guest-home-data', guestVersion],
    queryFn: () => loadGuestData(),
    staleTime: 0,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals', isGuest, guestVersion],
    queryFn: async () => {
      if (isGuest) return guestData?.goals || [];
      return base44.entities.Goal.list('-created_date', 100);
    },
    enabled: !isUserLoading,
  });

  const { data: actionGoals = [] } = useQuery({
    queryKey: ['actionGoals', isGuest, guestVersion],
    queryFn: async () => {
      if (isGuest) return guestData?.actionGoals || [];
      return base44.entities.ActionGoal.list('-created_date', 200);
    },
    enabled: !isUserLoading,
  });

  const { data: allLogs = [] } = useQuery({
    queryKey: ['allLogs', isGuest, guestVersion],
    queryFn: async () => {
      if (isGuest) return guestData?.actionLogs || [];
      return base44.entities.ActionLog.list('-date', 500);
    },
    enabled: !isUserLoading,
  });

  const { data: userLevels = {} } = useQuery({
    queryKey: ['user-levels', isGuest, guestVersion],
    queryFn: async () => {
      if (isGuest) return getDefaultUserLevels(guestData?.actionLogs || []);
      return getDefaultUserLevels(allLogs || []);
    },
    enabled: !isUserLoading,
  });

  useEffect(() => {
    if (isUserLoading) return;

    if (isGuest) {
      const guestCategory =
        guestData?.activeCategory ||
        guestData?.goalData?.category ||
        guestData?.actionGoalData?.category ||
        guestData?.goals?.[0]?.category ||
        'exercise';

      setActiveCategory(guestCategory);
      return;
    }

    const serverCategory = user?.active_category || goals?.[0]?.category || 'exercise';
    setActiveCategory(serverCategory);
  }, [isUserLoading, isGuest, guestData, user, goals]);

  const handleCategoryChange = async (nextCategory) => {
    setActiveCategory(nextCategory);

    if (isGuest) {
      const current = loadGuestData();
      saveGuestData({
        ...current,
        activeCategory: nextCategory,
      });
      return;
    }

    try {
      await base44.auth.updateMe({ active_category: nextCategory });
    } catch (error) {
      console.error('active category update error:', error);
    }
  };

  const handleCreateGoal = () => {
    const route = CATEGORY_ROUTE_MAP[activeCategory] || '/CreateGoalExercise';
    navigate(route);
  };

  const activeGoals = useMemo(() => {
    return (goals || []).filter((goal) => {
      if (!goal) return false;
      if (goal.category !== activeCategory) return false;
      if (goal.status && goal.status !== 'active') return false;
      return true;
    });
  }, [goals, activeCategory]);

  const activeActionGoals = useMemo(() => {
    return (actionGoals || []).filter((goal) => {
      if (!goal) return false;
      if (goal.category !== activeCategory) return false;
      if (goal.status && goal.status !== 'active') return false;
      return true;
    });
  }, [actionGoals, activeCategory]);

  const activeGoalIds = useMemo(() => new Set(activeGoals.map((goal) => goal.id)), [activeGoals]);

  const linkedActionGoals = useMemo(() => {
    return activeActionGoals.filter((actionGoal) => {
      if (!actionGoal.goal_id) return true;
      if (activeGoalIds.size === 0) return true;
      return activeGoalIds.has(actionGoal.goal_id);
    });
  }, [activeActionGoals, activeGoalIds]);

  const today = getTodayString();

  const groupedActionGoals = useMemo(() => {
    const todayItems = [];
    const scheduledItems = [];
    const overdueItems = [];

    linkedActionGoals.forEach((actionGoal) => {
      const isOneTime = actionGoal.action_type === 'one_time';
      const scheduledDate = actionGoal.scheduled_date || '';
      const normalizedScheduledDate = scheduledDate ? normalizeDateOnly(scheduledDate) : '';

      if (isOneTime) {
        if (!normalizedScheduledDate) {
          scheduledItems.push(actionGoal);
          return;
        }

        if (normalizedScheduledDate < today) {
          overdueItems.push(actionGoal);
          return;
        }

        if (normalizedScheduledDate === today) {
          todayItems.push(actionGoal);
          return;
        }

        scheduledItems.push(actionGoal);
        return;
      }

      if (isGoalExpired(actionGoal)) {
        overdueItems.push(actionGoal);
        return;
      }

      todayItems.push(actionGoal);
    });

    scheduledItems.sort((a, b) => {
      const aDate = a?.scheduled_date ? normalizeDateOnly(a.scheduled_date) : '9999-12-31';
      const bDate = b?.scheduled_date ? normalizeDateOnly(b.scheduled_date) : '9999-12-31';
      return aDate.localeCompare(bDate);
    });

    overdueItems.sort((a, b) => {
      const aDate = a?.scheduled_date ? normalizeDateOnly(a.scheduled_date) : '0000-01-01';
      const bDate = b?.scheduled_date ? normalizeDateOnly(b.scheduled_date) : '0000-01-01';
      return aDate.localeCompare(bDate);
    });

    return {
      todayItems,
      scheduledItems,
      overdueItems,
    };
  }, [linkedActionGoals, today]);

  const activeGoal = activeGoals[0] || null;
  const activeGoalLogs = useMemo(() => {
    if (!activeGoal) return [];
    return (allLogs || []).filter((log) => log?.goal_id === activeGoal.id);
  }, [allLogs, activeGoal]);

  if (isUserLoading) {
    return (
      <div className="min-h-full bg-background px-4 py-6">
        <div className="h-28 rounded-2xl bg-secondary/60 animate-pulse mb-4" />
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-14 rounded-xl bg-secondary/60 animate-pulse" />
          ))}
        </div>
        <div className="h-28 rounded-2xl bg-secondary/60 animate-pulse mb-3" />
        <div className="h-24 rounded-2xl bg-secondary/60 animate-pulse mb-3" />
        <div className="h-24 rounded-2xl bg-secondary/60 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background pb-24">
      <div className="px-4 pt-4 pb-2">
        <div
          className="rounded-2xl p-4 border"
          style={{
            background: 'linear-gradient(135deg, #f8edd2 0%, #f4e4bf 45%, #ead39c 100%)',
            borderColor: '#d4b06a',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-amber-100 border border-amber-300">
              🦊
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-amber-950">
                {isGuest ? guestData?.nickname || '용사' : user?.nickname || '용사'}님
              </p>
              <p className="text-sm text-amber-800">
                오늘도 {CATEGORY_LABELS[activeCategory]} 루트를 이어가요
              </p>
            </div>
          </div>
        </div>
      </div>

      <CategoryTabs
        active={activeCategory}
        onChange={handleCategoryChange}
        userLevels={userLevels}
      />

      {activeGoal ? (
        <div className="px-4 pt-3">
          <GoalProgress goal={activeGoal} logs={activeGoalLogs} />
        </div>
      ) : (
        <EmptyGoalState category={activeCategory} onCreateGoal={handleCreateGoal} />
      )}

      {linkedActionGoals.length > 0 && (
        <div className="px-4 pt-5 space-y-6">
          <Section
            title="오늘 해야 할 것"
            count={groupedActionGoals.todayItems.length}
            emptyText="오늘 해야 할 행동목표가 없습니다."
          >
            {groupedActionGoals.todayItems.map((actionGoal) => (
              <ActionGoalCard
                key={actionGoal.id}
                actionGoal={actionGoal}
                weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)}
                allLogs={getAllLogsForAction(allLogs, actionGoal.id)}
                streak={getStreakForAction(allLogs, actionGoal.id)}
              />
            ))}
          </Section>

          <Section
            title="예정된 목표"
            count={groupedActionGoals.scheduledItems.length}
            emptyText="예정된 목표가 없습니다."
          >
            {groupedActionGoals.scheduledItems.map((actionGoal) => (
              <ActionGoalCard
                key={actionGoal.id}
                actionGoal={actionGoal}
                weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)}
                allLogs={getAllLogsForAction(allLogs, actionGoal.id)}
                streak={getStreakForAction(allLogs, actionGoal.id)}
              />
            ))}
          </Section>

          <Section
            title="기한 지난 목표"
            count={groupedActionGoals.overdueItems.length}
            emptyText="기한 지난 목표가 없습니다."
          >
            {groupedActionGoals.overdueItems.map((actionGoal) => (
              <ActionGoalCard
                key={actionGoal.id}
                actionGoal={actionGoal}
                weeklyLogs={getWeeklyLogsForAction(allLogs, actionGoal.id)}
                allLogs={getAllLogsForAction(allLogs, actionGoal.id)}
                streak={getStreakForAction(allLogs, actionGoal.id)}
              />
            ))}
          </Section>
        </div>
      )}

      {!activeGoal && linkedActionGoals.length === 0 && (
        <div className="px-4 pt-4">
          <button
            onClick={handleCreateGoal}
            className="w-full rounded-2xl py-4 font-bold text-white"
            style={{
              background: 'linear-gradient(180deg, #a76a1e 0%, #8d5816 100%)',
            }}
          >
            {CATEGORY_LABELS[activeCategory]} 목표 만들기
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, count, emptyText, children }) {
  const hasChildren = React.Children.count(children) > 0;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-amber-950">{title}</h2>
        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-800">
          {count}개
        </span>
      </div>

      {hasChildren ? (
        <div className="space-y-3">{children}</div>
      ) : (
        <div className="rounded-2xl border bg-card px-4 py-5 text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}
    </section>
  );
}
