import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';

export const RegisterPage: React.FC = () => {  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crea un nuovo account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Oppure{' '}
            <Link
              to="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              accedi al tuo account esistente
            </Link>
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegisterForm />
        </div>

        <div className="text-center text-sm text-gray-600">
          Registrandoti, accetti i nostri{' '}
          <Link
            to="/terms"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Termini di Servizio
          </Link>{' '}
          e la{' '}
          <Link
            to="/privacy"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;