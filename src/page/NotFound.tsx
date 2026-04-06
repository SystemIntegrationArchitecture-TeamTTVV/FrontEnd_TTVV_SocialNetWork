import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[min(70vh,560px)] flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-[#e4e6eb] bg-white p-8 text-center shadow-sm dark:border-[#22263a] dark:bg-[#1a1d26]">
        <p className="text-6xl font-black tabular-nums tracking-tight text-blue-600 dark:text-blue-400">
          {t('notFound.code')}
        </p>
        <h1 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">
          {t('notFound.title')}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          {t('notFound.description')}
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/home"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-[#1a1d26]"
          >
            <Home className="h-4 w-4 shrink-0" aria-hidden />
            {t('notFound.backHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
