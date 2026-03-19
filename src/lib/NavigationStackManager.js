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
    this.isSyncing = false; // Lock to prevent race conditions during sync
    this.isPopstateHandling = false; // Prevent recursive popstate handling
    this.listeners = [];
    this.backButtonListeners = [];
    this.popstateHandler = null;
  }

  /**
   * Initialize popstate event listener for browser back button synchronization
   * Runs once on app startup to ensure history navigation is properly tracked
   */
  initializePopstateListener() {
    if (this.popstateHandler) {
      console.warn('[NavigationStackManager] Popstate listener already initialized');
      return;
    }

    this.popstateHandler = (event) => {
      // AGGRESSIVE: Prevent recursive handling AND browser back interference
      if (this.isPopstateHandling) {
        console.debug('[NavigationStackManager] Popstate blocked - recursive handling prevented');
        return;
      }

      try {
        this.isPopstateHandling = true;

        const browserState = event.state;
        if (browserState?.stackIndex !== undefined) {
          console.log('[NavigationStackManager] Popstate: syncing stack from browser state, index:', browserState.stackIndex);
          this.currentIndex = browserState.stackIndex;
          this.stack = browserState.stack || this.stack;
          this.notifyListeners();
        } else {
          console.warn('[NavigationStackManager] Popstate fired but no valid browser state, preventing desync');
          // Force resync to prevent browser from controlling navigation
          this.syncBrowserHistory();
        }
      } catch (error) {
        console.warn('[NavigationStackManager] Popstate handler error:', error);
      } finally {
        this.isPopstateHandling = false;
      }
    };

    // Use capture phase for earliest possible interception
    window.addEventListener('popstate', this.popstateHandler, true);
    
    // Do not intercept pushState/replaceState — React Router needs them for tab navigation.

    console.log('[NavigationStackManager] Popstate listener initialized with aggressive interception');
  }

  /**
   * Clean up popstate listener
   */
  destroyPopstateListener() {
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
      console.log('[NavigationStackManager] Popstate listener destroyed');
    }
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
   * Handles network interruptions by falling back to home page on error
   */
  initializeFromCurrentLocation(currentPath) {
    try {
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
    } catch (error) {
      // Network or initialization error: fallback to home page
      console.warn('[NavigationStackManager] Deep-link initialization error, falling back to home:', error);
      this.stack = ['/Home'];
      this.currentIndex = 0;
      this.syncBrowserHistory();
      this.notifyListeners();
    }
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
   * Strips all query parameters to keep URL clean and prevent persistent state
   * Uses atomic locking to prevent race conditions between async operations
   * Critical for deep links and avoiding history desync on back button
   */
  syncBrowserHistory() {
    // Prevent concurrent syncs causing race conditions
    if (this.isSyncing) {
      console.warn('[NavigationStackManager] Sync already in progress, skipping to prevent race condition');
      return;
    }

    try {
      this.isSyncing = true;

      const currentPath = this.getCurrentPath();
      if (!currentPath) {
        this.isSyncing = false;
        return;
      }

      // Strip query parameters to prevent persistent state in address bar
      const cleanPath = currentPath.split('?')[0];

      const state = {
        stackIndex: this.currentIndex,
        stackLength: this.stack.length,
        timestamp: Date.now(),
        stack: [...this.stack], // Embed full stack for recovery
      };

      // Use replaceState to maintain clean history without creating entries
      // This is synchronous, so no race condition after this point
      window.history.replaceState(state, '', cleanPath);

      // Verify sync completed successfully
      if (window.history.state?.stackIndex !== this.currentIndex) {
        console.warn('[NavigationStackManager] Sync verification failed, attempting retry');
        // Retry once with a fresh state
        window.history.replaceState(state, '', cleanPath);
      }
    } catch (error) {
      console.warn('[NavigationStackManager] Failed to sync browser history:', error);
    } finally {
      this.isSyncing = false;
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
   * Robust Android back-button handler with AGGRESSIVE event propagation control
   * Completely intercepts native browser back-action in favor of internal stack manager
   * Validates stack sync with browser history before navigation
   * Prevents all default back behaviors to ensure consistent Android WebView behavior
   */
  handleAndroidBackButton(event) {
    // AGGRESSIVE: Prevent ALL default back behaviors
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    console.log('[NavigationStackManager] Android back button intercepted, current index:', this.currentIndex, 'stack length:', this.stack.length);

    // Validate stack consistency before handling back press
    const browserState = window.history.state;
    if (browserState?.stackIndex !== undefined && browserState.stackIndex !== this.currentIndex) {
      console.warn('[NavigationStackManager] Android back: detected stack desync, synchronizing...');
      this.currentIndex = browserState.stackIndex;
    }

    // Only navigate back if possible, otherwise stay in app (don't exit)
    if (this.canGoBack()) {
      this.pop();
      console.log('[NavigationStackManager] Back navigation executed, new index:', this.currentIndex);
    } else {
      console.log('[NavigationStackManager] At root of stack, preventing app exit');
      // Don't exit app - stay at root
    }
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
   * Critical for Android WebView: confirms history index matches internal stack during back navigations
   */
  validateStack() {
    try {
      const browserState = window.history.state;
      
      // If no browser state, fresh initialization
      if (browserState?.stackIndex === undefined) {
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

      // Verify current indices match (critical for Android WebView)
      if (this.currentIndex !== storedStackIndex) {
        console.warn('[NavigationStackManager] Stack index mismatch detected (internal:', this.currentIndex, 'browser:', storedStackIndex, ') - synchronizing...');
        this.currentIndex = storedStackIndex;
        this.notifyListeners();
      }

      // Final validation: ensure stack length is consistent
      if (this.stack.length !== storedStack.length) {
        console.warn('[NavigationStackManager] Stack length mismatch (internal:', this.stack.length, 'browser:', storedStack.length, ') - resyncing...');
        this.stack = storedStack;
      }

      return true;
    } catch (error) {
      console.error('[NavigationStackManager] Validation error:', error);
      return false;
    }
  }

  /**
   * Android WebView validation: confirms history sync during back navigations
   * Used to debug and validate navigation consistency on mobile platforms
   */
  validateAndroidWebViewSync() {
    const browserState = window.history.state;
    const isInSync = browserState?.stackIndex === this.currentIndex;
    const stackDepth = this.stack.length;
    const historyIndex = browserState?.stackIndex ?? -1;

    const report = {
      isInSync,
      internalIndex: this.currentIndex,
      browserIndex: historyIndex,
      stackDepth,
      currentPath: this.getCurrentPath(),
      stack: this.getStack(),
    };

    console.log('[NavigationStackManager] Android WebView Sync Report:', {
      ...report,
      status: isInSync ? '✅ IN_SYNC' : '⚠️ DESYNCHRONIZED',
    });

    return report;
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