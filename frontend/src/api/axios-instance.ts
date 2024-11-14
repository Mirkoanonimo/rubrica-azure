import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type { AuthResponse } from '@/types/auth';

// Ottieni l'URL base dall'environment o usa il default per development
const apiUrl = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1`
  : 'http://localhost:8000/api/v1';

// Estendiamo il tipo InternalAxiosRequestConfig per includere _retry
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export const axiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Funzione per ottenere il token aggiornato
const getBearerToken = (): string | null => {
  const token = localStorage.getItem('token');
  return token ? `Bearer ${token}` : null;
};

// Interceptor per aggiungere il token alle richieste
axiosInstance.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    const token = getBearerToken();
    if (token) {
      config.headers.Authorization = token;
      // Debug solo in development
      if (import.meta.env.DEV) {
        console.debug('Token presente nella richiesta:', token.substring(0, 20) + '...');
      }
    } else {
      if (import.meta.env.DEV) {
        console.debug('Nessun token presente per la richiesta');
      }
    }
    return config;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('Errore nell\'interceptor della richiesta:', error);
    }
    return Promise.reject(error);
  }
);

// Interceptor per gestire gli errori di risposta
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (error instanceof AxiosError && error.config) {
      const originalRequest = error.config as CustomAxiosRequestConfig;
      
      // Log dettagliato dell'errore solo in development
      if (import.meta.env.DEV) {
        console.error('Errore risposta API:', {
          status: error.response?.status,
          url: originalRequest.url,
          method: originalRequest.method,
          hasToken: !!originalRequest.headers?.Authorization,
        });
      }

      // Se il token è scaduto (401) e non è già un retry
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          if (import.meta.env.DEV) {
            console.debug('Tentativo di refresh del token...');
          }
          // Prova a refreshare il token
          const response = await axiosInstance.get<AuthResponse>('/auth/me');
          const { access_token } = response.data;
          
          // Salva il nuovo token
          localStorage.setItem('token', access_token);
          
          if (import.meta.env.DEV) {
            console.debug('Token refreshato con successo');
          }
          
          // Aggiorna il token nella richiesta originale
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          // Riprova la richiesta originale
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          if (import.meta.env.DEV) {
            console.error('Refresh token fallito:', refreshError);
          }
          // Se il refresh fallisce, pulisci il token e reindirizza al login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // Se è un 403 (Forbidden)
      if (error.response?.status === 403) {
        if (import.meta.env.DEV) {
          console.error('Accesso vietato:', error.response?.data);
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