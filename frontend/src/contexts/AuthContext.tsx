import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import axiosInstance from '@/api/axios-instance';
import type { 
  User, 
  AuthContextType, 
  LoginCredentials, 
  RegisterCredentials,
  AuthResponse 
} from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await axiosInstance.get<AuthResponse>('/auth/me');
        setUser(response.data.user);
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      setUser(user);
      navigate('/contacts');
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.detail || 'Login failed');
      }
      throw error;
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      const response = await axiosInstance.post<AuthResponse>('/auth/register', credentials);
      const { access_token, user } = response.data;
      
      localStorage.setItem('token', access_token);
      setUser(user);
      navigate('/contacts');
    } catch (error) {
      if (error instanceof AxiosError) {
        throw new Error(error.response?.data?.detail || 'Registration failed');
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/auth/login');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}