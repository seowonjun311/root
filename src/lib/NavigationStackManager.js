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
    this.backButtonListeners = [];
  }

  /**
   * Initialize with a starting path or deep link
   * For deep links, initializes the stack with proper history
   */
  initialize(initialPath, isDeepLink = false) {
    if (isDeepLink) {
      // For deep links, build a minimal history stack
      // e.g., /Home -> /CreateGoal?category=exercise becomes [/Home, /CreateGoal?category=exercise]
      const rootPath = '/Home'; // Default root
      this.stack = [rootPath, initialPath];
      this.currentIndex = 1;
    } else {
      this.stack = [initialPath];
      this.currentIndex = 0;
    }
    this.notifyListeners();
  }

  /**
   * Robust deep-link initialization with browser history state validation
   * Syncs internal stack with browser history to prevent route collisions on deep links
   */
  initializeFromCurrentLocation(currentPath) {
    const isDeepLink = currentPath !== '/' && currentPath !== '/Home' && currentPath !== '/Onboarding';
    
    if (isDeepLink) {
      // For deep links: validate browser history state and build stack accordingly
      const browserState = window.history.state;
      
      // If browser state has stackIndex, we're restoring from history
      if (browserState?.stackIndex !== undefined) {
        // Restore from saved state
        this.stack = ['/Home', currentPath];
        this.currentIndex = browserState.stackIndex;
      } else {
        // Fresh deep link: initialize with root + current path
        this.stack = ['/Home', currentPath];
        this.currentIndex = 1;
        
        // Pre-sync browser history to prevent back-button conflicts
        this.syncBrowserHistory();
      }
    } else {
      // Standard initialization for root routes
      this.stack = [currentPath];
      this.currentIndex = 0;
    }
    
    this.notifyListeners();
  }

  /**
   * Push a new path onto the stack and force-sync browser history
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
      this.syncBrowserHistory();
    }

    this.notifyListeners();
  }

  /**
   * Pop back to previous path and force-sync browser history
   */
  pop() {
    if (this.isNavigating || this.currentIndex <= 0) return false;

    this.isNavigating = true;
    this.currentIndex--;
    this.syncBrowserHistory();
    
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
   * Reset stack (for logout, etc.) and force-sync browser history
   */
  reset(initialPath) {
    this.stack = [initialPath];
    this.currentIndex = 0;
    this.isNavigating = false;
    this.syncBrowserHistory();
    this.notifyListeners();
  }

  /**
   * Force-sync internal navigation stack with browser history state
   * Ensures WebView consistency across all platforms (Android, iOS, Web)
   * Critical for deep links and avoiding history desync on back button
   */
  syncBrowserHistory() {
    try {
      const currentPath = this.getCurrentPath();
      if (!currentPath) return;

      const state = {
        stackIndex: this.currentIndex,
        stackLength: this.stack.length,
        timestamp: Date.now(),
        stack: [...this.stack], // Embed full stack for recovery
      };

      // Use replaceState to maintain clean history without creating entries
      window.history.replaceState(state, '', currentPath);
    } catch (error) {
      console.warn('[NavigationStackManager] Failed to sync browser history:', error);
    }
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

  /**
   * Register native Android backbutton listener
   * Handles device.ready backbutton events and prevents default browser back
   */
  onAndroidBackButton(callback) {
    this.backButtonListeners.push(callback);
    return () => {
      this.backButtonListeners = this.backButtonListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Robust Android back-button handler with event propagation control
   * Ensures consistent behavior across all Android API versions
   * Must be called with stopImmediatePropagation for API 14+ compatibility
   */
  handleAndroidBackButton(event) {
    // Stop immediate propagation to prevent other handlers (API 21+)
    if (event && typeof event.stopImmediatePropagation === 'function') {
      event.stopImmediatePropagation();
    }
    
    // Prevent default behavior for all Android versions
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }

    // Notify all registered listeners
    this.backButtonListeners.forEach(callback => {
      try {
        callback();
      } catch (e) {
        console.warn('[NavigationStackManager] Back button listener error:', e);
      }
    });

    // Handle internal navigation stack
    if (this.canGoBack()) {
      this.pop();
      return true; // Prevent default behavior
    }
    return false; // Allow default (exit app)
  }

  /**
   * Enforce internal stack-based navigation
   * Prevents external route changes from bypassing stack management
   * Returns true if navigation is valid within stack context
   */
  enforceStackNavigation(targetPath) {
    const currentPath = this.getCurrentPath();
    
    // Allow navigation if moving to adjacent or new routes
    if (targetPath === currentPath) {
      return true; // Same path, no action needed
    }
    
    // Check if target exists in history (back navigation)
    const existingIndex = this.stack.indexOf(targetPath);
    if (existingIndex !== -1 && existingIndex < this.currentIndex) {
      this.currentIndex = existingIndex;
      this.syncBrowserHistory();
      this.notifyListeners();
      return true;
    }
    
    // New forward navigation
    if (existingIndex === -1) {
      this.push(targetPath);
      return true;
    }
    
    return false;
  }

  /**
   * Validate internal navigation stack against browser history state
   * Ensures consistency on cold boots and restores from stored state if needed
   */
  validateStack() {
    try {
      const browserState = window.history.state;
      
      // If no browser state, fresh initialization
      if (!browserState?.stackIndex === undefined) {
        return true;
      }

      // Validate stack consistency
      const storedStackIndex = browserState.stackIndex;
      const storedStack = browserState.stack;

      // Check if stored state is valid
      if (!Array.isArray(storedStack) || typeof storedStackIndex !== 'number') {
        console.warn('[NavigationStackManager] Invalid browser state structure');
        return false;
      }

      // Restore from browser state if internal stack is empty
      if (this.stack.length === 0 || this.currentIndex === -1) {
        this.stack = storedStack;
        this.currentIndex = storedStackIndex;
        console.log('[NavigationStackManager] Restored stack from browser state');
        return true;
      }

      // Verify current indices match
      if (this.currentIndex !== storedStackIndex) {
        console.warn('[NavigationStackManager] Stack index mismatch, synchronizing...');
        this.currentIndex = storedStackIndex;
      }

      return true;
    } catch (error) {
      console.error('[NavigationStackManager] Validation error:', error);
      return false;
    }
  }

  /**
   * Force-reset navigation stack and clear all history
   * Used when validation fails or recovery is needed
   */
  resetStack() {
    this.stack = ['/Home'];
    this.currentIndex = 0;
    this.isNavigating = false;
    this.syncBrowserHistory();
    this.notifyListeners();
    console.log('[NavigationStackManager] Stack reset to default');
  }
}

export const navigationStackManager = new NavigationStackManager();