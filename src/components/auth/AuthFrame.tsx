import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { getCurrentAppLanguage, setAppLanguage } from '../../i18n';


type AuthFrameProps = {
  brandHeading: string;
  brandDescription: string;
  cardTitle?: string;
  cardSubtitle?: string;
  children: ReactNode;
};

export default function AuthFrame({
  brandHeading,
  brandDescription,
  cardTitle,
  cardSubtitle,
  children,
}: AuthFrameProps) {
  const { t } = useTranslation();
  const [activeSlide, setActiveSlide] = useState(0);
  const { isDark, toggleTheme } = useTheme();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);
  const currentLang = getCurrentAppLanguage();

  const introSlides = useMemo(
    () => [
      { title: t('auth.frame.slide1Title'), description: t('auth.frame.slide1Desc') },
      { title: t('auth.frame.slide2Title'), description: t('auth.frame.slide2Desc') },
      { title: t('auth.frame.slide3Title'), description: t('auth.frame.slide3Desc') },
    ],
    [t]
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % introSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [introSlides.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    if (isLangOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLangOpen]);

  return (
    <div className="relative w-full min-h-screen bg-[#f6f7fb] dark:bg-[#0f111a]">
      <Link
        to="/home"
        className="absolute top-5 left-5 z-20 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-[#2b2f45] dark:bg-[#1a1d28] dark:text-[#c8d0e6] dark:hover:bg-[#22263a]"
      >
        <ArrowLeft className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
        <span className="hidden min-[380px]:inline">{t('auth.frame.backHome')}</span>
        <span className="min-[380px]:hidden">{t('auth.frame.backHomeShort')}</span>
      </Link>

      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <div className="relative" ref={langMenuRef}>
          <button
            type="button"
            onClick={() => setIsLangOpen((v) => !v)}
            aria-expanded={isLangOpen}
            aria-haspopup="listbox"
            aria-label={t('navbar.languageTitle')}
            title={t('navbar.languageTitle')}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#1e2133] border border-gray-200 dark:border-[#2b2f45] shadow-sm hover:bg-gray-50 dark:hover:bg-[#22263a] transition-all text-[#050505] dark:text-gray-200"
          >
            <Globe className="w-[20px] h-[20px]" strokeWidth={2} />
          </button>
          {isLangOpen && (
            <div
              role="listbox"
              className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-[#1a1d28] border border-[#e4e6eb] dark:border-[#2b2f45] shadow-lg py-1 overflow-hidden"
            >
              <button
                type="button"
                role="option"
                aria-selected={currentLang === 'vi'}
                onClick={() => {
                  setAppLanguage('vi');
                  setIsLangOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-[#f0f2f5] dark:hover:bg-[#252940] text-[#050505] dark:text-[#edf0fa]"
              >
                <span>{t('navbar.vietnamese')}</span>
                {currentLang === 'vi' && <Check className="w-4 h-4 text-[#1877F2] shrink-0" aria-hidden />}
              </button>
              <button
                type="button"
                role="option"
                aria-selected={currentLang === 'en'}
                onClick={() => {
                  setAppLanguage('en');
                  setIsLangOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-[#f0f2f5] dark:hover:bg-[#252940] text-[#050505] dark:text-[#edf0fa]"
              >
                <span>{t('navbar.english')}</span>
                {currentLang === 'en' && <Check className="w-4 h-4 text-[#1877F2] shrink-0" aria-hidden />}
              </button>
              <button
                type="button"
                role="option"
                aria-selected={currentLang === 'ja'}
                onClick={() => {
                  setAppLanguage('ja');
                  setIsLangOpen(false);
                }}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm hover:bg-[#f0f2f5] dark:hover:bg-[#252940] text-[#050505] dark:text-[#edf0fa]"
              >
                <span>{t('navbar.japanese')}</span>
                {currentLang === 'ja' && <Check className="w-4 h-4 text-[#1877F2] shrink-0" aria-hidden />}
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => toggleTheme()}
          aria-label={isDark ? t('navbar.themeLight') : t('navbar.themeDark')}
          className="inline-flex items-center gap-2 rounded-full bg-white dark:bg-[#1e2133] border border-gray-200 dark:border-[#2b2f45] shadow-sm px-3 h-10 hover:bg-gray-50 dark:hover:bg-[#22263a] transition-all"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-gray-700 dark:text-[#c8d0e6]">{t('navbar.themeLight')}</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-medium text-gray-700 dark:text-[#c8d0e6]">{t('navbar.themeDark')}</span>
            </>
          )}
        </button>
      </div>

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="hidden lg:flex relative bg-linear-to-b from-[#f7f9ff] to-[#f2f4fa] dark:from-[#13182a] dark:to-[#0f1424] px-10 py-16 overflow-hidden border-r border-gray-200/80 dark:border-[#22263a]">
          <div className="w-full max-w-[760px] mx-auto grid grid-cols-[0.95fr_1.05fr] gap-8 items-center">
            <div>
              <div className="w-14 h-14 rounded-full bg-[#1877f2] flex items-center justify-center text-white text-[11px] font-bold leading-[1.05] shadow-sm mb-7 text-center">
                TTVV
              </div>
              <h1 className="text-[56px] font-extrabold leading-[1.05] tracking-tight text-gray-900 dark:text-[#edf0fa]">
                {t('auth.frame.heroLine1')}
                <br />
                {t('auth.frame.heroLine2')}
                <br />
                <span className="text-[#1877f2]">{t('auth.frame.heroLine3')}</span>
              </h1>
              <p className="mt-6 text-[22px] leading-relaxed text-gray-600 dark:text-[#93a0c0] max-w-sm">
                {brandDescription}
              </p>
            </div>

            <div className="relative h-[580px] justify-self-end w-[440px] flex items-center justify-center">
              <img
                src="https://static.xx.fbcdn.net/rsrc.php/yb/r/HpEiFYDux5j.webp"
                alt="illustration"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-[540px] bg-white/95 dark:bg-[#1a1d28] rounded-3xl shadow-xl border border-gray-200/90 dark:border-[#2b2f45] p-8 lg:p-10 backdrop-blur-[2px]">
            <div className="lg:hidden mb-6 relative">
              <div className="absolute -top-3 -left-1 w-11 h-11 rounded-full bg-[#1877f2] text-white flex items-center justify-center font-bold text-[10px] leading-none text-center shadow-sm">
                TTVV
              </div>
              <div className="pl-13">
                <p className="font-bold text-gray-900 dark:text-[#edf0fa]">{brandHeading}</p>
                <p className="text-xs text-gray-500 dark:text-[#7e89a6]">{brandDescription}</p>
              </div>
            </div>

            {(cardTitle || cardSubtitle) && (
              <div className="text-left mb-6">
                {cardTitle && <h2 className="text-3xl font-bold text-gray-900 dark:text-[#edf0fa]">{cardTitle}</h2>}
                {cardSubtitle && <p className="text-sm text-gray-500 dark:text-[#7e89a6] mt-1">{cardSubtitle}</p>}
              </div>
            )}
            {children}
          </div>

          <div className="absolute bottom-7 left-1/2 -translate-x-1/2 w-[min(90vw,560px)] text-center">
            <p className="text-xs font-semibold text-gray-600 dark:text-[#7e89a6]">
              {t('auth.frame.carouselHint', {
                current: activeSlide + 1,
                total: introSlides.length,
                title: introSlides[activeSlide]?.title ?? '',
              })}
            </p>
            <p className="mt-1 text-[12.5px] text-gray-500 dark:text-[#6b7492] line-clamp-2">
              {introSlides[activeSlide]?.description ?? ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
