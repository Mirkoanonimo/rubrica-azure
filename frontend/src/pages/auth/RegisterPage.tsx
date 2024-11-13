import { Link } from 'react-router-dom';
import { RegisterForm } from '../../components/auth/RegisterForm';
export const RegisterPage = () => {
  return (
    <div className="container-auth">
      <div className="max-w-md w-full">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Crea il tuo account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Hai già un account?{' '}
            <Link
              to="/auth/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Accedi
            </Link>
          </p>
        </div>

        <div className="card mt-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
};