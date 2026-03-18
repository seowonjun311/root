import { useCallback } from 'react';
import { hapticFeedback } from '@/lib/HapticFeedback';

/**
 * Hook to integrate haptic feedback into React components
 * 
 * Usage:
 *   const { onPress, onSuccess, onError } = useHapticFeedback();
 *   
 *   <button onClick={() => {
 *     try {
 *       onPress();
 *       // do work
 *       onSuccess();
 *     } catch (e) {
 *       onError();
 *     }
 *   }} />
 */
export function useHapticFeedback() {
  const onPress = useCallback(() => {
    hapticFeedback.light();
  }, []);

  const onSuccess = useCallback(() => {
    hapticFeedback.success();
  }, []);

  const onError = useCallback(() => {
    hapticFeedback.error();
  }, []);

  const onWarning = useCallback(() => {
    hapticFeedback.warning();
  }, []);

  const onMedium = useCallback(() => {
    hapticFeedback.medium();
  }, []);

  const onHeavy = useCallback(() => {
    hapticFeedback.heavy();
  }, []);

  const onCustom = useCallback((pattern) => {
    hapticFeedback.custom(pattern);
  }, []);

  return {
    onPress,
    onSuccess,
    onError,
    onWarning,
    onMedium,
    onHeavy,
    onCustom,
    isSupported: hapticFeedback.isSupported,
  };
}