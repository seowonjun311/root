/**
 * Haptic Feedback Bridge for Android WebView
 * Provides subtle haptic feedback for user interactions via native JavaScript interface
 * 
 * Usage:
 *   hapticFeedback.light();    // Light tap
 *   hapticFeedback.medium();   // Medium vibration
 *   hapticFeedback.heavy();    // Heavy impact
 *   hapticFeedback.success();  // Success pattern
 *   hapticFeedback.error();    // Error pattern
 *   hapticFeedback.warning();  // Warning pattern
 */

class HapticFeedback {
  constructor() {
    // Check if running in Android WebView context
    this.isAndroidWebView = this.detectAndroidWebView();
    this.isSupported = this.checkHapticSupport();
  }

  /**
   * Detect if app is running in Android WebView
   */
  detectAndroidWebView() {
    return (
      typeof window !== 'undefined' &&
      (window.Android !== undefined ||
        window.cordova !== undefined ||
        navigator.userAgent.toLowerCase().includes('android'))
    );
  }

  /**
   * Check if haptic feedback is supported
   */
  checkHapticSupport() {
    if (typeof window !== 'undefined') {
      // Android WebView interface
      if (window.Android?.vibrate) return true;
      // Cordova plugin
      if (window.cordova?.plugins?.vibration) return true;
      // Web Vibration API (fallback)
      if ('vibrate' in navigator) return true;
    }
    return false;
  }

  /**
   * Execute haptic feedback via available API
   * @param {number|number[]} pattern - Vibration duration(s) in milliseconds
   */
  executeVibration(pattern) {
    if (!this.isSupported) {
      console.debug('[HapticFeedback] Haptic not supported on this platform');
      return;
    }

    try {
      // Priority 1: Android WebView interface
      if (window.Android?.vibrate) {
        if (typeof pattern === 'number') {
          window.Android.vibrate(pattern);
        } else if (Array.isArray(pattern)) {
          // Convert array pattern to single duration (sum of all)
          const totalDuration = pattern.reduce((sum, val) => sum + val, 0);
          window.Android.vibrate(totalDuration);
        }
        return;
      }

      // Priority 2: Cordova plugin
      if (window.cordova?.plugins?.vibration?.vibrate) {
        window.cordova.plugins.vibration.vibrate(pattern);
        return;
      }

      // Priority 3: Web Vibration API
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
        return;
      }
    } catch (error) {
      console.warn('[HapticFeedback] Vibration failed:', error);
    }
  }

  /**
   * Light tap feedback (10ms)
   */
  light() {
    this.executeVibration(10);
  }

  /**
   * Medium vibration feedback (25ms)
   */
  medium() {
    this.executeVibration(25);
  }

  /**
   * Heavy impact feedback (50ms)
   */
  heavy() {
    this.executeVibration(50);
  }

  /**
   * Success pattern: double tap (20ms pause 10ms pause 20ms)
   */
  success() {
    this.executeVibration([20, 10, 20]);
  }

  /**
   * Error pattern: three short pulses (15ms pause 15ms pause 15ms)
   */
  error() {
    this.executeVibration([15, 15, 15, 15, 15]);
  }

  /**
   * Warning pattern: long pulse with pause (40ms pause 20ms)
   */
  warning() {
    this.executeVibration([40, 20, 20]);
  }

  /**
   * Custom vibration pattern
   * @param {number|number[]} pattern - Duration or array of durations
   */
  custom(pattern) {
    this.executeVibration(pattern);
  }

  /**
   * Get haptic feedback status
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      isAndroidWebView: this.isAndroidWebView,
      hasAndroidInterface: window.Android?.vibrate !== undefined,
      hasCordovaPlugin: window.cordova?.plugins?.vibration !== undefined,
      hasWebAPI: 'vibrate' in navigator,
    };
  }
}

// Export singleton instance
export const hapticFeedback = new HapticFeedback();