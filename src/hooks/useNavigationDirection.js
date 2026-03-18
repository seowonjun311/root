import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Stack of visited paths to infer push vs pop direction
const historyStack = [];

export function useNavigationDirection() {
  const location = useLocation();
  const directionRef = useRef('push');

  useEffect(() => {
    const currentPath = location.pathname;
    const prevIndex = historyStack.lastIndexOf(currentPath);

    if (prevIndex !== -1 && prevIndex === historyStack.length - 2) {
      // Navigating back to a page that was previously in the stack
      directionRef.current = 'pop';
      historyStack.splice(prevIndex + 1); // trim forward stack
    } else {
      directionRef.current = 'push';
      historyStack.push(currentPath);
    }
  }, [location.pathname]);

  return directionRef.current;
}