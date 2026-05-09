import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HttpError } from '../../apis/http';
import { useToast } from '../../contexts/useToast';
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
  const { register, handleSubmit, setFocus, formState: { errors, submitCount } } = useForm<LoginForm>();
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  useEffect(() => {
    setFocus('username');
  }, [setFocus]);

  useEffect(() => {
    if (!submitCount) return;
    if (errors.username) {
      setFocus('username');
      return;
    }
    if (errors.password) {
      setFocus('password');
    }
  }, [errors.username, errors.password, setFocus, submitCount]);

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      setIsSubmitting(true);
      const authResult = await login(data.username, data.password);
      showToast(t('auth.login.submit'), 'success');
      const from =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

      if (isAdminRole(authResult.role)) {
        navigate(from.startsWith('/admin') ? from : '/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        const msg = err.message || t('auth.login.errorInvalid');
        setError(msg);
        showToast(msg, 'error');
      } else {
        const msg = t('auth.login.errorGeneric');
        setError(msg);
        showToast(msg, 'error');
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
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'login-username-error' : undefined}
            className={`w-full h-12 px-4 rounded-xl bg-[#f4f5f7] dark:bg-[#1f2230] text-gray-900 dark:text-[#e8ecf5] placeholder:text-gray-400 dark:placeholder:text-[#555f78] border transition-all text-[15px] ${
              errors.username ? 'border-red-400 dark:border-red-500/50 animate-shake-x' : 'border-[#e2e5ea] dark:border-[#272c3d]'
            } focus:outline-none focus:ring-2 focus:ring-[#1a6cf5]/20 dark:focus:ring-[#4d8ef8]/20 focus:border-[#1a6cf5] dark:focus:border-[#4d8ef8]`}
          />
          {errors.username && (
            <p id="login-username-error" className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.username.message as string}
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <input
              {...register('password', {
                required: t('auth.login.passwordRequired'),
                minLength: {
                  value: 3,
                  message: t('auth.login.passwordMin'),
                },
              })}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.login.passwordPlaceholder')}
              autoComplete="current-password"
              onKeyUp={(e) => setCapsLockOn(e.getModifierState('CapsLock'))}
              onBlur={() => setCapsLockOn(false)}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'login-password-error' : capsLockOn ? 'login-capslock-warning' : undefined}
              className={`w-full h-12 px-4 pr-12 rounded-xl bg-[#f4f5f7] dark:bg-[#1f2230] text-gray-900 dark:text-[#e8ecf5] placeholder:text-gray-400 dark:placeholder:text-[#555f78] border transition-all text-[15px] ${
                errors.password ? 'border-red-400 dark:border-red-500/50 animate-shake-x' : 'border-[#e2e5ea] dark:border-[#272c3d]'
              } focus:outline-none focus:ring-2 focus:ring-[#1a6cf5]/20 dark:focus:ring-[#4d8ef8]/20 focus:border-[#1a6cf5] dark:focus:border-[#4d8ef8]`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 dark:text-[#9aa3bc] dark:hover:text-[#c8ccde]"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p id="login-password-error" className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
              {errors.password.message as string}
            </p>
          )}
          {!errors.password && capsLockOn && (
            <p id="login-capslock-warning" className="mt-2 text-sm text-amber-600 dark:text-amber-400" aria-live="polite">
              {t('auth.login.capsLockOn', { defaultValue: 'Caps Lock dang bat' })}
            </p>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50/90 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl" role="alert" aria-live="assertive">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="w-full h-12 bg-linear-to-r from-blue-600 to-blue-500 text-white font-semibold text-base rounded-xl shadow-sm transition-all hover:from-blue-700 hover:to-blue-600 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting || isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('auth.login.submitting')}
            </span>
          ) : t('auth.login.submit')}
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
          className="w-full h-12 bg-linear-to-r from-green-600 to-green-500 text-white font-semibold text-base rounded-xl shadow-sm transition-all hover:from-green-700 hover:to-green-600 active:scale-[0.98] flex items-center justify-center"
        >
          {t('auth.login.createAccount')}
        </Link>
      </form>
    </AuthFrame>
  );
}
