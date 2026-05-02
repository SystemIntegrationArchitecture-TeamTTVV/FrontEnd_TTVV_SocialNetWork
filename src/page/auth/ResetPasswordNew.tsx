import { useNavigate, useSearchParams } from 'react-router-dom';
import { X, Key, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { passwordResetApi } from '../../apis/passwordReset';

interface ResetPasswordForm {
  newPassword: string;
  confirmPassword: string;
}

export default function ResetPasswordNew() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const newPassword = watch('newPassword');
  const hasMinLength = newPassword?.length >= 3;
  const hasUpperLower = newPassword && /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword);
  const hasNumberOrSpecial = newPassword && (/[0-9]/.test(newPassword) || /[^a-zA-Z0-9]/.test(newPassword));

  const onSubmit = async (data: ResetPasswordForm) => {
    if (data.newPassword !== data.confirmPassword) return;
    if (!token) {
      setApiError('Liên kết đặt lại mật khẩu không hợp lệ. Vui lòng thực hiện lại.');
      return;
    }
    setIsLoading(true);
    setApiError(null);
    try {
      await passwordResetApi.resetPassword(token, data.newPassword);
      navigate('/auth/reset-success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-125 mx-auto">
      <div className="bg-white dark:bg-[#1a1d28] rounded-[28px] shadow-xl p-8 relative border border-gray-200/80 dark:border-[#2b2f45]">
        <button
          onClick={() => navigate('/auth/login')}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 dark:bg-[#22263a] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#2b2f45] transition-colors"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-[#5a6278]" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
            <Key className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#edf0fa] text-center mb-4">
          {t('auth.resetCreate.title')}
        </h2>

        <p className="text-center text-gray-600 dark:text-[#7e89a6] mb-6">
          {t('auth.resetCreate.subtitle')}
        </p>

        <div className="border-t border-gray-200 dark:border-[#2b2f45] mb-6"></div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-[#c0c8de] mb-2">
              {t('auth.resetCreate.newPassword')}
            </label>
            <div className="relative">
              <input
                {...register('newPassword', {
                  required: t('auth.resetCreate.requiredNew'),
                  minLength: { value: 3, message: t('auth.resetCreate.minLength') },
                })}
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.resetCreate.placeholderNew')}
                className="w-full h-14 px-4 pr-12 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-100 dark:bg-[#353a54] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#4e5870] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-500 dark:text-[#7e89a6]" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500 dark:text-[#7e89a6]" />
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-[#c0c8de] mb-2">
              {t('auth.resetCreate.confirmPassword')}
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword', {
                  required: t('auth.resetCreate.requiredConfirm'),
                  validate: (value) =>
                    value === newPassword || t('auth.resetCreate.mismatch'),
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('auth.resetCreate.placeholderConfirm')}
                className="w-full h-14 px-4 pr-12 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-gray-100 dark:bg-[#353a54] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#4e5870] transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4 text-gray-500 dark:text-[#7e89a6]" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-500 dark:text-[#7e89a6]" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-[#22263a] rounded-2xl p-4 space-y-2 border border-gray-100 dark:border-[#2b2f45]">
            <p className="text-sm font-semibold text-gray-900 dark:text-[#c0c8de]">{t('auth.resetCreate.requirementsTitle')}</p>
            <div className="space-y-1 text-sm">
              <p className={hasMinLength ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-[#5a6278]'}>
                {hasMinLength ? '✓' : '○'} {t('auth.resetCreate.reqLength')}
              </p>
              <p className={hasUpperLower ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-[#5a6278]'}>
                {hasUpperLower ? '✓' : '○'} {t('auth.resetCreate.reqCase')}
              </p>
              <p className={hasNumberOrSpecial ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-[#5a6278]'}>
                {hasNumberOrSpecial ? '✓' : '○'} {t('auth.resetCreate.reqNumber')}
              </p>
            </div>
          </div>

          {apiError && (
            <div className="p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/auth/login')}
              className="flex-1 h-12 bg-gray-100 dark:bg-[#22263a] text-gray-900 dark:text-[#c0c8de] font-semibold rounded-xl border border-gray-200 dark:border-[#2b2f45] hover:bg-gray-200 dark:hover:bg-[#2b2f45] transition-colors"
            >
              {t('auth.resetCreate.cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-12 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? 'Đang xử lý...' : t('auth.resetCreate.submit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

