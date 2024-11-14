import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuthContext } from './contexts/AuthContext';
import { ToastContainer } from './components/common/ToastContainer';
import { MainLayout } from './components/layout/MainLayout';
import { ContactList } from './components/contacts/ContactList';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ContactEditPage } from '@/pages/contacts/ContactEditPage'; 

// Componente per le rotte protette
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  const location = useLocation();

  if (isLoading) {
    return <div>Caricamento...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;  // Modificato
  }

  return <>{children}</>;
};

// Componente per le rotte pubbliche
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthContext();
  const location = useLocation();
  
  if (isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname || '/contacts'} replace />;
  }
  return <>{children}</>;
};

// Componente per le rotte
const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotte Pubbliche */}
      <Route
        path="/auth/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/auth/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      
      {/* Rotte Protette */}
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ContactList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts/new"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ContactEditPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts/:id/edit"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ContactEditPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Redirect di default */}
      <Route path="/" element={<Navigate to="/contacts" replace />} />
      
      {/* Gestione 404 */}
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
};

// Crea una nuova istanza di QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <AppRoutes />
          <ToastContainer />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;