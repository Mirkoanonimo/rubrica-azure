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
      // Debug per verificare che il token venga inviato
      console.debug('Token presente nella richiesta:', token.substring(0, 20) + '...');
    } else {
      console.debug('Nessun token presente per la richiesta');
    }
    return config;
  },
  (error) => {
    console.error('Errore nell\'interceptor della richiesta:', error);
    return Promise.reject(error);
  }
);

// Interceptor per gestire gli errori di risposta
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: unknown) => {
    if (error instanceof AxiosError && error.config) {
      const originalRequest = error.config as CustomAxiosRequestConfig;
      
      // Log dettagliato dell'errore
      console.error('Errore risposta API:', {
        status: error.response?.status,
        url: originalRequest.url,
        method: originalRequest.method,
        hasToken: !!originalRequest.headers?.Authorization,
      });

      // Se il token è scaduto (401) e non è già un retry
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          console.debug('Tentativo di refresh del token...');
          // Prova a refreshare il token
          const response = await axiosInstance.get<AuthResponse>('/auth/me');
          const { access_token } = response.data;
          
          // Salva il nuovo token
          localStorage.setItem('token', access_token);
          console.debug('Token refreshato con successo');

          // Aggiorna il token nella richiesta originale
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access_token}`;
          }
          
          // Riprova la richiesta originale
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          console.error('Refresh token fallito:', refreshError);
          // Se il refresh fallisce, pulisci il token e reindirizza al login
          localStorage.removeItem('token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // Se è un 403 (Forbidden)
      if (error.response?.status === 403) {
        console.error('Accesso vietato:', error.response?.data);
        // Potremmo reindirizzare a una pagina di accesso negato
        // window.location.href = '/access-denied';
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