import { useCallback } from 'react';
import { hapticFeedback } from '@/lib/HapticFeedback';

export function useHapticFeedback() {
  const triggerHaptic = React.useCallback((type, intensity) => {
    if (!hapticFeedback) return;

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

  const onPress   = React.useCallback(() => triggerHaptic('light'),   [triggerHaptic]);
  const onSuccess = React.useCallback(() => triggerHaptic('success'), [triggerHaptic]);
  const onError   = React.useCallback(() => triggerHaptic('error'),   [triggerHaptic]);
  const onWarning = React.useCallback(() => triggerHaptic('warning'), [triggerHaptic]);
  const onMedium  = React.useCallback(() => triggerHaptic('medium'),  [triggerHaptic]);
  const onHeavy   = React.useCallback(() => triggerHaptic('heavy'),   [triggerHaptic]);

  return {
    triggerHaptic,
    onPress,
    onSuccess,
    onError,
    onWarning,
    onMedium,
    onHeavy,
    isSupported: hapticFeedback?.isSupported || false,
  };
}