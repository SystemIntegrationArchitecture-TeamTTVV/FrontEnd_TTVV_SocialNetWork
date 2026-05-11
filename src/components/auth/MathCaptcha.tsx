import { useState, useCallback, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Challenge {
  question: string;
  answer: number;
}

function generateChallenge(): Challenge {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  if (Math.random() > 0.4) {
    return { question: `${a} + ${b}`, answer: a + b };
  }
  const bigger = Math.max(a, b);
  const smaller = Math.min(a, b);
  return { question: `${bigger} − ${smaller}`, answer: bigger - smaller };
}

interface MathCaptchaProps {
  onVerify: (verified: boolean) => void;
  /** Increment to reset the captcha externally (e.g. after failed login) */
  resetTrigger?: number;
  error?: boolean;
}

export default function MathCaptcha({ onVerify, resetTrigger, error }: MathCaptchaProps) {
  const { t } = useTranslation();
  const [challenge, setChallenge] = useState<Challenge>(generateChallenge);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const prevTrigger = useRef(resetTrigger);

  const refresh = useCallback(() => {
    setChallenge(generateChallenge());
    setInput('');
    setStatus('idle');
    onVerify(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [onVerify]);

  useEffect(() => {
    if (resetTrigger !== undefined && resetTrigger !== prevTrigger.current) {
      prevTrigger.current = resetTrigger;
      refresh();
    }
  }, [resetTrigger, refresh]);

  const handleChange = (value: string) => {
    setInput(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && value.trim() !== '') {
      if (parsed === challenge.answer) {
        setStatus('correct');
        onVerify(true);
      } else {
        setStatus('wrong');
        onVerify(false);
      }
    } else {
      setStatus('idle');
      onVerify(false);
    }
  };

  const borderClass = error
    ? 'border-red-400 dark:border-red-500/50'
    : status === 'correct'
    ? 'border-green-400 dark:border-green-500/50'
    : status === 'wrong'
    ? 'border-red-400 dark:border-red-500/50'
    : 'border-[#e2e5ea] dark:border-[#272c3d]';

  return (
    <div>
      <div className="flex items-center gap-2">
        <div
          className={`flex flex-1 items-center gap-3 h-12 px-4 rounded-xl bg-[#f4f5f7] dark:bg-[#1f2230] border transition-all ${borderClass}`}
        >
          <span className="text-[15px] font-semibold text-gray-700 dark:text-[#c0c8de] select-none whitespace-nowrap font-mono tracking-wide">
            {challenge.question} = ?
          </span>
          <div className="w-px h-5 bg-gray-300 dark:bg-[#3a3f52]" />
          <input
            ref={inputRef}
            type="number"
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={t('auth.captcha.placeholder')}
            className="flex-1 min-w-0 bg-transparent text-[15px] text-gray-900 dark:text-[#e8ecf5] placeholder:text-gray-400 dark:placeholder:text-[#555f78] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            aria-label={t('auth.captcha.ariaLabel')}
            aria-invalid={status === 'wrong' || !!error}
          />
          {status === 'correct' && (
            <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {(status === 'wrong' || (error && status !== 'correct')) && input !== '' && (
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <button
          type="button"
          onClick={refresh}
          title={t('auth.captcha.refresh')}
          aria-label={t('auth.captcha.refresh')}
          className="w-12 h-12 shrink-0 rounded-xl bg-[#f4f5f7] dark:bg-[#1f2230] border border-[#e2e5ea] dark:border-[#272c3d] flex items-center justify-center text-gray-500 dark:text-[#9aa3bc] hover:bg-gray-200 dark:hover:bg-[#272c3d] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
