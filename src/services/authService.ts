import { api } from './api';
import { User, EmergencyContact, Journey } from '../types';

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface MeResponse {
  user: User;
  primaryContact: EmergencyContact | null;
  totalContacts: number;
  activeJourney: Journey | null;
}

export const authService = {
  async register(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
  }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/login', data);
    return res.data;
  },

  async getMe(): Promise<MeResponse> {
    const res = await api.get<MeResponse>('/api/auth/me');
    return res.data;
  },

  async updateProfile(data: { name?: string; phone?: string }): Promise<{ message: string; user: User }> {
    const res = await api.put<{ message: string; user: User }>('/api/auth/profile', data);
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } finally {
      localStorage.removeItem('safewalk_token');
      localStorage.removeItem('safewalk_user');
    }
  },
};
