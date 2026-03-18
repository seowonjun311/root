import React from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

/**
 * Button component with integrated haptic feedback
 * Provides tactile feedback for user interactions on Android devices
 * 
 * Usage:
 *   <HapticButton onClick={handleSubmit}>Submit</HapticButton>
 *   <HapticButton variant="success" onClick={handleConfirm}>Confirm</HapticButton>
 */
export default function HapticButton({
  children,
  onClick,
  disabled = false,
  variant = 'default', // 'default', 'success', 'error', 'warning'
  hapticFeedback = 'light', // 'light', 'medium', 'heavy', 'success', 'error', 'warning'
  className = '',
  ...props
}) {
  const haptic = useHapticFeedback();

  const handleClick = (e) => {
    if (!disabled) {
      // Trigger haptic feedback based on variant
      switch (hapticFeedback) {
        case 'light':
          haptic.onPress();
          break;
        case 'medium':
          haptic.onMedium();
          break;
        case 'heavy':
          haptic.onHeavy();
          break;
        case 'success':
          haptic.onSuccess();
          break;
        case 'error':
          haptic.onError();
          break;
        case 'warning':
          haptic.onWarning();
          break;
        default:
          haptic.onPress();
      }
    }

    // Call user's onClick handler
    onClick?.(e);
  };

  // Base button styles
  const baseClass = 'h-10 px-4 rounded-lg font-semibold transition-all active:scale-95';

  // Variant styles
  const variantClass = {
    default: 'bg-primary hover:bg-primary/90 text-primary-foreground',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    error: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white',
  }[variant] || 'bg-primary hover:bg-primary/90 text-primary-foreground';

  const disabledClass = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${disabledClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}