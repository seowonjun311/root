import React, { createContext, useContext, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const location = useLocation();
  const historyStackRef = useRef([location.pathname]);
  const directionRef = useRef('push');

  useEffect(() => {
    const currentPath = location.pathname;
    const stack = historyStackRef.current;
    const lastPath = stack[stack.length - 1];

    if (currentPath === lastPath) return;

    // Check if we're going back
    if (stack.includes(currentPath) && stack.indexOf(currentPath) < stack.length - 1) {
      directionRef.current = 'pop';
      // Remove everything after this path
      const index = stack.indexOf(currentPath);
      historyStackRef.current = stack.slice(0, index + 1);
    } else {
      // Going forward
      directionRef.current = 'push';
      historyStackRef.current = [...stack, currentPath];
    }
  }, [location.pathname]);

  const value = {
    direction: directionRef.current,
    stack: historyStackRef.current,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationDirection() {
  const context = useContext(NavigationContext);
  if (!context) {
    return 'push';
  }
  return context.direction;
}

export function useNavigationStack() {
  const context = useContext(NavigationContext);
  if (!context) {
    return [];
  }
  return context.stack;
}