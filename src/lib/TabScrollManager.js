/**
 * Utility class to manage per-tab scroll position persistence
 * Saves and restores scroll state when switching between tabs
 */
class TabScrollManager {
  constructor() {
    this.scrollPositions = new Map();
  }

  /**
   * Save scroll position for a tab
   */
  saveScrollPosition(tabPath, scrollElement) {
    if (!scrollElement) return;
    this.scrollPositions.set(tabPath, scrollElement.scrollTop);
  }

  /**
   * Restore scroll position for a tab
   */
  restoreScrollPosition(tabPath, scrollElement) {
    if (!scrollElement) return;
    const position = this.scrollPositions.get(tabPath) ?? 0;
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      scrollElement.scrollTop = position;
    });
  }

  /**
   * Get saved scroll position
   */
  getScrollPosition(tabPath) {
    return this.scrollPositions.get(tabPath) ?? 0;
  }

  /**
   * Clear all scroll positions
   */
  clear() {
    this.scrollPositions.clear();
  }

  /**
   * Clear specific tab scroll position
   */
  clearTab(tabPath) {
    this.scrollPositions.delete(tabPath);
  }
}

export const tabScrollManager = new TabScrollManager();