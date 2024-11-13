import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { AuthResponse } from '@/types/auth';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Estendiamo il tipo InternalAxiosRequestConfig per includere _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const axiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere il token alle richieste
axiosInstance.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire gli errori di risposta
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (error instanceof AxiosError && error.config) {
      const originalRequest = error.config as CustomAxiosRequestConfig;
      
      // Se il token è scaduto e non è già un retry
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Prova a refreshare il token
          const response = await axiosInstance.get<AuthResponse>('/auth/me');
          const { access_token } = response.data;
          
          localStorage.setItem('token', access_token);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          // Se il refresh fallisce, logout
          localStorage.removeItem('token');
          window.location.href = '/auth/login';
          return Promise.reject(refreshError);
        }
      }

      // Gestione errori generici
      if (error.response?.data?.detail) {
        return Promise.reject(new Error(error.response.data.detail));
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;