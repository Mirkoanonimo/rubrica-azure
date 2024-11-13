// src/api/auth.ts
import { axiosInstance } from './axios-instance';
import type {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  PasswordReset,
  PasswordUpdate,
} from '@/types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Qui potresti aggiungere una chiamata API per il logout se necessario
    localStorage.removeItem('token');
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await axiosInstance.get<AuthResponse>('/auth/me');
    return response.data;
  },

  requestPasswordReset: async (email: PasswordReset): Promise<void> => {
    await axiosInstance.post('/auth/password-reset', email);
  },

  updatePassword: async (passwordData: PasswordUpdate): Promise<void> => {
    await axiosInstance.put('/auth/password', passwordData);
  },
};