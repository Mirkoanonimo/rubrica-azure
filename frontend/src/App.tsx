import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from './components/common/ToastContainer';
import { MainLayout } from './components/layout/MainLayout';
import { ContactList } from './components/contacts/ContactList';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

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
        <Routes>
          {/* Rotte Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Rotte Protette */}
          <Route
            path="/contacts"
            element={
              <MainLayout>
                <ContactList />
              </MainLayout>
            }
          />

          {/* Redirect di default a /contacts */}
          <Route path="/" element={<Navigate to="/contacts" replace />} />
          
          {/* Gestione 404 - redirige a /contacts */}
          <Route path="*" element={<Navigate to="/contacts" replace />} />
        </Routes>
        <ToastContainer />
      </Router>
    </QueryClientProvider>
  );
};

export default App;