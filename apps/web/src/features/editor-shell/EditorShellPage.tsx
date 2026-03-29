import { useMemo, type ChangeEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useAppConfig } from '@/config/ConfigProvider';
import { createEditorHistoryManager } from '@/features/editor-shell/history';
import { editorShellMockDrawing } from '@/features/editor-shell/mockDrawing';
import { useDrawingEditor } from '@/features/editor-shell/useDrawingEditor';
import { useGeometrySelection } from '@/features/editor-shell/useGeometrySelection';
import { ViewportCanvas } from '@/features/editor-shell/ViewportCanvas';
import { useViewportNavigation } from '@/features/editor-shell/viewport';

export function EditorShellPage() {
  const { t, i18n } = useTranslation();
  const config = useAppConfig();
  const historyManager = useMemo(() => createEditorHistoryManager(), []);
  const navigation = useViewportNavigation();
  const drawingEditor = useDrawingEditor(editorShellMockDrawing);
  const selectionApi = useGeometrySelection();

  const historyState = historyManager.getState();
  const closedContours = drawingEditor.drawing.contours.filter((contour) => contour.closed).length;
  const openContours = drawingEditor.drawing.contours.length - closedContours;

  const dimensionItems = useMemo(
    () =>
      drawingEditor.drawing.contours.flatMap((contour) =>
        contour.dimensions.map((dimension) => ({
          contourId: contour.id,
          dimension,
        })),
      ),
    [drawingEditor.drawing.contours],
  );

  const selectedLabel = useMemo(() => {
    if (selectionApi.selectedSegment) {
      return t('editorShell.selection.segment', {
        contourId: selectionApi.selectedSegment.contourId,
        segmentId: selectionApi.selectedSegment.segmentId,
      });
    }

    if (selectionApi.selectedPoints.length === 0) {
      return t('editorShell.selection.none');
    }

    if (selectionApi.selectedPoints.length === 1) {
      const [point] = selectionApi.selectedPoints;
      if (!point) {
        return t('editorShell.selection.none');
      }

      return t('editorShell.selection.point', {
        contourId: point.contourId,
        pointId: point.pointId,
      });
    }

    const [first, second] = selectionApi.selectedPoints;
    return t('editorShell.selection.twoPoints', {
      first: `${first?.contourId}:${first?.pointId}`,
      second: `${second?.contourId}:${second?.pointId}`,
    });
  }, [selectionApi.selectedPoints, selectionApi.selectedSegment, t]);

  const handleCanvasPointerDown = (event: PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (!target.closest('[data-interactive="true"]')) {
      selectionApi.clear();
    }

    navigation.onPointerDown(event);
  };

  const handlePointSelect = (contourId: string, pointId: string, isMultiSelect: boolean) => {
    if (isMultiSelect) {
      selectionApi.togglePoint(contourId, pointId);
      return;
    }

    selectionApi.selectPointExclusive(contourId, pointId);
  };

  const handlePointMove = (contourId: string, pointId: string, x: number, y: number) => {
    drawingEditor.movePoint({ contourId, pointId }, x, y);
  };

  const handleCreateLine = () => {
    drawingEditor.createLine(selectionApi.selectedPoints);
  };

  const handleConnectPoints = () => {
    drawingEditor.connectLines(selectionApi.selectedPoints);
  };

  const handleDeleteSegment = () => {
    if (!selectionApi.selectedSegment) {
      return;
    }

    drawingEditor.deleteSegment(selectionApi.selectedSegment);
    selectionApi.clear();
  };

  const handleDimensionChange = (contourId: string, dimensionId: string) => (event: ChangeEvent<HTMLInputElement>) => {
    drawingEditor.updateDimensionRawText(contourId, dimensionId, event.target.value);
  };

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
          <div className="editor-shell__history-actions">
            <button type="button" onClick={handleCreateLine} disabled={selectionApi.selectedPoints.length !== 2}>
              {t('editorShell.sidebar.createLineAction')}
            </button>
            <button type="button" onClick={handleConnectPoints} disabled={selectionApi.selectedPoints.length !== 2}>
              {t('editorShell.sidebar.connectPointsAction')}
            </button>
            <button type="button" onClick={handleDeleteSegment} disabled={!selectionApi.selectedSegment}>
              {t('editorShell.sidebar.deleteSegmentAction')}
            </button>
          </div>
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

        <section className="editor-shell__panel">
          <h2>{t('editorShell.selection.title')}</h2>
          <p>{t('editorShell.selection.description')}</p>
          <p>{selectedLabel}</p>
          <p>{t('editorShell.selection.multiSelectHint')}</p>
          <p>
            {t('editorShell.selection.counts', {
              contours: drawingEditor.scene.contours.length,
              points: drawingEditor.scene.points.length,
              segments: drawingEditor.scene.segments.length,
            })}
          </p>
        </section>

        <section className="editor-shell__panel" aria-label={t('editorShell.dimensions.ariaLabel')}>
          <h2>{t('editorShell.dimensions.title')}</h2>
          <p>{t('editorShell.dimensions.description')}</p>
          <div className="editor-shell__dimension-list">
            {dimensionItems.map((item) => (
              <label key={item.dimension.id} className="editor-shell__dimension-row">
                <span>
                  {t('editorShell.dimensions.itemLabel', {
                    contourId: item.contourId,
                    segmentId: item.dimension.segmentId,
                  })}
                </span>
                <input
                  value={item.dimension.rawText}
                  onChange={handleDimensionChange(item.contourId, item.dimension.id)}
                  placeholder={t('editorShell.dimensions.inputPlaceholder')}
                />
                <small>
                  {item.dimension.isResolved
                    ? t('editorShell.dimensions.resolved')
                    : t('editorShell.dimensions.unresolved')}
                </small>
              </label>
            ))}
          </div>
        </section>

        <section className="editor-shell__panel" aria-label={t('editorShell.warnings.ariaLabel')}>
          <h2>{t('editorShell.warnings.title')}</h2>
          <p>{t('editorShell.warnings.description')}</p>
          <div className="editor-shell__warning-list">
            {drawingEditor.geometryWarnings.length === 0 ? (
              <p>{t('editorShell.warnings.none')}</p>
            ) : (
              drawingEditor.geometryWarnings.map((warning) => (
                <p key={warning.id}>
                  {t('editorShell.warnings.item', {
                    code: t(`editorShell.warnings.codes.${warning.code}`),
                    contourId: warning.contourId,
                  })}
                </p>
              ))
            )}
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
          scene={drawingEditor.scene}
          dimensionLabels={drawingEditor.dimensionLabels}
          geometryWarnings={drawingEditor.geometryWarnings}
          selection={selectionApi.selection}
          onPointSelect={handlePointSelect}
          onPointMove={handlePointMove}
          onSegmentSelect={selectionApi.selectSegment}
          onPointerDown={handleCanvasPointerDown}
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
        <p>{t('editorShell.status.selected', { value: selectedLabel })}</p>
        <p>
          {t('editorShell.status.closure', {
            closed: closedContours,
            open: openContours,
          })}
        </p>
        <p>
          {t('editorShell.status.dimensions', {
            total: dimensionItems.length,
            unresolved: dimensionItems.filter((item) => !item.dimension.isResolved).length,
          })}
        </p>
        <p>{t('editorShell.status.geometryWarnings', { count: drawingEditor.geometryWarnings.length })}</p>
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
