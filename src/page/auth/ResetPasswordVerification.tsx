import { useNavigate } from 'react-router-dom';
import { X, Mail } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function ResetPasswordVerification() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(165); // 2:45 in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newCode = [...code];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newCode[index] = char;
    });
    setCode(newCode);
  };

  const handleContinue = () => {
    if (code.every((digit) => digit !== '')) {
      navigate('/auth/reset-new-password');
    }
  };

  const isCodeComplete = code.every((digit) => digit !== '');

  return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="bg-white dark:bg-[#1a1d28] rounded-[28px] shadow-xl p-8 relative border border-gray-200/80 dark:border-[#2b2f45]">
        <button
          onClick={() => navigate('/auth/login')}
          className="absolute top-6 right-6 w-10 h-10 rounded-full bg-gray-100 dark:bg-[#22263a] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#2b2f45] transition-colors"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-[#5a6278]" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center">
            <Mail className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-[#edf0fa] text-center mb-4">
          {t('auth.resetOtp.title')}
        </h2>

        <p className="text-center text-gray-600 dark:text-[#7e89a6] mb-2">
          {t('auth.resetOtp.sentPrefix')}
        </p>
        <p className="text-center font-semibold text-gray-900 dark:text-[#edf0fa] mb-4">
          s***h@example.com
        </p>
        <p className="text-center text-gray-600 dark:text-[#7e89a6] mb-6">
          {t('auth.resetOtp.enterCodeHint')}
        </p>

        <div className="border-t border-gray-200 dark:border-[#2b2f45] mb-6"></div>

        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-900 dark:text-[#c0c8de]">{t('auth.resetOtp.codeLabel')}</label>
          
          <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-16 h-18 text-center text-3xl font-bold rounded-xl border-2 transition-colors bg-white dark:bg-[#22263a] ${
                  digit
                    ? 'border-blue-500 text-gray-900 dark:text-[#edf0fa]'
                    : 'border-gray-200 dark:border-[#2b2f45] text-gray-300 dark:text-[#353a54]'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-500/20`}
              />
            ))}
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500 dark:text-[#5a6278]">{t('auth.resetOtp.noCode')}</p>
            <button type="button" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              {t('auth.resetOtp.resend')}
            </button>
          </div>

          {timer > 0 && (
            <div className="flex justify-center">
              <div className="px-6 py-2 rounded-full bg-blue-50 dark:bg-blue-500/15">
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  ⏱️ {formatTime(timer)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-6">
          <button
            onClick={() => navigate('/auth/forgot-password')}
            className="flex-1 h-12 bg-gray-100 dark:bg-[#22263a] text-gray-900 dark:text-[#c0c8de] font-semibold rounded-xl border border-gray-200 dark:border-[#2b2f45] hover:bg-gray-200 dark:hover:bg-[#2b2f45] transition-colors"
          >
            {t('auth.resetOtp.back')}
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!isCodeComplete}
            className={`flex-1 h-12 font-semibold rounded-xl transition-colors ${
              isCodeComplete
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 dark:bg-[#353a54] text-white dark:text-[#5a6278] cursor-not-allowed'
            }`}
          >
            {t('auth.resetOtp.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

