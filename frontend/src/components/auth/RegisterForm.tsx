import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import type { RegisterCredentials } from '@/types/auth';

const registerSchema = z.object({
  email: z.string()
    .email('Email non valida')
    .max(255, 'Email non può superare i 255 caratteri'),
  username: z.string()
    .min(3, 'Username deve essere di almeno 3 caratteri')
    .max(50, 'Username non può superare i 50 caratteri'),
  password: z.string()
    .min(8, 'Password deve essere di almeno 8 caratteri')
    .max(50, 'Password non può superare i 50 caratteri')
    .regex(/[A-Z]/, 'Password deve contenere almeno una lettera maiuscola')
    .regex(/[a-z]/, 'Password deve contenere almeno una lettera minuscola')
    .regex(/[0-9]/, 'Password deve contenere almeno un numero')
    .regex(/[!@#$%^&*()]/, 'Password deve contenere almeno un carattere speciale (!@#$%^&*())'),
  tenant_name: z.string().optional(),
});

export const RegisterForm = () => {
  const { register: registerUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterCredentials>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterCredentials) => {
    try {
      await registerUser(data);
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Si è verificato un errore durante la registrazione'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Email"
        type="text"
        {...register('email')}
        error={errors.email?.message}
        autoComplete="email"
        fullWidth
      />

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
        autoComplete="new-password"
        fullWidth
      />

      <Input
        label="Nome Organizzazione (opzionale)"
        type="text"
        {...register('tenant_name')}
        error={errors.tenant_name?.message}
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
        Registrati
      </Button>
    </form>
  );
};