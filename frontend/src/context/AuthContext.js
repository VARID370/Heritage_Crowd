'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('hc_token');
        const storedUser = localStorage.getItem('hc_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Verify token freshness with backend
          try {
            const res = await api.get('/auth/me');
            if (res.success && res.data.user) {
              setUser(res.data.user);
              localStorage.setItem('hc_user', JSON.stringify(res.data.user));
            }
          } catch (err) {
            console.warn('[AuthContext] Session verification failed:', err.message);
            // If token expired, clear session
            if (err.status === 401) {
              logout();
            }
          }
        }
      } catch (e) {
        console.error('Failed to parse stored user session', e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('hc_token', newToken);
      localStorage.setItem('hc_user', JSON.stringify(newUser));
      return newUser;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res;
  };

  const verifyEmailWithToken = async (tokenString) => {
    const res = await api.post('/auth/verify-email', { token: tokenString });
    if (res.success && res.data) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('hc_token', newToken);
      localStorage.setItem('hc_user', JSON.stringify(newUser));
      return newUser;
    }
    throw new Error(res.message || 'Verification failed');
  };

  const verifyOtpCode = async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    if (res.success && res.data) {
      const { token: newToken, user: newUser } = res.data;
      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('hc_token', newToken);
      localStorage.setItem('hc_user', JSON.stringify(newUser));
      return newUser;
    }
    throw new Error(res.message || 'Verification failed');
  };

  const resendVerificationEmail = async (email) => {
    const res = await api.post('/auth/resend-verification', { email });
    return res;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('hc_token');
      localStorage.removeItem('hc_user');
    }
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const isVerified = !!user?.isVerified;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin,
        isStaff,
        isVerified,
        isLoading,
        login,
        register,
        verifyEmailWithToken,
        verifyOtpCode,
        resendVerificationEmail,
        logout,
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
