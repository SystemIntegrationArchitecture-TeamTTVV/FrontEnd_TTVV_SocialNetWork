import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** Sprite chim giữa bay — cùng asset với game */
const FLAPPY_BIRD_ICON =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/yellowbird-midflap-8mBrx070GYsw2As4Ue9BfQJ5XNMUg3.png';

export default function GamesPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-1 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {t('gamesPage.title')}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-gray-600 dark:text-[#9aa3bc]">
          {t('gamesPage.subtitle')}
        </p>
        <p className="mt-1.5 text-sm text-blue-600/90 dark:text-blue-400/95">
          {t('gamesPage.guestPlayOk')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/games/flappy"
          className="group flex flex-col rounded-2xl border border-gray-200 dark:border-[#2b2f45] bg-white dark:bg-[#1a1d28] p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-amber-50 dark:bg-amber-500/15 ring-1 ring-amber-200/80 dark:ring-amber-500/25">
            <img
              src={FLAPPY_BIRD_ICON}
              alt=""
              width={56}
              height={56}
              loading="lazy"
              decoding="async"
              className="h-12 w-12 object-contain"
            />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {t('gamesPage.flappyTitle')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-[#9aa3bc] leading-relaxed">
            {t('gamesPage.flappyDesc')}
          </p>
          <span className="mt-4 text-sm font-semibold text-blue-600 dark:text-blue-400">
            {t('gamesPage.play')}
          </span>
        </Link>
      </div>
    </div>
  );
}
