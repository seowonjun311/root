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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const guestDataPersistence = {
  // 🔹 온보딩 저장
  saveOnboardingData({ goalData, actionGoalData, nickname, category }) {
    const current = load();

    const newGoal = {
      ...goalData,
      id: `local_goal_${Date.now()}`,
      created_date: new Date().toISOString(),
      status: 'active',
    };

    const newActionGoal = {
      ...actionGoalData,
      id: `local_action_${Date.now()}`,
      goal_id: newGoal.id,
      created_date: new Date().toISOString(),
      status: 'active',
    };

    const updated = {
      ...current,
      onboardingComplete: true,
      nickname,
      activeCategory: category,

      // 🔥 핵심: 배열 누적
      goals: [...(current.goals || []), newGoal],
      actionGoals: [...(current.actionGoals || []), newActionGoal],
    };

    save(updated);
  },

  // 🔹 데이터 불러오기
  loadOnboardingData() {
    return load();
  },

  // 🔹 행동로그 추가
  addActionLog(log) {
    const current = load();

    const newLog = {
      ...log,
      id: `local_log_${Date.now()}`,
      created_date: new Date().toISOString(),
    };

    const updated = {
      ...current,
      actionLogs: [...(current.actionLogs || []), newLog],
    };

    save(updated);
  },

  // 🔹 카테고리 저장
  saveData(key, value) {
    const current = load();

    const updated = {
      ...current,
      [key === 'guest_active_category' ? 'activeCategory' : key]: value,
    };

    save(updated);
  },

  // 🔹 전체 초기화 (로그아웃 등)
  clear() {
    localStorage.removeItem(STORAGE_KEY);
  },
};