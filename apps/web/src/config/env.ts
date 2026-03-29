export type Locale = 'ru' | 'en';

export interface AppConfig {
  appName: string;
  apiBaseUrl: string;
  defaultLocale: Locale;
}

const SUPPORTED_LOCALES: readonly Locale[] = ['ru', 'en'];

function resolveLocale(value: string | undefined): Locale {
  if (value && (SUPPORTED_LOCALES as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return 'ru';
}

export const appConfig: AppConfig = {
  appName: import.meta.env.VITE_APP_NAME ?? 'Drawing Editor MVP',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3001',
  defaultLocale: resolveLocale(import.meta.env.VITE_DEFAULT_LOCALE),
};

export { SUPPORTED_LOCALES };