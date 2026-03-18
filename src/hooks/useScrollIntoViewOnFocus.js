import { useEffect, useRef } from 'react';

/**
 * Hook that automatically scrolls focused form inputs into view
 * Prevents keyboard obscuration on mobile devices
 */
export function useScrollIntoViewOnFocus() {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleFocus = (e) => {
      const target = e.target;
      
      // Only handle form inputs
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      // Scroll input into view with smooth behavior
      requestAnimationFrame(() => {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
    };

    const container = containerRef.current;
    container.addEventListener('focus', handleFocus, true);
    
    return () => {
      container.removeEventListener('focus', handleFocus, true);
    };
  }, []);

  return containerRef;
}