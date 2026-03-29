import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES } from '@/config/env';
export function LanguageSwitcher() {
    const { i18n, t } = useTranslation();
    const changeLanguage = (locale) => {
        void i18n.changeLanguage(locale);
    };
    return (_jsxs("div", { className: "language-switcher", children: [_jsx("span", { className: "language-switcher__label", children: t('language.label') }), SUPPORTED_LOCALES.map((locale) => (_jsx("button", { type: "button", className: locale === i18n.language ? 'is-active' : '', onClick: () => changeLanguage(locale), "aria-pressed": locale === i18n.language, children: t(`language.${locale}`) }, locale)))] }));
}
