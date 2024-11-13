/*
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { useAuth } from '@/contexts/AuthContext';
import App from '@/App';

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/contacts" />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/contacts" />,
      },
      {
        path: 'auth',
        children: [
          {
            path: 'login',
            element: (
              <AuthRoute>
                <LoginPage />
              </AuthRoute>
            ),
          },
          {
            path: 'register',
            element: (
              <AuthRoute>
                <RegisterPage />
              </AuthRoute>
            ),
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/auth/login" />,
      },
    ],
  },
]);
*/
import { createBrowserRouter } from 'react-router-dom';
import { TestComponent } from '@/components/TestComponent';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <TestComponent />,
  }
]);