import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { appConfig, SUPPORTED_LOCALES } from '@/config/env';
import en from '@/i18n/locales/en.json';
import ru from '@/i18n/locales/ru.json';
const resources = {
    en: { translation: en },
    ru: { translation: ru },
};
function detectLanguage() {
    const stored = globalThis.localStorage?.getItem('app.locale');
    if (stored && SUPPORTED_LOCALES.includes(stored)) {
        return stored;
    }
    const browserLanguage = globalThis.navigator?.language?.slice(0, 2);
    if (browserLanguage && SUPPORTED_LOCALES.includes(browserLanguage)) {
        return browserLanguage;
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
