import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { HttpError } from '../../apis/http';
import AuthFrame from '../../components/auth/AuthFrame';
import i18n from '../../i18n';

interface LoginForm {
  username: string;
  password: string;
}

function isAdminRole(role: string | undefined | null): boolean {
  if (!role) return false;
  const r = role.trim().toUpperCase();
  return r === 'ADMIN' || r === 'ROLE_ADMIN';
}

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      setIsSubmitting(true);
      const authResult = await login(data.username, data.password);
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

      if (isAdminRole(authResult.role)) {
        navigate(from.startsWith('/admin') ? from : '/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        setError(err.message || t('auth.login.errorInvalid'));
      } else {
        setError(t('auth.login.errorGeneric'));
      }
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFrame
      brandHeading={t('common.appName')}
      brandDescription={t('auth.login.brandDescription')}
    >
      <form key={i18n.language} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <input
            {...register('username', {
              required: t('auth.login.usernameRequired'),
              minLength: {
                value: 3,
                message: t('auth.login.usernameMin'),
              },
            })}
            type="text"
            placeholder={t('auth.login.usernamePlaceholder')}
            autoComplete="username"
            className={`w-full h-14 px-5 rounded-xl border bg-white dark:bg-[#22263a] shadow-sm text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] ${
              errors.username ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-[#2b2f45]'
            } focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 text-base transition-all`}
          />
          {errors.username && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.username.message as string}</p>
          )}
        </div>

        <div>
          <input
            {...register('password', {
              required: t('auth.login.passwordRequired'),
              minLength: {
                value: 3,
                message: t('auth.login.passwordMin'),
              },
            })}
            type="password"
            placeholder={t('auth.login.passwordPlaceholder')}
            autoComplete="current-password"
            className={`w-full h-14 px-5 rounded-xl border bg-white dark:bg-[#22263a] shadow-sm text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] ${
              errors.password ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-[#2b2f45]'
            } focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 text-base transition-all`}
          />
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password.message as string}</p>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50/90 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="w-full h-12 bg-blue-600 text-white font-semibold text-base rounded-xl shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || isLoading ? t('auth.login.submitting') : t('auth.login.submit')}
        </button>

        <div className="text-center pt-2">
          <Link
            to="/auth/forgot-password"
            className="text-blue-600 dark:text-blue-400 text-base hover:underline font-semibold transition-colors"
          >
            {t('auth.login.forgotPassword')}
          </Link>
        </div>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-[#2b2f45]" />
          </div>
        </div>

        <Link
          to="/auth/register"
          className="w-full h-12 bg-green-600 text-white font-semibold text-base rounded-xl shadow-sm transition-all hover:bg-green-700 active:scale-[0.98] flex items-center justify-center"
        >
          {t('auth.login.createAccount')}
        </Link>
      </form>
    </AuthFrame>
  );
}
