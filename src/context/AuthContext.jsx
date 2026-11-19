import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('regrow_admin_token'));
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('regrow_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!adminToken) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.getAdminMe();
        if (res && res.success) {
          setAdminUser(res.admin);
        } else {
          logout();
        }
      } catch (err) {
        // Token invalid or expired
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, [adminToken]);

  const login = async (username, password) => {
    const res = await api.adminLogin({ username, password });
    if (res && res.success && res.token) {
      localStorage.setItem('regrow_admin_token', res.token);
      localStorage.setItem('regrow_admin_user', JSON.stringify(res.admin));
      setAdminToken(res.token);
      setAdminUser(res.admin);
      return { success: true };
    }
    return { success: false, message: res?.message || 'Login failed' };
  };

  const logout = () => {
    localStorage.removeItem('regrow_admin_token');
    localStorage.removeItem('regrow_admin_user');
    setAdminToken(null);
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        adminToken,
        adminUser,
        isAuthenticated: !!adminToken,
        isLoading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
