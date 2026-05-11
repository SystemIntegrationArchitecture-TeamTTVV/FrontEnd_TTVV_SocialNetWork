import { useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImageCaptchaProps {
  imageUrl: string | null;
  value: string;
  error?: boolean;
  loading?: boolean;
  onChange: (text: string) => void;
  onRefresh: () => void;
}

export default function ImageCaptcha({
  imageUrl,
  value,
  error = false,
  loading = false,
  onChange,
  onRefresh,
}: ImageCaptchaProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset input when image refreshes
    if (!imageUrl) return;
    if (inputRef.current) inputRef.current.value = '';
    onChange('');
  }, [imageUrl]);

  return (
    <div className="space-y-2">
      {/* Captcha image row: ảnh + nút refresh ngang hàng */}
      <div className="flex items-stretch gap-2">
        {/* Image container chiếm phần lớn */}
        <div className={[
          'flex-1 h-12 rounded-xl border overflow-hidden flex items-center justify-center',
          'bg-[#f8f9fb] dark:bg-[#1a1d2e]',
          error
            ? 'border-red-400 dark:border-red-500/50'
            : 'border-[#e2e5ea] dark:border-[#272c3d]',
        ].join(' ')}>
          {loading || !imageUrl ? (
            <div className="w-full h-full flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-gray-300 animate-spin" />
            </div>
          ) : (
            <img
              src={imageUrl}
              alt="captcha"
              draggable={false}
              className="h-full w-auto block select-none pointer-events-none"
            />
          )}
        </div>
        {/* Refresh button cạnh ảnh */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label={t('auth.captcha.refresh', { defaultValue: 'Làm mới mã' })}
          title={t('auth.captcha.refresh', { defaultValue: 'Làm mới mã' })}
          className="h-12 w-10 shrink-0 flex items-center justify-center rounded-xl border border-[#e2e5ea] dark:border-[#272c3d] bg-[#f4f5f7] dark:bg-[#1f2230] text-gray-400 dark:text-[#9aa3bc] hover:text-blue-500 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500/60 transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        maxLength={10}
        placeholder={t('auth.captcha.placeholder', { defaultValue: 'Nhập mã trong ảnh' })}
        defaultValue=""
        onChange={(e) => onChange(e.target.value)}
        aria-label={t('auth.captcha.ariaLabel', { defaultValue: 'Mã xác thực' })}
        className={[
          'w-full h-12 px-4 rounded-xl bg-[#f4f5f7] dark:bg-[#1f2230]',
          'text-gray-900 dark:text-[#e8ecf5] placeholder:text-gray-400 dark:placeholder:text-[#555f78]',
          'border transition-all text-[15px] tracking-[0.3em] uppercase text-center font-medium',
          'focus:outline-none focus:ring-2 focus:ring-[#1a6cf5]/20 dark:focus:ring-[#4d8ef8]/20',
          'focus:border-[#1a6cf5] dark:focus:border-[#4d8ef8]',
          error
            ? 'border-red-400 dark:border-red-500/50 animate-shake-x'
            : 'border-[#e2e5ea] dark:border-[#272c3d]',
        ].join(' ')}
      />

      {error && (
        <p className="text-xs text-center text-red-500 dark:text-red-400" role="alert">
          {t('auth.captcha.required', { defaultValue: 'Vui lòng nhập đúng mã xác thực' })}
        </p>
      )}
    </div>
  );
}
