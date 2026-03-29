import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAppConfig } from '@/config/ConfigProvider';
import { createEditorHistoryManager } from '@/features/editor-shell/history';

export function EditorShellPage() {
  const { t, i18n } = useTranslation();
  const config = useAppConfig();
  const historyManager = useMemo(() => createEditorHistoryManager(), []);

  const historyState = historyManager.getState();

  return (
    <div className="editor-shell">
      <header className="editor-shell__header" aria-label={t('editorShell.header.ariaLabel')}>
        <div className="editor-shell__title-wrap">
          <h1>{t('app.title')}</h1>
          <p>{t('editorShell.header.subtitle')}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <aside className="editor-shell__sidebar" aria-label={t('editorShell.sidebar.ariaLabel')}>
        <section className="editor-shell__panel">
          <h2>{t('editorShell.sidebar.toolsTitle')}</h2>
          <p>{t('editorShell.sidebar.toolsPlaceholder')}</p>
        </section>

        <section className="editor-shell__panel" aria-label={t('editorShell.history.ariaLabel')}>
          <h2>{t('editorShell.history.title')}</h2>
          <p>{t('editorShell.history.placeholder')}</p>
          <div className="editor-shell__history-actions">
            <button type="button" disabled>
              {t('editorShell.history.undoAction')}
            </button>
            <button type="button" disabled>
              {t('editorShell.history.redoAction')}
            </button>
          </div>
        </section>
      </aside>

      <main className="editor-shell__workspace" aria-label={t('editorShell.workspace.ariaLabel')}>
        <div className="editor-shell__workspace-header">
          <h2>{t('editorShell.workspace.title')}</h2>
          <p>{t('editorShell.workspace.subtitle')}</p>
        </div>

        <section className="editor-shell__canvas" aria-label={t('editorShell.workspace.canvasAriaLabel')}>
          <div className="editor-shell__canvas-overlay">
            <p>{t('editorShell.workspace.canvasPlaceholder')}</p>
          </div>
        </section>
      </main>

      <footer className="editor-shell__status" aria-label={t('editorShell.status.ariaLabel')}>
        <h2>{t('editorShell.status.title')}</h2>
        <p>{t('editorShell.status.api', { url: config.apiBaseUrl })}</p>
        <p>{t('editorShell.status.locale', { locale: i18n.language })}</p>
        <p>
          {t('editorShell.status.historyState', {
            undoCount: Math.max(historyState.past.length - 1, 0),
            redoCount: historyState.future.length,
          })}
        </p>
      </footer>
    </div>
  );
}
