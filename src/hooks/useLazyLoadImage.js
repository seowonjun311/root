import { useEffect, useRef, useState } from 'react';

/**
 * Hook for intersection observer-based lazy loading of images with aspect-ratio preservation
 * Prevents layout shifts during image loading on low-end devices
 */
export function useLazyLoadImage(aspectRatio = '1', options = {}) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Don't set up observer if image already visible or loaded
    if (isLoaded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(containerRef.current);
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before visible
        threshold: 0.01,
        ...options,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [isLoaded, options]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Aspect ratio container to prevent layout shift
  const AspectRatioContainer = ({ children }) => (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        paddingBottom: `calc(100% / ${aspectRatio})`,
        background: isLoaded ? 'transparent' : '#f0f0f0',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
        }}
      >
        {children}
      </div>
    </div>
  );

  return {
    containerRef,
    imgRef,
    isVisible,
    isLoaded,
    onLoad: handleLoad,
    AspectRatioContainer,
  };
}