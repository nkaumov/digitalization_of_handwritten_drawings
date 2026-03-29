export type Locale = 'ru' | 'en';
export interface AppConfig {
    appName: string;
    apiBaseUrl: string;
    defaultLocale: Locale;
}
declare const SUPPORTED_LOCALES: readonly Locale[];
export declare const appConfig: AppConfig;
export { SUPPORTED_LOCALES };
