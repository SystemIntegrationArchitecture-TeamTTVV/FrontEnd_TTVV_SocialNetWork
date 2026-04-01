import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import i18n, { setAppLanguage } from '../../i18n';
import logo from '../../assets/logo-favicon.png';

const FACEBOOK_STYLE_IMAGE_URL =
  'https://static.xx.fbcdn.net/rsrc.php/yb/r/HpEiFYDux5j.webp';

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
  const currentLang: 'en' | 'vi' = i18n.language?.startsWith('en') ? 'en' : 'vi';

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
    <div className="relative w-full min-h-screen bg-[#f0f2f5] dark:bg-[#0f111a]">
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
        <div className="hidden lg:flex relative bg-[#f5f7fb] dark:bg-[#141826] px-10 py-16 overflow-hidden">
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

            <div className="relative h-[500px] justify-self-end w-[390px]">
              <div className="absolute left-0 top-0 w-[390px] h-[470px] rounded-[36px] bg-white dark:bg-[#1a1d28] border border-gray-200 dark:border-[#2b2f45] shadow-xl overflow-hidden">
                <img
                  src={FACEBOOK_STYLE_IMAGE_URL}
                  alt={t('auth.frame.visualAlt')}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -left-6 top-20 rounded-2xl bg-white dark:bg-[#1a1d28] border border-gray-200 dark:border-[#2b2f45] shadow-md px-3 py-2.5">
                <span className="text-2xl">😂</span>
              </div>
              <div className="absolute -right-2 bottom-20 rounded-full bg-[#ff2d87] text-white w-14 h-14 flex items-center justify-center shadow-lg text-2xl">
                ❤
              </div>
              <div className="absolute left-26 bottom-0 w-20 h-20 rounded-full border-4 border-[#f5f7fb] dark:border-[#141826] shadow-md overflow-hidden bg-white">
                <img src={logo} alt="TTVV Logo mini" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-[540px] bg-white dark:bg-[#1a1d28] rounded-3xl shadow-xl border border-gray-200/90 dark:border-[#2b2f45] p-8 lg:p-10">
            <div
              role="group"
              aria-label={t('navbar.languageTitle')}
              className="mb-6 flex flex-col gap-3 border-b border-gray-100 pb-6 dark:border-[#2b2f45] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-[#93a0c0]">
                <Globe className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
                <span>{t('navbar.language')}</span>
              </div>
              <div className="inline-flex shrink-0 rounded-xl border border-gray-200 bg-[#f8fafc] p-1 dark:border-[#2b2f45] dark:bg-[#13151f]">
                <button
                  type="button"
                  onClick={() => setAppLanguage('vi')}
                  aria-pressed={currentLang === 'vi'}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors min-[380px]:px-4 ${
                    currentLang === 'vi'
                      ? 'bg-white text-[#1877f2] shadow-sm dark:bg-[#1e2133] dark:text-[#4d9fff]'
                      : 'text-gray-600 hover:text-gray-900 dark:text-[#7e89a6] dark:hover:text-[#edf0fa]'
                  }`}
                >
                  {t('navbar.vietnamese')}
                </button>
                <button
                  type="button"
                  onClick={() => setAppLanguage('en')}
                  aria-pressed={currentLang === 'en'}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors min-[380px]:px-4 ${
                    currentLang === 'en'
                      ? 'bg-white text-[#1877f2] shadow-sm dark:bg-[#1e2133] dark:text-[#4d9fff]'
                      : 'text-gray-600 hover:text-gray-900 dark:text-[#7e89a6] dark:hover:text-[#edf0fa]'
                  }`}
                >
                  {t('navbar.english')}
                </button>
              </div>
            </div>

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

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-gray-500 dark:text-[#5a6278]">
            {t('auth.frame.carouselHint', {
              current: activeSlide + 1,
              total: introSlides.length,
              title: introSlides[activeSlide]?.title ?? '',
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
