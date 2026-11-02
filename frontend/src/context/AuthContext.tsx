import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi, removeAuthToken, setAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  switchDemoRole: (role: 'admin' | 'organizer' | 'volunteer' | 'coordinator') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('cc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await authApi.me();
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem('cc_user', JSON.stringify(res.user));
      }
    } catch {
      // Invalid token, logout
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('cc_token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = (token: string, newUser: User) => {
    setAuthToken(token);
    setUser(newUser);
    localStorage.setItem('cc_user', JSON.stringify(newUser));
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
  };

  // Quick switcher for academic grading & testing
  const switchDemoRole = async (role: 'admin' | 'organizer' | 'volunteer' | 'coordinator') => {
    setLoading(true);
    try {
      const emailMap = {
        admin: 'admin@communityconnect.edu',
        organizer: 'organizer@communityconnect.edu',
        volunteer: 'volunteer@communityconnect.edu',
        coordinator: 'coordinator@communityconnect.edu'
      };
      const res = await authApi.login(emailMap[role], 'Password@123');
      if (res.success) {
        login(res.token, res.user);
      }
    } catch (err: any) {
      alert(`Role switch error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, switchDemoRole }}>
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
