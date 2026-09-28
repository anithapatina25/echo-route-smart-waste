import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('echo_route_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount if token exists
  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getCurrentUser();
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          localStorage.removeItem('echo_route_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Session verification error:', err.message);
        localStorage.removeItem('echo_route_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [token]);

  const login = useCallback(async (email, password, portalRole) => {
    const response = await authApi.login(email, password, portalRole);
    if (response.success && response.data) {
      const { token: receivedToken, user: receivedUser } = response.data;
      localStorage.setItem('echo_route_token', receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    }
    throw new Error(response.message || 'Login failed');
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) {
        await authApi.logout().catch(() => {});
      }
    } finally {
      localStorage.removeItem('echo_route_token');
      setToken(null);
      setUser(null);
    }
  }, [token]);

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
