import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Global animation state context to prevent hardware back-button navigation
 * during Framer Motion page transitions
 */
const AnimationStateContext = createContext();

export function AnimationStateProvider({ children }) {
  const [isAnimating, setIsAnimating] = useState(false);

  const startAnimation = useCallback(() => {
    setIsAnimating(true);
  }, []);

  const endAnimation = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const value = {
    isAnimating,
    startAnimation,
    endAnimation,
  };

  return (
    <AnimationStateContext.Provider value={value}>
      {children}
    </AnimationStateContext.Provider>
  );
}

/**
 * Hook to access animation state and control methods
 */
export function useAnimationState() {
  const context = useContext(AnimationStateContext);
  if (!context) {
    throw new Error('useAnimationState must be used within AnimationStateProvider');
  }
  return context;
}