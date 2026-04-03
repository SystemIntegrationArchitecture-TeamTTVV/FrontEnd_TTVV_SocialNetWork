import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { passwordResetApi } from '../../apis/passwordReset';

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError(t('auth.resetToken.errorInvalidLink'));
    } else {
      setError(null);
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError(t('auth.resetToken.errorInvalidLinkShort'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('auth.resetToken.errorMinLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.resetToken.errorMismatch'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await passwordResetApi.resetPassword(token, newPassword);
      console.log('✅ Password reset successful:', response.message);
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/auth/login');
      }, 3000);
    } catch (err: any) {
      console.error('❌ Failed to reset password:', err);
      setError(err.message || t('auth.resetToken.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#0c0e14] dark:via-[#12151f] dark:to-[#0c0e14] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1a1d28] rounded-2xl shadow-2xl w-full max-w-md p-8 border border-transparent dark:border-[#2b2f45]">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-500/15 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-[#edf0fa] mb-2">{t('auth.resetToken.successTitle')}</h2>
            <p className="text-gray-600 dark:text-[#7e89a6] mb-4">
              {t('auth.resetToken.successBody')}
            </p>
            <p className="text-sm text-gray-500 dark:text-[#5a6278] mb-6">
              {t('auth.resetToken.redirecting')}
            </p>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#0c0e14] dark:via-[#12151f] dark:to-[#0c0e14] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1a1d28] rounded-2xl shadow-2xl w-full max-w-md p-8 border border-transparent dark:border-[#2b2f45]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-500/15 rounded-full mb-4">
            <Lock className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-[#edf0fa] mb-2">{t('auth.resetToken.pageTitle')}</h1>
          <p className="text-gray-600 dark:text-[#7e89a6]">
            {t('auth.resetToken.pageSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-[#c0c8de] mb-2">
              {t('auth.resetToken.newPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#5a6278]" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.resetToken.placeholderNew')}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-[#2b2f45] rounded-xl bg-white dark:bg-[#22263a] text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                disabled={isLoading || !token}
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#5a6278] hover:text-gray-600 dark:hover:text-[#7e89a6]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-[#5a6278] mt-1">{t('auth.resetToken.minHint')}</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-[#c0c8de] mb-2">
              {t('auth.resetToken.confirmPassword')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#5a6278]" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.resetToken.placeholderConfirm')}
                className="w-full pl-10 pr-12 py-3 border border-gray-200 dark:border-[#2b2f45] rounded-xl bg-white dark:bg-[#22263a] text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                disabled={isLoading || !token}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#5a6278] hover:text-gray-600 dark:hover:text-[#7e89a6]"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
              isLoading || !token
                ? 'bg-gray-300 dark:bg-[#353a54] text-gray-500 dark:text-[#5a6278] cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            {isLoading ? t('auth.resetToken.submitting') : t('auth.resetToken.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
