import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '@/api/auth';
import type { 
  User, 
  LoginCredentials, 
  RegisterCredentials,
  AuthResponse 
} from '@/types/auth';
import { useToast } from '@/hooks/useToast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  // Funzione per gestire la risposta di autenticazione
  const handleAuthResponse = useCallback((response: AuthResponse) => {
    const { access_token, user } = response;
    localStorage.setItem('token', access_token);
    setUser(user);
    setIsAuthenticated(true);
  }, []);

  // Verifica lo stato di autenticazione all'avvio
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
          try {
              setIsLoading(true);  // Aggiunto
              const response = await authApi.getMe();
              handleAuthResponse(response);
          } catch (error) {
              console.error('InitAuth error:', error);  // Aggiunto
              localStorage.removeItem('token');
              setIsAuthenticated(false);
              setUser(null);
          } finally {
              setIsLoading(false);  // Spostato qui
          }
      } else {
          setIsLoading(false);
      }
  };

    initAuth();
  }, [handleAuthResponse]);

  // Login
  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await authApi.login(credentials);
      handleAuthResponse(response);
      
      // Redirect alla pagina precedente o alla dashboard
      const from = location.state?.from?.pathname || '/contacts';
      navigate(from, { replace: true });
      
      showToast('Login effettuato con successo', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante il login';
      showToast(message, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Registrazione
  const register = async (credentials: RegisterCredentials) => {
    try {
      setIsLoading(true);
      const response = await authApi.register(credentials);
      handleAuthResponse(response);
      navigate('/contacts');
      showToast('Registrazione completata con successo', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore durante la registrazione';
      showToast(message, 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      navigate('/auth/login');
      showToast('Logout effettuato con successo', 'success');
    } catch (error) {
      showToast('Errore durante il logout', 'error');
    }
  }, [navigate, showToast]);

  // Aggiornamento dati utente
  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser
  };
};

export default useAuth;