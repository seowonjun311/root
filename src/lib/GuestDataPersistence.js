const STORAGE_KEY = 'root_guest_data';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    console.error('GuestDataPersistence load error:', error);
    return {};
  }
}

function save(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('GuestDataPersistence save error:', error);
    return false;
  }
}

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeKey(key) {
  switch (key) {
    case 'guest_active_category':
      return 'activeCategory';
    case 'local_action_logs':
      return 'actionLogs';
    case 'local_action_goals':
      return 'actionGoals';
    case 'local_goals':
      return 'goals';
    default:
      return key;
  }
}

function normalizeLoadedData(current) {
  const goalsFromArray = ensureArray(current.goals);
  const actionGoalsFromArray = ensureArray(current.actionGoals);
  const actionLogsFromArray = ensureArray(current.actionLogs);

  const goals =
    goalsFromArray.length > 0
      ? goalsFromArray
      : current.goalData
        ? [current.goalData]
        : [];

  const actionGoals =
    actionGoalsFromArray.length > 0
      ? actionGoalsFromArray
      : current.actionGoalData
        ? [current.actionGoalData]
        : [];

  return {
    ...current,
    onboardingComplete: current.onboardingComplete === true,
    nickname: current.nickname || '용사',
    activeCategory:
      current.activeCategory ||
      current.goalData?.category ||
      current.actionGoalData?.category ||
      goals[0]?.category ||
      actionGoals[0]?.category ||
      'exercise',
    goals,
    actionGoals,
    actionLogs: actionLogsFromArray,
    goalData: goals[0] || null,
    actionGoalData: actionGoals[0] || null,
  };
}

export const guestDataPersistence = {
  saveOnboardingData(arg1, arg2, arg3) {
    const currentRaw = load();
    const current = normalizeLoadedData(currentRaw);

    let goalData = null;
    let actionGoalData = null;
    let nickname = '용사';
    let category = null;

    if (
      arg1 &&
      typeof arg1 === 'object' &&
      (
        Object.prototype.hasOwnProperty.call(arg1, 'goalData') ||
        Object.prototype.hasOwnProperty.call(arg1, 'actionGoalData') ||
        Object.prototype.hasOwnProperty.call(arg1, 'nickname') ||
        Object.prototype.hasOwnProperty.call(arg1, 'category')
      )
    ) {
      goalData = arg1.goalData || null;
      actionGoalData = arg1.actionGoalData || null;
      nickname = arg1.nickname || '용사';
      category =
        arg1.category ||
        goalData?.category ||
        actionGoalData?.category ||
        current.activeCategory ||
        'exercise';
    } else {
      goalData = arg1 || null;
      actionGoalData = arg2 || null;
      nickname = arg3 || '용사';
      category =
        goalData?.category ||
        actionGoalData?.category ||
        current.activeCategory ||
        'exercise';
    }

    const goals = [...current.goals];
    const actionGoals = [...current.actionGoals];
    const actionLogs = [...current.actionLogs];

    let newGoal = null;
    let newActionGoal = null;

    if (goalData) {
      newGoal = {
        ...goalData,
        id: goalData.id || `local_goal_${Date.now()}`,
        created_date: goalData.created_date || new Date().toISOString(),
        updated_date: new Date().toISOString(),
        status: goalData.status || 'active',
        goal_type: goalData.goal_type || 'result',
        category: goalData.category || category || 'exercise',
      };
    }

    if (actionGoalData) {
      newActionGoal = {
        ...actionGoalData,
        id: actionGoalData.id || `local_action_${Date.now()}_${Math.floor(Math.random() * 1000)}`,

        // 🔥🔥🔥 핵심 수정된 줄
        goal_id: newGoal?.id || actionGoalData.goal_id || current.goalData?.id || null,

        created_date: actionGoalData.created_date || new Date().toISOString(),
        updated_date: new Date().toISOString(),
        status: actionGoalData.status || 'active',
        category: actionGoalData.category || category || newGoal?.category || 'exercise',
      };
    }

    const nextGoals = newGoal
      ? [...goals.filter((g) => g.id !== newGoal.id), newGoal]
      : goals;

    const nextActionGoals = newActionGoal
      ? [...actionGoals.filter((g) => g.id !== newActionGoal.id), newActionGoal]
      : actionGoals;

    const nextData = {
      ...current,
      onboardingComplete: true,
      nickname,
      activeCategory: category || current.activeCategory || 'exercise',

      goals: nextGoals,
      actionGoals: nextActionGoals,
      actionLogs,

      goalData: newGoal || nextGoals[0] || current.goalData || null,
      actionGoalData: newActionGoal || nextActionGoals[0] || current.actionGoalData || null,
    };

    return save(nextData);
  },

  loadOnboardingData() {
    const current = load();
    return normalizeLoadedData(current);
  },

  saveData(key, value) {
    const current = normalizeLoadedData(load());
    const normalizedKey = normalizeKey(key);

    const next = {
      ...current,
      [normalizedKey]: value,
    };

    if (normalizedKey === 'goals') {
      next.goalData = ensureArray(value)[0] || null;
    }

    if (normalizedKey === 'actionGoals') {
      next.actionGoalData = ensureArray(value)[0] || null;
    }

    return save(next);
  },

  addActionLog(log) {
    const current = normalizeLoadedData(load());

    const newLog = {
      ...log,
      id: log?.id || `local_log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      created_date: log?.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    const next = {
      ...current,
      actionLogs: [...current.actionLogs, newLog],
    };

    return save(next);
  },

  updateActionGoal(actionGoalId, patch) {
    const current = normalizeLoadedData(load());

    const nextActionGoals = current.actionGoals.map((goal) =>
      goal.id === actionGoalId
        ? { ...goal, ...patch, updated_date: new Date().toISOString() }
        : goal
    );

    const next = {
      ...current,
      actionGoals: nextActionGoals,
      actionGoalData: nextActionGoals[0] || null,
    };

    return save(next);
  },

  deleteActionGoal(actionGoalId) {
    const current = normalizeLoadedData(load());

    const nextActionGoals = current.actionGoals.filter((goal) => goal.id !== actionGoalId);
    const nextActionLogs = current.actionLogs.filter((log) => log.action_goal_id !== actionGoalId);

    const next = {
      ...current,
      actionGoals: nextActionGoals,
      actionLogs: nextActionLogs,
      actionGoalData: nextActionGoals[0] || null,
    };

    return save(next);
  },

  updateGoal(goalId, patch) {
    const current = normalizeLoadedData(load());

    const nextGoals = current.goals.map((goal) =>
      goal.id === goalId
        ? { ...goal, ...patch, updated_date: new Date().toISOString() }
        : goal
    );

    const next = {
      ...current,
      goals: nextGoals,
      goalData: nextGoals[0] || null,
    };

    return save(next);
  },

  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
