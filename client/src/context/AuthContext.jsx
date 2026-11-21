import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('bidx_token') || null);
  const [loading, setLoading] = useState(true);
  const [demoUsers, setDemoUsers] = useState([]);

  // Fetch current user if token exists
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.auth.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Failed to restore session:', err.message);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token]);

  // Load demo users list
  useEffect(() => {
    async function loadDemoAccounts() {
      try {
        const res = await api.auth.getDemoUsers();
        if (res.success && res.users) {
          setDemoUsers(res.users);
        }
      } catch (err) {
        console.warn('Could not load demo accounts:', err.message);
      }
    }
    loadDemoAccounts();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.success) {
      localStorage.setItem('bidx_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password, role = 'user') => {
    const res = await api.auth.register({ name, email, password, role });
    if (res.success) {
      localStorage.setItem('bidx_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const quickDemoLogin = async (demoUser) => {
    return await login(demoUser.email, 'password123');
  };

  const logout = () => {
    localStorage.removeItem('bidx_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await api.auth.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        }
      } catch (e) {}
    }
  };

  const value = {
    user,
    token,
    loading,
    demoUsers,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    quickDemoLogin,
    logout,
    refreshUser,
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
