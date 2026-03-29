import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAppConfig } from '@/config/ConfigProvider';
export function AppLayout() {
    const { t, i18n } = useTranslation();
    const config = useAppConfig();
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("header", { className: "app-header", children: [_jsxs("div", { children: [_jsx("h1", { children: t('app.title') }), _jsx("p", { children: t('app.subtitle') })] }), _jsx(LanguageSwitcher, {}), _jsx("p", { className: "placeholder-note", children: t('sections.headerPlaceholder') })] }), _jsxs("aside", { className: "app-sidebar", "aria-label": t('layout.sidebar'), children: [_jsx("h2", { children: t('layout.sidebar') }), _jsx("p", { children: t('sections.sidebarPlaceholder') })] }), _jsxs("main", { className: "app-editor", "aria-label": t('layout.editor'), children: [_jsx("h2", { children: t('layout.editor') }), _jsx("p", { children: t('sections.editorPlaceholder') })] }), _jsxs("footer", { className: "app-status", "aria-label": t('layout.status'), children: [_jsx("h2", { children: t('layout.status') }), _jsx("p", { children: t('sections.statusPlaceholder') }), _jsx("p", { children: t('status.api', { url: config.apiBaseUrl }) }), _jsx("p", { children: t('status.locale', { locale: i18n.language }) })] })] }));
}
