import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { passwordResetApi } from '../../apis/passwordReset';
import AuthFrame from '../../components/auth/AuthFrame';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);

  const isValidEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const goNextStep = () => {
    if (!email.trim()) {
      setError(t('auth.forgot.emailRequired'));
      return;
    }

    if (!isValidEmail(email)) {
      setError(t('auth.forgot.emailInvalid'));
      return;
    }

    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !isValidEmail(email)) {
      setError(t('auth.forgot.emailInvalid'));
      setStep(1);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await passwordResetApi.forgotPassword(email);
      console.log('✅ Password reset email sent:', response.message);
      setSuccess(true);
    } catch (err: unknown) {
      console.error('❌ Failed to send reset email:', err);
      setError(err instanceof Error ? err.message : t('auth.forgot.errorSend'));
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthFrame brandHeading={t('common.appName')} brandDescription={t('auth.forgot.brandDescriptionSuccess')}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-500/15 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-[#edf0fa] mb-2">{t('auth.forgot.successTitle')}</h2>
          <p className="text-gray-600 dark:text-[#7e89a6] mb-4 leading-relaxed">
            {t('auth.forgot.successBodyPrefix')}
            <strong className="text-gray-900 dark:text-[#c0c8de]">{email}</strong>
            {t('auth.forgot.successBodySuffix')}
          </p>
          <p className="text-sm text-gray-500 dark:text-[#5a6278] mb-8">{t('auth.forgot.successSpam')}</p>
          <button
            type="button"
            onClick={() => navigate('/auth/login')}
            className="w-full h-12 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            {t('auth.forgot.backToLogin')}
          </button>
        </div>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      brandHeading={t('common.appName')}
      brandDescription={t('auth.forgot.brandDescription')}
      cardTitle={t('auth.forgot.cardTitle')}
      cardSubtitle={t('auth.forgot.cardSubtitle')}
    >
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="h-2 rounded-full bg-gray-100 dark:bg-[#22263a] overflow-hidden">
            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${(step / 2) * 100}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <p className={`text-center ${step >= 1 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400 dark:text-[#5a6278]'}`}>
              {t('auth.forgot.stepEmail')}
            </p>
            <p className={`text-center ${step >= 2 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-400 dark:text-[#5a6278]'}`}>
              {t('auth.forgot.stepConfirm')}
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-[#c0c8de] mb-2">
                {t('auth.forgot.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-[#5a6278]" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.forgot.emailPlaceholder')}
                  className="w-full h-12 pl-10 pr-4 border border-gray-200 dark:border-[#2b2f45] rounded-xl bg-gray-50 dark:bg-[#22263a] text-gray-900 dark:text-[#edf0fa] placeholder:text-gray-400 dark:placeholder:text-[#5a6278] focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-[#2b2f45] transition-all"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                to="/auth/login"
                className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] text-gray-700 dark:text-[#c0c8de] font-medium hover:bg-gray-50 dark:hover:bg-[#2b2f45] transition-colors inline-flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('auth.forgot.login')}
              </Link>
              <button type="button" onClick={goNextStep} className="flex-1 h-11 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
                {t('auth.forgot.continue')}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#22263a] border border-gray-200 dark:border-[#2b2f45]">
              <p className="text-sm text-gray-700 dark:text-[#7e89a6]">{t('auth.forgot.sendHint')}</p>
              <p className="text-base font-semibold text-gray-900 dark:text-[#edf0fa] mt-1">{email}</p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
                className="flex-1 h-11 rounded-xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#22263a] text-gray-700 dark:text-[#c0c8de] font-medium hover:bg-gray-50 dark:hover:bg-[#2b2f45] transition-colors"
              >
                {t('auth.forgot.editEmail')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`flex-1 h-11 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isLoading
                    ? 'bg-gray-300 dark:bg-[#353a54] text-gray-500 dark:text-[#5a6278] cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isLoading ? t('auth.forgot.sending') : t('auth.forgot.sendLink')}
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthFrame>
  );
}
