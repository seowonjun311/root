import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
    
    // 앱이 백그라운드에서 복귀할 때 세션 재확인
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[AuthContext] App resumed from background, rechecking auth');
        checkAppState(true); // silent: 로딩 스피너 없이 재확인
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkAppState = async (silent = false) => {
    try {
      if (!silent) setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // Try to authenticate the user with base44 SDK (2s timeout)
      try {
        const currentUser = await Promise.race([
          base44.auth.me(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('auth timeout')), 2000))
        ]);
        console.log('[AuthContext] User authenticated, redirecting to home');
        setUser(currentUser);
        setIsAuthenticated(true);
        setAppPublicSettings({ id: 'app' });
        setIsLoadingAuth(false);
      } catch (authError) {
        // Auth failed
        console.log('[AuthContext] Auth check failed, showing onboarding');
        setUser(null);
        setIsAuthenticated(false);
        setAppPublicSettings({ id: 'app' });
        setIsLoadingAuth(false);
        
        if (authError?.status === 401 || authError?.status === 403) {
          setAuthError({
            type: 'auth_required',
            message: 'Authentication required'
          });
        } else {
          setAuthError({
            type: 'unknown',
            message: authError?.message || 'Failed to initialize app'
          });
        }
      }
      setIsLoadingPublicSettings(false);
    } catch (error) {
      console.error('[AuthContext] Unexpected error in checkAppState:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };



  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    
    if (shouldRedirect) {
      // Use the SDK's logout method which handles token cleanup and redirect
      base44.auth.logout(window.location.href);
    } else {
      // Just remove the token without redirect
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Use the SDK's redirectToLogin method
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};