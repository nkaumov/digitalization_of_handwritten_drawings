const SUPPORTED_LOCALES = ['ru', 'en'];
function resolveLocale(value) {
    if (value && SUPPORTED_LOCALES.includes(value)) {
        return value;
    }
    return 'ru';
}
export const appConfig = {
    appName: import.meta.env.VITE_APP_NAME ?? 'Drawing Editor MVP',
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3001',
    defaultLocale: resolveLocale(import.meta.env.VITE_DEFAULT_LOCALE),
};
export { SUPPORTED_LOCALES };
