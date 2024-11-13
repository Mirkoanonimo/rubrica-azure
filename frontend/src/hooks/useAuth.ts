import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LoginCredentials, RegisterCredentials, AuthResponse } from '../types/auth';
import useToast from './useToast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { axiosInstance } from '../api/axios-instance';

export const useAuth = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Query per ottenere i dati dell'utente corrente
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get<AuthResponse>('/auth/me');
        return response.data.user;
      } catch (error) {
        return null;
      }
    }
  });

  // Mutation per il login
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await axiosInstance.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      queryClient.setQueryData(['user'], data.user);
      showToast('Login effettuato con successo', 'success');
      navigate('/contacts');
    },
    onError: (error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 401) {
        showToast('Credenziali non valide', 'error');
      } else {
        showToast('Errore durante il login', 'error');
      }
    }
  });

  // Mutation per la registrazione
  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterCredentials) => {
      const response = await axiosInstance.post<AuthResponse>('/auth/register', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      queryClient.setQueryData(['user'], data.user);
      showToast('Registrazione effettuata con successo', 'success');
      navigate('/contacts');
    },
    onError: (error: unknown) => {
      showToast('Errore durante la registrazione', 'error');
      console.error('Registration error:', error);
    }
  });

  // Funzione di logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    queryClient.setQueryData(['user'], null);
    queryClient.clear();
    showToast('Logout effettuato con successo', 'success');
    navigate('/login');
  }, [queryClient, navigate, showToast]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending
  };
};

export default useAuth;