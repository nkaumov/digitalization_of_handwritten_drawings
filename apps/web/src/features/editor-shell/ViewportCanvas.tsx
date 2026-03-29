import type { TFunction } from 'i18next';
import type { PointerEvent, WheelEvent } from 'react';

import type { ViewportState } from '@/domains/viewport';

interface ViewportCanvasProps {
  t: TFunction;
  viewport: ViewportState;
  grid: {
    backgroundSize: string;
    backgroundPosition: string;
  };
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onWheel: (event: WheelEvent<HTMLElement>) => void;
}

export function ViewportCanvas({
  t,
  viewport,
  grid,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onWheel,
}: ViewportCanvasProps) {
  return (
    <section
      className="editor-shell__canvas"
      aria-label={t('editorShell.workspace.canvasAriaLabel')}
      style={{
        backgroundSize: grid.backgroundSize,
        backgroundPosition: grid.backgroundPosition,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onWheel={onWheel}
    >
      <div
        className="editor-shell__canvas-overlay"
        style={{
          transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <p>{t('editorShell.workspace.canvasPlaceholder')}</p>
      </div>
    </section>
  );
}
