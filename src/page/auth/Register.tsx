import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { HttpError } from '../../apis/http';
import AuthFrame from '../../components/auth/AuthFrame';
import i18n from '../../i18n';

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  month: string;
  day: string;
  year: string;
  gender: string;
}

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { register: registerUser, isLoading } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
  } = useForm<RegisterForm>();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);
      setIsSubmitting(true);

      const dateOfBirth = `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}T00:00:00`;

      const username = data.username || data.email.split('@')[0];

      await registerUser({
        email: data.email,
        username,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dateOfBirth,
      });
      const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof HttpError) {
        setError(err.message || t('auth.register.errorRegister'));
      } else {
        setError(t('auth.register.errorGeneric'));
      }
      console.error('Register error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  const nextStep = async () => {
    let fields: Array<keyof RegisterForm> = [];

    if (step === 1) {
      fields = ['firstName', 'lastName', 'email'];
    } else if (step === 2) {
      fields = ['username', 'password'];
    }

    if (fields.length === 0) return;
    const isValid = await trigger(fields);
    if (isValid) {
      setError(null);
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const previousStep = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <AuthFrame
      brandHeading={t('common.appName')}
      brandDescription={t('auth.register.brandDescription')}
      cardTitle={t('auth.register.cardTitle')}
      cardSubtitle={t('auth.register.cardSubtitle')}
    >
      <form key={i18n.language} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-3">
          <div className="h-2 rounded-full bg-gray-100 dark:bg-[#22263a] overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <p className={`text-center ${step >= 1 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400 dark:text-[#5a6278]'}`}>
              {t('auth.register.stepLabel', { n: 1 })}
            </p>
            <p className={`text-center ${step >= 2 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400 dark:text-[#5a6278]'}`}>
              {t('auth.register.stepLabel', { n: 2 })}
            </p>
            <p className={`text-center ${step >= 3 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400 dark:text-[#5a6278]'}`}>
              {t('auth.register.stepLabel', { n: 3 })}
            </p>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                {...register('firstName', { required: t('auth.register.firstNameRequired') })}
                type="text"
                placeholder={t('auth.register.firstNamePlaceholder')}
                className={`h-12 px-4 rounded-xl border bg-white dark:bg-[#22263a] shadow-sm text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] ${errors.firstName ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-[#2b2f45]'} focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
              />
              <input
                {...register('lastName', { required: t('auth.register.lastNameRequired') })}
                type="text"
                placeholder={t('auth.register.lastNamePlaceholder')}
                className={`h-12 px-4 rounded-xl border bg-white dark:bg-[#22263a] shadow-sm text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] ${errors.lastName ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-[#2b2f45]'} focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
              />
            </div>
            {(errors.firstName || errors.lastName) && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {(errors.firstName?.message || errors.lastName?.message) as string}
              </p>
            )}

            <input
              {...register('email', {
                required: t('auth.register.emailRequired'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('auth.register.emailInvalid'),
                },
              })}
              type="email"
              placeholder={t('auth.register.emailPlaceholder')}
              className={`w-full h-12 px-4 rounded-xl border bg-white dark:bg-[#22263a] shadow-sm text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] ${
                errors.email ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-[#2b2f45]'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
            />
            {errors.email && <p className="text-xs text-red-600 dark:text-red-400 -mt-1">{errors.email.message as string}</p>}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <input
              {...register('username', {
                required: t('auth.register.usernameRequired'),
                minLength: {
                  value: 3,
                  message: t('auth.register.usernameMin'),
                },
              })}
              type="text"
              placeholder={t('auth.register.usernamePlaceholder')}
              className={`w-full h-12 px-4 rounded-xl border bg-white dark:bg-[#22263a] shadow-sm text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] ${
                errors.username ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-[#2b2f45]'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
            />
            {errors.username && <p className="text-xs text-red-600 dark:text-red-400 -mt-1">{errors.username.message as string}</p>}

            <input
              {...register('password', {
                required: t('auth.register.passwordRequired'),
                minLength: {
                  value: 3,
                  message: t('auth.register.passwordMin'),
                },
              })}
              type="password"
              placeholder={t('auth.register.passwordPlaceholder')}
              className={`w-full h-12 px-4 rounded-xl border bg-white dark:bg-[#22263a] shadow-sm text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] ${
                errors.password ? 'border-red-300 dark:border-red-500/40' : 'border-gray-200 dark:border-[#2b2f45]'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
            />
            {errors.password && <p className="text-xs text-red-600 dark:text-red-400 -mt-1">{errors.password.message as string}</p>}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-[#7e89a6] mb-2">{t('auth.register.dobLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  {...register('month', { required: t('auth.register.monthRequired') })}
                  className="h-11 px-3 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] shadow-sm text-gray-900 dark:text-[#edf0fa] focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">{t('auth.register.month')}</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  {...register('day', { required: t('auth.register.dayRequired') })}
                  className="h-11 px-3 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] shadow-sm text-gray-900 dark:text-[#edf0fa] focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">{t('auth.register.day')}</option>
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select
                  {...register('year', { required: t('auth.register.yearRequired') })}
                  className="h-11 px-3 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] shadow-sm text-gray-900 dark:text-[#edf0fa] focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">{t('auth.register.year')}</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              {(errors.month || errors.day || errors.year) && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {(errors.month?.message || errors.day?.message || errors.year?.message) as string}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-[#7e89a6] mb-2">{t('auth.register.genderLabel')}</label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-2 px-3 h-11 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2b2f45]">
                  <input {...register('gender', { required: t('auth.register.genderRequired') })} type="radio" value="female" className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-[#c0c8de]">{t('auth.register.genderFemale')}</span>
                </label>
                <label className="flex items-center gap-2 px-3 h-11 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2b2f45]">
                  <input {...register('gender', { required: t('auth.register.genderRequired') })} type="radio" value="male" className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-[#c0c8de]">{t('auth.register.genderMale')}</span>
                </label>
                <label className="flex items-center gap-2 px-3 h-11 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-[#2b2f45]">
                  <input {...register('gender', { required: t('auth.register.genderRequired') })} type="radio" value="custom" className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700 dark:text-[#c0c8de]">{t('auth.register.genderOther')}</span>
                </label>
              </div>
              {errors.gender && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.gender.message as string}</p>}
            </div>

            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-[#22263a] border border-gray-200 dark:border-[#2b2f45] text-sm text-gray-600 dark:text-[#7e89a6]">
              <p className="font-semibold text-gray-700 dark:text-[#c0c8de] mb-1">{t('auth.register.summaryTitle')}</p>
              <p>
                {t('auth.register.summaryFullName')} {watch('lastName') || '-'} {watch('firstName') || '-'}
              </p>
              <p>
                {t('auth.register.summaryEmail')} {watch('email') || '-'}
              </p>
              <p>
                {t('auth.register.summaryUsername')} {watch('username') || '-'}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50/90 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <p className="text-xs text-gray-500 dark:text-[#5a6278] leading-relaxed">{t('auth.register.termsNotice')}</p>

        <div className="flex gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={previousStep}
              className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] text-gray-700 dark:text-[#c0c8de] font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-[#2b2f45] transition-colors"
            >
              {t('auth.register.back')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] text-gray-700 dark:text-[#c0c8de] font-medium shadow-sm hover:bg-gray-50 dark:hover:bg-[#2b2f45] transition-colors"
            >
              {t('auth.register.login')}
            </button>
          )}

          {step < totalSteps ? (
            <button type="button" onClick={nextStep} className="flex-1 h-11 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 transition-colors">
              {t('auth.register.continue')}
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex-1 h-11 bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isLoading ? t('auth.register.submitting') : t('auth.register.finish')}
            </button>
          )}
        </div>
      </form>
    </AuthFrame>
  );
}
