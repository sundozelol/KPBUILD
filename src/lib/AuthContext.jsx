import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiClient } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = apiClient.getToken();
    if (!token) {
      setIsLoadingAuth(false);
      return;
    }
    try {
      const me = await apiClient.auth.me();
      setUser(me);
      setIsAuthenticated(true);
    } catch {
      apiClient.clearToken();
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const data = await apiClient.auth.login(email, password);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const register = async (email, password, name, inviteCode) => {
    const data = await apiClient.auth.register(email, password, name, inviteCode);
    setUser(data.user);
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    apiClient.auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      // Compatibility with old base44 shape
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      login,
      register,
      logout,
      checkAppState: checkAuth,
      navigateToLogin: () => { window.location.href = '/login'; },
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
