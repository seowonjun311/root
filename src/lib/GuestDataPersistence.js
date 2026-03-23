const STORAGE_KEY = 'root_guest_data';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
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

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export const guestDataPersistence = {
  // 온보딩 저장
  // 현재 앱 구조:
  // saveOnboardingData({ goalData, actionGoalData, nickname, category })
  // 예전 호환:
  // saveOnboardingData(goalData, actionGoalData, nickname)
  saveOnboardingData(arg1, arg2, arg3) {
    const current = load();

    let goalData = null;
    let actionGoalData = null;
    let nickname = '용사';
    let category = null;

    if (
      arg1 &&
      typeof arg1 === 'object' &&
      (Object.prototype.hasOwnProperty.call(arg1, 'goalData') ||
        Object.prototype.hasOwnProperty.call(arg1, 'actionGoalData') ||
        Object.prototype.hasOwnProperty.call(arg1, 'nickname'))
    ) {
      goalData = arg1.goalData || null;
      actionGoalData = arg1.actionGoalData || null;
      nickname = arg1.nickname || '용사';
      category = arg1.category || goalData?.category || actionGoalData?.category || null;
    } else {
      goalData = arg1 || null;
      actionGoalData = arg2 || null;
      nickname = arg3 || '용사';
      category = goalData?.category || actionGoalData?.category || null;
    }

    const goals = ensureArray(current.goals);
    const actionGoals = ensureArray(current.actionGoals);
    const actionLogs = ensureArray(current.actionLogs);

    let newGoal = null;
    let newActionGoal = null;

    if (goalData) {
      newGoal = {
        ...goalData,
        id: goalData.id || `local_goal_${Date.now()}`,
        created_date: goalData.created_date || new Date().toISOString(),
        status: goalData.status || 'active',
      };
    }

    if (actionGoalData) {
      newActionGoal = {
        ...actionGoalData,
        id: actionGoalData.id || `local_action_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        goal_id: actionGoalData.goal_id || newGoal?.id || null,
        created_date: actionGoalData.created_date || new Date().toISOString(),
        status: actionGoalData.status || 'active',
      };
    }

    const updated = {
      ...current,
      onboardingComplete: true,
      nickname,
      activeCategory: current.activeCategory || category || current.activeCategory || 'exercise',
      goals: newGoal ? [...goals, newGoal] : goals,
      actionGoals: newActionGoal ? [...actionGoals, newActionGoal] : actionGoals,
      actionLogs,
    };

    return save(updated);
  },

  // 전체 데이터 읽기
  loadOnboardingData() {
    const current = load();

    return {
      ...current,
      onboardingComplete: current.onboardingComplete === true,
      nickname: current.nickname || '용사',
      activeCategory: current.activeCategory || 'exercise',
      goals: ensureArray(current.goals),
      actionGoals: ensureArray(current.actionGoals),
      actionLogs: ensureArray(current.actionLogs),
    };
  },

  // 행동 로그 1개 추가
  addActionLog(log) {
    const current = load();

    const newLog = {
      ...log,
      id: log?.id || `local_log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      created_date: log?.created_date || new Date().toISOString(),
    };

    const updated = {
      ...current,
      actionLogs: [...ensureArray(current.actionLogs), newLog],
    };

    return save(updated);
  },

  // 범용 저장
  saveData(key, value) {
    const current = load();
    const normalizedKey = normalizeKey(key);

    const updated = {
      ...current,
      [normalizedKey]: value,
    };

    return save(updated);
  },

  // 특정 행동목표 수정
  updateActionGoal(actionGoalId, patch) {
    const current = load();

    const updated = {
      ...current,
      actionGoals: ensureArray(current.actionGoals).map((goal) =>
        goal.id === actionGoalId ? { ...goal, ...patch } : goal
      ),
    };

    return save(updated);
  },

  // 특정 행동목표 삭제
  deleteActionGoal(actionGoalId) {
    const current = load();

    const updated = {
      ...current,
      actionGoals: ensureArray(current.actionGoals).filter((goal) => goal.id !== actionGoalId),
      actionLogs: ensureArray(current.actionLogs).filter((log) => log.action_goal_id !== actionGoalId),
    };

    return save(updated);
  },

  // 특정 결과목표 수정
  updateGoal(goalId, patch) {
    const current = load();

    const updated = {
      ...current,
      goals: ensureArray(current.goals).map((goal) =>
        goal.id === goalId ? { ...goal, ...patch } : goal
      ),
    };

    return save(updated);
  },

  // 전체 초기화
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};
