import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthContext } from '@/contexts/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import type { LoginCredentials } from '@/types/auth';
import axios from 'axios';  // aggiungi questo import

const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username deve essere di almeno 3 caratteri')
    .max(50, 'Username non può superare i 50 caratteri'),
  password: z.string()
    .min(8, 'Password deve essere di almeno 8 caratteri')
    .max(50, 'Password non può superare i 50 caratteri'),
});

export const LoginForm: React.FC = () => {
  const { login } = useAuthContext();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      await login(data);
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = 'Si è verificato un errore durante il login';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.detail || 'Errore di connessione al server';
      }

      setError('root', {
        message: errorMessage
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Username"
        type="text"
        {...register('username')}
        error={errors.username?.message}
        autoComplete="username"
        fullWidth
      />
      <Input
        label="Password"
        type="password"
        {...register('password')}
        error={errors.password?.message}
        autoComplete="current-password"
        fullWidth
      />
      {errors.root && (
        <div className="text-red-600 text-sm">
          {errors.root.message}
        </div>
      )}
      <Button
        type="submit"
        isLoading={isSubmitting}
        fullWidth
      >
        Accedi
      </Button>
    </form>
  );
};

export default LoginForm;