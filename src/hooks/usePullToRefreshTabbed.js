import React, { useRef, useState, useEffect } from 'react';

/**
 * Standardized Pull-to-Refresh hook for mobile tabs
 * Handles gesture detection and triggers refresh callback
 */
export function usePullToRefreshTabbed(onRefresh) {
  const [pullProgress, setPullProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollElementRef = useRef(null);

  const onTouchStart = (e) => {
    scrollElementRef.current = e.currentTarget;
    const target = e.currentTarget;
    
    // Only start if at the top of the scroll container
    if (target.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    } else {
      touchStartY.current = 0;
    }
  };

  const onTouchMove = (e) => {
    if (!touchStartY.current) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;

    if (diff > 0) {
      e.preventDefault();
      const progress = Math.min(1, diff / 80); // 80px threshold
      setPullProgress(progress);
    }
  };

  const onTouchEnd = async () => {
    if (pullProgress >= 0.8 && !isRefreshing) {
      setIsRefreshing(true);
      setPullProgress(1);

      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullProgress(0);
        touchStartY.current = 0;
      }
    } else {
      setPullProgress(0);
      touchStartY.current = 0;
    }
  };

  useEffect(() => {
    const element = scrollElementRef.current;
    if (!element) return;

    element.addEventListener('touchmove', onTouchMove, { passive: false });
    element.addEventListener('touchend', onTouchEnd);

    return () => {
      element.removeEventListener('touchmove', onTouchMove);
      element.removeEventListener('touchend', onTouchEnd);
    };
  }, [pullProgress, isRefreshing, onRefresh]);

  return {
    pullProgress,
    isRefreshing,
    onTouchStart,
  };
}