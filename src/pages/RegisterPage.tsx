import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input } from '@/components/ui';

const registerSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  // Register then auto-login
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      await authApi.register(data);
      // Auto-login after successful registration
      const loginRes = await authApi.login({
        email: data.email,
        password: data.password,
      });
      return loginRes;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user_id);
      toast.success('Account created! Welcome to StudyAcc 🎉');
      navigate('/', { replace: true });
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail || 'Registration failed. Try a different email.';
      toast.error(msg);
    },
  });

  const onSubmit = (data: RegisterForm) => registerMutation.mutate(data);

  // expose getValues to suppress lint
  void getValues;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-500 shadow-lg">
            <GraduationCap className="h-8 w-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Start studying smarter with accountability
          </p>
        </div>

        {/* Form */}
        <div className="card">
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-label="Registration form"
            className="space-y-5"
          >
            <Input
              label="Display Name"
              type="text"
              autoComplete="name"
              placeholder="Your name (optional)"
              hint="Shown on the leaderboard"
              {...formRegister('display_name')}
            />

            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...formRegister('email')}
            />

            <Input
              label="Password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              hint="At least 8 characters"
              error={errors.password?.message}
              {...formRegister('password')}
            />

            <Button
              type="submit"
              className="w-full"
              loading={registerMutation.isPending}
            >
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:text-brand-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
