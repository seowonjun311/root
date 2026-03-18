import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { navigationStackManager } from './NavigationStackManager';

const NavigationContext = createContext();

export function NavigationProvider({ children }) {
  let location, navigate;
  try {
    location = useLocation();
    navigate = useNavigate();
  } catch (e) {
    // Router context not available yet, return fallback
    return children;
  }
  const [, setManagerState] = useState(0);

  // Initialize navigation stack and sync with router (run once on mount)
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized && navigationStackManager.getStack().length === 0) {
      // Perform robust deep-link initialization
      navigationStackManager.initializeFromCurrentLocation(location.pathname);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Sync location changes with navigation manager (after initialization)
  useEffect(() => {
    if (!isInitialized) return;

    const currentPath = navigationStackManager.getCurrentPath();
    const newPath = location.pathname;

    if (currentPath !== newPath) {
      const stack = navigationStackManager.getStack();
      if (stack.includes(newPath) && stack.indexOf(newPath) < stack.length - 1) {
        navigationStackManager.pop();
      } else {
        navigationStackManager.push(newPath);
      }
    }
  }, [location.pathname, isInitialized]);

  // Subscribe to manager updates and sync URL when navigation manager changes
  useEffect(() => {
    const unsubscribe = navigationStackManager.subscribe(() => {
      const managerPath = navigationStackManager.getCurrentPath();
      if (managerPath && managerPath !== location.pathname) {
        navigate(managerPath, { replace: true });
      }
      setManagerState(prev => prev + 1);
    });
    return unsubscribe;
  }, [navigate, location.pathname]);

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