import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Context for managing per-tab navigation stacks and scroll positions
 * Ensures each tab maintains independent history and scroll state
 */
const TabNavigationContext = createContext();

export function TabNavigationProvider({ children }) {
  // Per-tab state: { [tabPath]: { navIndex, scrollPosition } }
  const [tabStates, setTabStates] = useState(() => {
    try {
      const saved = sessionStorage.getItem('tabNavigationStates');
      return saved ? JSON.parse(saved) : {
        '/Home': { navIndex: 0, scrollPosition: 0 },
        '/Records': { navIndex: 0, scrollPosition: 0 },
        '/Badges': { navIndex: 0, scrollPosition: 0 },
        '/AppSettings': { navIndex: 0, scrollPosition: 0 },
      };
    } catch {
      return {
        '/Home': { navIndex: 0, scrollPosition: 0 },
        '/Records': { navIndex: 0, scrollPosition: 0 },
        '/Badges': { navIndex: 0, scrollPosition: 0 },
        '/AppSettings': { navIndex: 0, scrollPosition: 0 },
      };
    }
  });

  // Persist to session storage whenever state changes
  React.useEffect(() => {
    sessionStorage.setItem('tabNavigationStates', JSON.stringify(tabStates));
  }, [tabStates]);

  const updateTabState = useCallback((tabPath, updates) => {
    setTabStates(prev => ({
      ...prev,
      [tabPath]: {
        ...prev[tabPath],
        ...updates,
      },
    }));
  }, []);

  const getTabState = useCallback((tabPath) => {
    return tabStates[tabPath] || { navIndex: 0, scrollPosition: 0 };
  }, [tabStates]);

  const resetTabState = useCallback((tabPath) => {
    updateTabState(tabPath, { navIndex: 0, scrollPosition: 0 });
  }, [updateTabState]);

  const value = {
    tabStates,
    updateTabState,
    getTabState,
    resetTabState,
  };

  return (
    <TabNavigationContext.Provider value={value}>
      {children}
    </TabNavigationContext.Provider>
  );
}

export function useTabNavigation() {
  const context = useContext(TabNavigationContext);
  if (!context) {
    throw new Error('useTabNavigation must be used within TabNavigationProvider');
  }
  return context;
}