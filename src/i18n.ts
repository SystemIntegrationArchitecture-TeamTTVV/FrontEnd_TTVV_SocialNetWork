import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

const resources = {
  en: { translation: en },
  vi: { translation: vi },
} as const;

const getInitialLanguage = (): 'en' | 'vi' => {
  if (typeof window === 'undefined') return 'vi';

  const stored = window.localStorage.getItem('language');
  if (stored === 'en' || stored === 'vi') {
    return stored;
  }

  const browserLang = window.navigator.language?.toLowerCase() ?? 'vi';
  if (browserLang.startsWith('vi')) return 'vi';
  if (browserLang.startsWith('en')) return 'en';

  return 'vi';
};

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  .catch((error: unknown) => {
    console.error('i18n initialization failed:', error);
  });

export function setAppLanguage(lang: 'en' | 'vi') {
  void i18n.changeLanguage(lang);
  try {
    window.localStorage.setItem('language', lang);
  } catch {
    /* ignore */
  }
}

export default i18n;
