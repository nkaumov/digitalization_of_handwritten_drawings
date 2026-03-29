import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { appConfig, SUPPORTED_LOCALES, type Locale } from '@/config/env';
import en from '@/i18n/locales/en.json';
import ru from '@/i18n/locales/ru.json';

const resources = {
  en: { translation: en },
  ru: { translation: ru },
} as const;

function detectLanguage(): Locale {
  const stored = globalThis.localStorage?.getItem('app.locale');
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    return stored as Locale;
  }

  const browserLanguage = globalThis.navigator?.language?.slice(0, 2);
  if (browserLanguage && (SUPPORTED_LOCALES as readonly string[]).includes(browserLanguage)) {
    return browserLanguage as Locale;
  }

  return appConfig.defaultLocale;
}

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: appConfig.defaultLocale,
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (locale) => {
  globalThis.localStorage?.setItem('app.locale', locale);
});

export default i18n;