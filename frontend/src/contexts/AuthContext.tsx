import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { AuthContextType, LoginCredentials, RegisterCredentials } from '@/types/auth';

// Creazione del contesto con un valore di default undefined
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props per il provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Utilizzo dell'hook useAuth per la logica di autenticazione
  const {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser
  } = useAuth();

  // Valore del contesto che sarà disponibile ai componenti figli
  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login: async (credentials: LoginCredentials) => {
      await login(credentials);
    },
    register: async (credentials: RegisterCredentials) => {
      await register(credentials);
    },
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizzato per utilizzare il contesto di autenticazione
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext deve essere utilizzato all\'interno di un AuthProvider');
  }
  return context;
};

// HOC per proteggere le route che richiedono autenticazione
interface WithAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const WithAuth: React.FC<WithAuthProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return fallback || <div>Caricamento...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

export default AuthProvider;