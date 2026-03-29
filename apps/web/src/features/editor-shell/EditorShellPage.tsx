import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAppConfig } from '@/config/ConfigProvider';
import { createEditorHistoryManager } from '@/features/editor-shell/history';
import { ViewportCanvas } from '@/features/editor-shell/ViewportCanvas';
import { useViewportNavigation } from '@/features/editor-shell/viewport';

export function EditorShellPage() {
  const { t, i18n } = useTranslation();
  const config = useAppConfig();
  const historyManager = useMemo(() => createEditorHistoryManager(), []);
  const navigation = useViewportNavigation();

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

        <section className="editor-shell__panel">
          <h2>{t('editorShell.sidebar.navigationTitle')}</h2>
          <p>{t('editorShell.sidebar.navigationPlaceholder')}</p>
          <div className="editor-shell__history-actions">
            <button type="button" onClick={navigation.zoomIn}>
              {t('editorShell.sidebar.zoomInAction')}
            </button>
            <button type="button" onClick={navigation.zoomOut}>
              {t('editorShell.sidebar.zoomOutAction')}
            </button>
            <button type="button" onClick={navigation.reset}>
              {t('editorShell.sidebar.resetViewAction')}
            </button>
          </div>
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

        <ViewportCanvas
          t={t}
          viewport={navigation.viewport}
          grid={navigation.grid}
          onPointerDown={navigation.onPointerDown}
          onPointerMove={navigation.onPointerMove}
          onPointerUp={navigation.onPointerUp}
          onPointerLeave={navigation.onPointerLeave}
          onWheel={navigation.onWheel}
        />
      </main>

      <footer className="editor-shell__status" aria-label={t('editorShell.status.ariaLabel')}>
        <h2>{t('editorShell.status.title')}</h2>
        <p>{t('editorShell.status.api', { url: config.apiBaseUrl })}</p>
        <p>{t('editorShell.status.locale', { locale: i18n.language })}</p>
        <p>{t('editorShell.status.zoom', { value: navigation.viewport.zoom.toFixed(2) })}</p>
        <p>
          {t('editorShell.status.viewportOffset', {
            x: Math.round(navigation.viewport.offsetX),
            y: Math.round(navigation.viewport.offsetY),
          })}
        </p>
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
