/**
 * NavigationStackManager
 * Manages navigation history for proper back-stack handling in iOS/Android WebView
 * Supports deep linking, tab restoration, and consistent push/pop detection
 */

class NavigationStackManager {
  constructor() {
    this.stack = [];
    this.currentIndex = -1;
    this.isNavigating = false;
    this.listeners = [];
  }

  /**
   * Initialize with a starting path
   */
  initialize(initialPath) {
    this.stack = [initialPath];
    this.currentIndex = 0;
    this.notifyListeners();
  }

  /**
   * Push a new path onto the stack
   */
  push(path) {
    if (this.isNavigating) return;
    
    // If we're not at the end, truncate future history
    if (this.currentIndex < this.stack.length - 1) {
      this.stack = this.stack.slice(0, this.currentIndex + 1);
    }

    // Only push if it's not the current path
    if (this.stack[this.currentIndex] !== path) {
      this.stack.push(path);
      this.currentIndex++;
    }

    this.notifyListeners();
  }

  /**
   * Pop back to previous path
   */
  pop() {
    if (this.isNavigating || this.currentIndex <= 0) return false;

    this.isNavigating = true;
    this.currentIndex--;
    
    setTimeout(() => {
      this.isNavigating = false;
      this.notifyListeners();
    }, 300);

    return true;
  }

  /**
   * Get current path
   */
  getCurrentPath() {
    return this.stack[this.currentIndex] || null;
  }

  /**
   * Get navigation direction (push/pop)
   */
  getDirection() {
    if (this.isNavigating) {
      return this.currentIndex < this.stack.length - 1 ? 'pop' : 'push';
    }
    return 'push';
  }

  /**
   * Check if can go back
   */
  canGoBack() {
    return this.currentIndex > 0;
  }

  /**
   * Get full stack (useful for debugging)
   */
  getStack() {
    return [...this.stack];
  }

  /**
   * Reset stack (for logout, etc.)
   */
  reset(initialPath) {
    this.stack = [initialPath];
    this.currentIndex = 0;
    this.isNavigating = false;
    this.notifyListeners();
  }

  /**
   * Subscribe to stack changes
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this));
  }
}

export const navigationStackManager = new NavigationStackManager();