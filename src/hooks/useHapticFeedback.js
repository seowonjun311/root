import React, { useCallback } from 'react';
import { hapticFeedback } from '@/lib/HapticFeedback';

/**
 * Hook to integrate haptic feedback into React components
 * 
 * Usage:
 *   const { triggerHaptic } = useHapticFeedback();
 *   triggerHaptic('impact', 'light');    // Light tap
 *   triggerHaptic('impact', 'medium');   // Medium vibration
 *   triggerHaptic('impact', 'heavy');    // Heavy impact
 *   triggerHaptic('success');             // Success pattern
 *   triggerHaptic('error');               // Error pattern
 */
export function useHapticFeedback() {
  const triggerHaptic = useCallback((type, intensity) => {
    if (intensity === 'light' || type === 'light') {
      hapticFeedback.light();
    } else if (intensity === 'medium' || type === 'medium') {
      hapticFeedback.medium();
    } else if (intensity === 'heavy' || type === 'heavy') {
      hapticFeedback.heavy();
    } else if (type === 'success') {
      hapticFeedback.success();
    } else if (type === 'error') {
      hapticFeedback.error();
    } else if (type === 'warning') {
      hapticFeedback.warning();
    }
  }, []);

  // Legacy API support
  const onPress = useCallback(() => triggerHaptic('light'), [triggerHaptic]);
  const onSuccess = useCallback(() => triggerHaptic('success'), [triggerHaptic]);
  const onError = useCallback(() => triggerHaptic('error'), [triggerHaptic]);
  const onWarning = useCallback(() => triggerHaptic('warning'), [triggerHaptic]);
  const onMedium = useCallback(() => triggerHaptic('medium'), [triggerHaptic]);
  const onHeavy = useCallback(() => triggerHaptic('heavy'), [triggerHaptic]);

  return {
    triggerHaptic,
    onPress,
    onSuccess,
    onError,
    onWarning,
    onMedium,
    onHeavy,
    isSupported: hapticFeedback.isSupported,
  };
}