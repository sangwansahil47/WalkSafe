import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, EmergencyContact, Journey } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  primaryContact: EmergencyContact | null;
  activeJourney: Journey | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrData: string | { email: string; password: string }, password?: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  setActiveJourney: (journey: Journey | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('safewalk_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [primaryContact, setPrimaryContact] = useState<EmergencyContact | null>(null);
  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('safewalk_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAuth = async () => {
    const storedToken = localStorage.getItem('safewalk_token');
    if (!storedToken) {
      setUser(null);
      setPrimaryContact(null);
      setActiveJourney(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await authService.getMe();
      setUser(data.user);
      setPrimaryContact(data.primaryContact);
      setActiveJourney(data.activeJourney);
      localStorage.setItem('safewalk_user', JSON.stringify(data.user));
    } catch (err) {
      console.warn('Failed to verify session token:', err);
      localStorage.removeItem('safewalk_token');
      localStorage.removeItem('safewalk_user');
      setUser(null);
      setToken(null);
      setPrimaryContact(null);
      setActiveJourney(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  const login = async (emailOrData: string | { email: string; password: string }, password?: string) => {
    const payload = typeof emailOrData === 'string' ? { email: emailOrData, password: password || '' } : emailOrData;
    const res = await authService.login(payload);
    localStorage.setItem('safewalk_token', res.token);
    localStorage.setItem('safewalk_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    await refreshAuth();
  };

  const register = async (data: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword?: string;
  }) => {
    const res = await authService.register({
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      password: data.password,
      confirmPassword: data.confirmPassword || data.password,
    });
    localStorage.setItem('safewalk_token', res.token);
    localStorage.setItem('safewalk_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    await refreshAuth();
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    setPrimaryContact(null);
    setActiveJourney(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        primaryContact,
        activeJourney,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshAuth,
        setActiveJourney,
      }}
    >
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
