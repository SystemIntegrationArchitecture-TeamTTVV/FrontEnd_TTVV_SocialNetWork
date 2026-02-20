import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      navbar: {
        searchPlaceholder: 'Search TTVV',
        language: 'Language',
        english: 'English',
        vietnamese: 'Vietnamese',
      },
    },
  },
  vi: {
    translation: {
      navbar: {
        searchPlaceholder: 'Tìm kiếm trên TTVV',
        language: 'Ngôn ngữ',
        english: 'Tiếng Anh',
        vietnamese: 'Tiếng Việt',
      },
    },
  },
} as const;

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'en';

  const stored = window.localStorage.getItem('language');
  if (stored && (stored === 'en' || stored === 'vi')) {
    return stored;
  }

  const browserLang = window.navigator.language?.toLowerCase() ?? 'en';
  if (browserLang.startsWith('vi')) return 'vi';

  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('i18n initialization failed:', error);
  });

export default i18n;


