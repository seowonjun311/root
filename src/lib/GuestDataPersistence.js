const STORAGE_KEY = 'root_guest_data';

class GuestDataPersistence {
  loadGuestData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      return {
        onboardingComplete: false,
        nickname: '',
        category: '',
        goalData: null,
        actionGoalData: null,
        ...parsed,
      };
    } catch (error) {
      console.error('게스트 데이터 불러오기 실패:', error);
      return null;
    }
  }

  saveGuestData(data) {
    try {
      const current = this.loadGuestData() || {};

      const nextData = {
        ...current,
        ...data,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      return nextData;
    } catch (error) {
      console.error('게스트 데이터 저장 실패:', error);
      return null;
    }
  }

  saveOnboardingData({ goalData, actionGoalData, nickname, category }) {
    try {
      const nextData = {
        onboardingComplete: true,
        nickname: nickname || '',
        category: category || '',
        goalData: goalData || null,
        actionGoalData: actionGoalData || null,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
      return nextData;
    } catch (error) {
      console.error('온보딩 데이터 저장 실패:', error);
      return null;
    }
  }

  isOnboardingComplete() {
    const data = this.loadGuestData();
    return Boolean(data?.onboardingComplete);
  }

  getNickname() {
    const data = this.loadGuestData();
    return data?.nickname || '';
  }

  getCategory() {
    const data = this.loadGuestData();
    return data?.category || '';
  }

  getGoalData() {
    const data = this.loadGuestData();
    return data?.goalData || null;
  }

  getActionGoalData() {
    const data = this.loadGuestData();
    return data?.actionGoalData || null;
  }

  clearGuestData() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('게스트 데이터 삭제 실패:', error);
      return false;
    }
  }
}

export const guestDataPersistence = new GuestDataPersistence();
export default guestDataPersistence;
