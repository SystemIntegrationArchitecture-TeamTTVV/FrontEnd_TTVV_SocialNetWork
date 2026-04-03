import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';
import ja from './locales/ja.json';

export type AppLanguage = 'en' | 'vi' | 'ja';

const resources = {
  en: { translation: en },
  vi: { translation: vi },
  ja: { translation: ja },
} as const;

const getInitialLanguage = (): AppLanguage => {
  if (typeof window === 'undefined') return 'vi';

  const stored = window.localStorage.getItem('language');
  if (stored === 'en' || stored === 'vi' || stored === 'ja') {
    return stored;
  }

  const browserLang = window.navigator.language?.toLowerCase() ?? 'vi';
  if (browserLang.startsWith('vi')) return 'vi';
  if (browserLang.startsWith('en')) return 'en';
  if (browserLang.startsWith('ja')) return 'ja';

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

/** BCP 47 locale for dates, numbers, and Intl formatting. */
export function getLocaleTag(): string {
  const lng = i18n.language ?? 'vi';
  if (lng.startsWith('ja')) return 'ja-JP';
  if (lng.startsWith('en')) return 'en-US';
  return 'vi-VN';
}

export function getCurrentAppLanguage(): AppLanguage {
  const lng = i18n.language ?? 'vi';
  if (lng.startsWith('en')) return 'en';
  if (lng.startsWith('ja')) return 'ja';
  return 'vi';
}

export function setAppLanguage(lang: AppLanguage) {
  void i18n.changeLanguage(lang);
  try {
    window.localStorage.setItem('language', lang);
  } catch {
    /* ignore */
  }
}

export default i18n;
