import { Link } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';

export const LoginPage = () => {
  return (
    <div className="container-auth">
      <div className="max-w-md w-full">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Accedi alla tua Rubrica
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Non hai un account?{' '}
            <Link
              to="/auth/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Registrati
            </Link>
          </p>
        </div>

        <div className="card mt-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};