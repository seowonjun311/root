import { useEffect, useRef, useState } from 'react';

/**
 * Hook for intersection observer-based lazy loading of images
 * Optimizes scroll performance on low-end devices
 */
export function useLazyLoadImage(options = {}) {
  const ref = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    // Don't set up observer if image already visible or loaded
    if (isLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(ref.current);
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before visible
        threshold: 0.01,
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [isLoaded, options]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  return {
    ref,
    isVisible,
    isLoaded,
    onLoad: handleLoad,
  };
}