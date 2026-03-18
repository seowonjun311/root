import React, { useState, useCallback } from 'react';

/**
 * Standardized pull-to-refresh hook.
 * Returns { pullProgress, onTouchStart } to attach to the scroll container.
 * onRefresh: async function to call when pulled far enough.
 */
export function usePullToRefresh(onRefresh) {
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onTouchStart = useCallback((e) => {
    if (!e.touches || window.scrollY !== 0) return;
    if (e.target.closest('[data-scrollable]')) return;

    const startY = e.touches[0].clientY;
    let triggered = false;

    const handleMove = (moveE) => {
      if (!moveE.touches) return;
      const distance = moveE.touches[0].clientY - startY;
      if (distance <= 0) return;
      moveE.preventDefault?.();
      const progress = Math.min(distance / 80, 1);
      setPullProgress(progress);
      if (progress >= 1 && !isRefreshing && !triggered) {
        triggered = true;
        setIsRefreshing(true);
        Promise.resolve(onRefresh()).finally(() => {
          setIsRefreshing(false);
          setPullProgress(0);
        });
      }
    };

    const handleEnd = () => {
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      if (!triggered) setPullProgress(0);
    };

    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }, [onRefresh, isRefreshing]);

  return { pullProgress, isRefreshing, onTouchStart };
}