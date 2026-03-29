import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAppConfig } from '@/config/ConfigProvider';

export function AppLayout() {
  const { t, i18n } = useTranslation();
  const config = useAppConfig();

  useEffect(() => {
    document.title = t('app.title');
  }, [t, i18n.language]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>{t('app.title')}</h1>
          <p>{t('app.subtitle')}</p>
        </div>
        <LanguageSwitcher />
        <p className="placeholder-note">{t('sections.headerPlaceholder')}</p>
      </header>

      <aside className="app-sidebar" aria-label={t('layout.sidebar')}>
        <h2>{t('layout.sidebar')}</h2>
        <p>{t('sections.sidebarPlaceholder')}</p>
      </aside>

      <main className="app-editor" aria-label={t('layout.editor')}>
        <h2>{t('layout.editor')}</h2>
        <p>{t('sections.editorPlaceholder')}</p>
      </main>

      <footer className="app-status" aria-label={t('layout.status')}>
        <h2>{t('layout.status')}</h2>
        <p>{t('sections.statusPlaceholder')}</p>
        <p>{t('status.api', { url: config.apiBaseUrl })}</p>
        <p>{t('status.locale', { locale: i18n.language })}</p>
      </footer>
    </div>
  );
}
