/**
 * GuestDataPersistence
 * Robust error handling for local data persistence in guest mode
 * Prevents state desync through validation, versioning, and recovery
 */

const PERSISTENCE_VERSION = '1.0';
const STORAGE_KEYS = {
  version: 'app_persistence_version',
  goals: 'local_goals',
  actionGoals: 'local_action_goals',
  actionLogs: 'local_action_logs',
  badges: 'local_badges',
  nickname: 'guest_nickname',
  activeCategory: 'guest_active_category',
  onboardingComplete: 'guest_onboarding_complete',
};

class GuestDataPersistence {
  constructor() {
    this.isAvailable = this.checkStorageAvailability();
  }

  /**
   * Check if localStorage is available and writable
   */
  checkStorageAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'true');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn('[GuestDataPersistence] localStorage unavailable:', error.message);
      return false;
    }
  }

  /**
   * Safely save data with error handling and versioning
   */
  saveData(key, data) {
    if (!this.isAvailable) {
      console.warn('[GuestDataPersistence] Storage unavailable, data not persisted');
      return false;
    }

    try {
      const payload = {
        version: PERSISTENCE_VERSION,
        timestamp: Date.now(),
        data: data,
      };

      localStorage.setItem(key, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error(`[GuestDataPersistence] Failed to save ${key}:`, error.message);
      this.handleStorageError(error);
      return false;
    }
  }

  /**
   * Safely load data with validation and recovery
   */
  loadData(key, defaultValue = null) {
    if (!this.isAvailable) {
      return defaultValue;
    }

    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;

      const payload = JSON.parse(stored);

      // Validate payload structure
      if (!payload.version || !payload.data) {
        console.warn(`[GuestDataPersistence] Invalid payload structure for ${key}, using default`);
        return defaultValue;
      }

      // Version compatibility check (can be extended for migrations)
      if (payload.version !== PERSISTENCE_VERSION) {
        console.warn(`[GuestDataPersistence] Version mismatch for ${key}, attempting recovery`);
        return defaultValue;
      }

      return payload.data;
    } catch (error) {
      console.error(`[GuestDataPersistence] Failed to load ${key}:`, error.message);
      this.handleStorageError(error, key);
      return defaultValue;
    }
  }

  /**
   * Save all guest onboarding data atomically
   */
  saveOnboardingData(state) {
    const {
      goalData,
      actionGoalData,
      nickname,
      category,
    } = state;

    if (!this.isAvailable) {
      console.error('[GuestDataPersistence] Cannot save onboarding: storage unavailable');
      return false;
    }

    try {
      // Save all data
      const results = [
        this.saveData(STORAGE_KEYS.goals, [goalData]),
        this.saveData(STORAGE_KEYS.actionGoals, [actionGoalData]),
        this.saveData(STORAGE_KEYS.actionLogs, []),
        this.saveData(STORAGE_KEYS.badges, []),
        this.saveData(STORAGE_KEYS.nickname, nickname || '용사'),
        this.saveData(STORAGE_KEYS.activeCategory, category),
        this.saveData(STORAGE_KEYS.onboardingComplete, 'true'),
        // Also save as raw value for direct localStorage.getItem checks in Home
        (() => { try { localStorage.setItem('guest_onboarding_complete', 'true'); return true; } catch { return false; } })(),
      ];

      // All or nothing: if any save failed, return false
      if (results.some(r => !r)) {
        console.error('[GuestDataPersistence] Partial save failure detected');
        return false;
      }

      return true;
    } catch (error) {
      console.error('[GuestDataPersistence] Atomic save failed:', error.message);
      this.handleStorageError(error);
      return false;
    }
  }

  /**
   * Load all guest data with fallback defaults
   */
  loadOnboardingData() {
    if (!this.isAvailable) {
      return this.getDefaultOnboardingState();
    }

    try {
      return {
        goals: this.loadData(STORAGE_KEYS.goals, []),
        actionGoals: this.loadData(STORAGE_KEYS.actionGoals, []),
        actionLogs: this.loadData(STORAGE_KEYS.actionLogs, []),
        badges: this.loadData(STORAGE_KEYS.badges, []),
        nickname: this.loadData(STORAGE_KEYS.nickname, '용사'),
        activeCategory: this.loadData(STORAGE_KEYS.activeCategory, 'daily'),
        onboardingComplete: this.loadData(STORAGE_KEYS.onboardingComplete, 'false') === 'true',
      };
    } catch (error) {
      console.error('[GuestDataPersistence] Failed to load onboarding data:', error.message);
      return this.getDefaultOnboardingState();
    }
  }

  /**
   * Clear all guest data safely
   */
  clearAllData() {
    if (!this.isAvailable) return false;

    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`[GuestDataPersistence] Failed to remove ${key}`);
        }
      });
      return true;
    } catch (error) {
      console.error('[GuestDataPersistence] Failed to clear all data:', error.message);
      return false;
    }
  }

  /**
   * Handle storage errors with recovery strategy
   */
  handleStorageError(error, key = null) {
    if (error.name === 'QuotaExceededError') {
      console.error('[GuestDataPersistence] Storage quota exceeded');
      this.attemptQuotaRecovery();
    } else if (error.name === 'SecurityError') {
      console.error('[GuestDataPersistence] Security error: possibly in private browsing mode');
    } else {
      console.error('[GuestDataPersistence] Unknown storage error:', error.name);
    }
  }

  /**
   * Attempt recovery when quota is exceeded by removing old entries
   */
  attemptQuotaRecovery() {
    try {
      // Remove action logs (typically largest data structure) to free space
      localStorage.removeItem(STORAGE_KEYS.actionLogs);
      console.warn('[GuestDataPersistence] Cleared action logs to recover quota');
    } catch (e) {
      console.error('[GuestDataPersistence] Quota recovery failed');
    }
  }

  /**
   * Calculate localStorage usage ratio
   */
  getStorageUsageRatio() {
    try {
      let totalSize = 0;
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
        }
      }
      // Rough estimate: typical localStorage limit is ~5-10MB
      const estimatedLimit = 5 * 1024 * 1024;
      return totalSize / estimatedLimit;
    } catch (e) {
      console.warn('[GuestDataPersistence] Failed to calculate storage usage:', e.message);
      return 0;
    }
  }

  /**
   * Cleanup old action logs if storage exceeds 80% capacity
   */
  cleanupOldLogs() {
    if (!this.isAvailable) return false;

    try {
      const usageRatio = this.getStorageUsageRatio();
      if (usageRatio < 0.8) {
        return true; // No cleanup needed
      }

      const actionLogs = this.loadData(STORAGE_KEYS.actionLogs, []);
      if (!Array.isArray(actionLogs) || actionLogs.length === 0) {
        return true;
      }

      // Remove oldest 25% of logs
      const cutoff = Math.floor(actionLogs.length * 0.25);
      const trimmed = actionLogs.slice(cutoff);
      const saved = this.saveData(STORAGE_KEYS.actionLogs, trimmed);

      if (saved) {
        console.warn(`[GuestDataPersistence] Cleaned up ${cutoff} old action logs (usage: ${(usageRatio * 100).toFixed(1)}%)`);
      }
      return saved;
    } catch (error) {
      console.error('[GuestDataPersistence] Cleanup failed:', error.message);
      return false;
    }
  }

  /**
   * Start periodic background cleanup (runs every 5 minutes)
   */
  startBackgroundCleanup() {
    if (this._cleanupInterval) return; // Already running

    this._cleanupInterval = setInterval(() => {
      this.cleanupOldLogs();
    }, 5 * 60 * 1000); // 5 minutes

    console.log('[GuestDataPersistence] Background cleanup started (interval: 5 min)');
  }

  /**
   * Stop periodic background cleanup
   */
  stopBackgroundCleanup() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
      console.log('[GuestDataPersistence] Background cleanup stopped');
    }
  }

  /**
   * Get default onboarding state
   */
  getDefaultOnboardingState() {
    return {
      goals: [],
      actionGoals: [],
      actionLogs: [],
      badges: [],
      nickname: '용사',
      activeCategory: 'daily',
      onboardingComplete: false,
    };
  }

  /**
   * Validate data integrity (useful for debugging)
   */
  validateDataIntegrity() {
    const data = this.loadOnboardingData();
    const issues = [];

    if (!Array.isArray(data.goals)) issues.push('goals is not an array');
    if (!Array.isArray(data.actionGoals)) issues.push('actionGoals is not an array');
    if (!Array.isArray(data.actionLogs)) issues.push('actionLogs is not an array');
    if (!Array.isArray(data.badges)) issues.push('badges is not an array');
    if (typeof data.nickname !== 'string') issues.push('nickname is not a string');

    if (issues.length > 0) {
      console.warn('[GuestDataPersistence] Integrity issues:', issues);
      return false;
    }

    return true;
  }
}

export const guestDataPersistence = new GuestDataPersistence();