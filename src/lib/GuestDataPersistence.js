const STORAGE_KEY = 'root_guest_data';
const UPDATE_EVENT = 'root-guest-data-updated';

const defaultGuestData = {
  onboardingComplete: false,
  nickname: '',
  category: 'exercise',

  goals: [],
  actionGoals: [],
  actionLogs: [],
  titles: [],
  equipped_title: '',

  userLevels: {
    exercise_level: 1,
    exercise_xp: 0,
    study_level: 1,
    study_xp: 0,
    mental_level: 1,
    mental_xp: 0,
    daily_level: 1,
    daily_xp: 0,
  },
};

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function uniqueTitles(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter(Boolean).map(String))];
}

function normalizeGuestData(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};

  const titles = uniqueTitles(data.titles);

  let equippedTitle =
    typeof data.equipped_title === 'string' ? data.equipped_title : '';

  if (equippedTitle && !titles.includes(equippedTitle)) {
    equippedTitle = '';
  }

  if (!equippedTitle && titles.length > 0) {
    equippedTitle = titles[0];
  }

  return {
    ...defaultGuestData,
    ...data,
    goals: Array.isArray(data.goals) ? data.goals : [],
    actionGoals: Array.isArray(data.actionGoals) ? data.actionGoals : [],
    actionLogs: Array.isArray(data.actionLogs) ? data.actionLogs : [],
    titles,
    equipped_title: equippedTitle,
    userLevels: {
      ...defaultGuestData.userLevels,
      ...(data.userLevels || {}),
    },
  };
}

function emitUpdate() {
  if (!isBrowser()) return;

  window.dispatchEvent(new Event(UPDATE_EVENT));
  window.dispatchEvent(new Event('root-home-data-updated'));
}

const guestDataPersistence = {
  STORAGE_KEY,
  UPDATE_EVENT,

  getData() {
    if (!isBrowser()) return normalizeGuestData(defaultGuestData);

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return normalizeGuestData(defaultGuestData);
    }

    const parsed = safeJsonParse(raw, defaultGuestData);
    return normalizeGuestData(parsed);
  },

  setData(nextData) {
    if (!isBrowser()) return normalizeGuestData(nextData);

    const normalized = normalizeGuestData(nextData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    emitUpdate();
    return normalized;
  },

  updateData(updater) {
    const prev = this.getData();

    const draft =
      typeof updater === 'function'
        ? updater(prev)
        : { ...prev, ...(updater || {}) };

    const next = normalizeGuestData({
      ...prev,
      ...draft,
    });

    return this.setData(next);
  },

  saveData(key, value) {
    return this.updateData((prev) => ({
      ...prev,
      [key]: value,
    }));
  },

  clearAll() {
    if (!isBrowser()) return;
    localStorage.removeItem(STORAGE_KEY);
    emitUpdate();
  },

  saveOnboardingData({ goalData, actionGoalData, nickname, category } = {}) {
    return this.updateData((prev) => ({
      ...prev,
      onboardingComplete: true,
      nickname: nickname ?? prev.nickname,
      category: category ?? prev.category,
      goals: Array.isArray(goalData) ? goalData : prev.goals,
      actionGoals: Array.isArray(actionGoalData)
        ? actionGoalData
        : prev.actionGoals,
    }));
  },

  getTitles() {
    return this.getData().titles || [];
  },

  ensureEquippedTitle(preferredTitle = '') {
    return this.updateData((prev) => {
      const titles = uniqueTitles(prev.titles);
      let nextEquipped =
        typeof prev.equipped_title === 'string' ? prev.equipped_title : '';

      if (preferredTitle && titles.includes(preferredTitle)) {
        nextEquipped = preferredTitle;
      }

      if (nextEquipped && titles.includes(nextEquipped)) {
        return {
          ...prev,
          titles,
          equipped_title: nextEquipped,
        };
      }

      return {
        ...prev,
        titles,
        equipped_title: titles[0] || '',
      };
    });
  },

  addTitle(titleName, options = {}) {
    const { autoEquipIfEmpty = true, forceEquip = false } = options;
    const nextTitle = typeof titleName === 'string' ? titleName.trim() : '';

    if (!nextTitle) {
      return this.getData();
    }

    return this.updateData((prev) => {
      const prevTitles = uniqueTitles(prev.titles);
      const alreadyOwned = prevTitles.includes(nextTitle);
      const nextTitles = alreadyOwned ? prevTitles : [...prevTitles, nextTitle];

      let nextEquipped =
        typeof prev.equipped_title === 'string' ? prev.equipped_title : '';

      if (forceEquip) {
        nextEquipped = nextTitle;
      } else if (!nextEquipped && autoEquipIfEmpty) {
        nextEquipped = nextTitle;
      } else if (nextEquipped && !nextTitles.includes(nextEquipped)) {
        nextEquipped = nextTitles[0] || '';
      }

      return {
        ...prev,
        titles: nextTitles,
        equipped_title: nextEquipped,
      };
    });
  },

  equipTitle(titleName) {
    const nextTitle = typeof titleName === 'string' ? titleName.trim() : '';
    if (!nextTitle) return this.getData();

    return this.updateData((prev) => {
      const titles = uniqueTitles(prev.titles);
      if (!titles.includes(nextTitle)) {
        return {
          ...prev,
          titles,
          equipped_title: titles[0] || '',
        };
      }

      return {
        ...prev,
        titles,
        equipped_title: nextTitle,
      };
    });
  },

  subscribe(callback) {
    if (!isBrowser()) return () => {};

    const handler = () => {
      if (typeof callback === 'function') {
        callback(this.getData());
      }
    };

    window.addEventListener(UPDATE_EVENT, handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener(UPDATE_EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  },
};

export default guestDataPersistence;
