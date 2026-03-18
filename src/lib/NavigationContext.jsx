import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { navigationStackManager } from './NavigationStackManager';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  const location = useLocation();
  const [, setManagerState] = useState(0);

  useEffect(() => {
    // Initialize on first load
    if (navigationStackManager.getStack().length === 0) {
      // Detect deep link on initial load
      navigationStackManager.initializeFromCurrentLocation(location.pathname);
    } else {
      const currentPath = navigationStackManager.getCurrentPath();
      const newPath = location.pathname;

      if (currentPath !== newPath) {
        // Check if path exists in stack (going back)
        const stack = navigationStackManager.getStack();
        if (stack.includes(newPath) && stack.indexOf(newPath) < stack.length - 1) {
          navigationStackManager.pop();
        } else {
          navigationStackManager.push(newPath);
        }
      }
    }
  }, [location.pathname]);

  // Subscribe to manager updates
  useEffect(() => {
    const unsubscribe = navigationStackManager.subscribe(() => {
      setManagerState(prev => prev + 1);
    });
    return unsubscribe;
  }, []);

  const value = {
    direction: navigationStackManager.getDirection(),
    stack: navigationStackManager.getStack(),
    canGoBack: navigationStackManager.canGoBack(),
    manager: navigationStackManager,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigationDirection() {
  const context = useContext(NavigationContext);
  return context?.direction || 'push';
}

export function useNavigationStack() {
  const context = useContext(NavigationContext);
  return context?.stack || [];
}

export function useCanGoBack() {
  const context = useContext(NavigationContext);
  return context?.canGoBack || false;
}