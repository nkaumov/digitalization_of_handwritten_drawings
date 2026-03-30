import type { TFunction } from 'i18next';
import { useMemo, useState, type PointerEvent, type WheelEvent } from 'react';

import type { DimensionLabelItem } from '@/domains/dimensions';
import {
  GEOMETRY_CANVAS_HEIGHT,
  GEOMETRY_CANVAS_WIDTH,
  type GeometryScene,
  type GeometryWarningItem,
} from '@/domains/geometry';
import type { SelectionState } from '@/domains/selection';
import type { ViewportState } from '@/domains/viewport';
import { GeometryLayer } from '@/features/editor-shell/GeometryLayer';

interface ViewportCanvasProps {
  t: TFunction;
  viewport: ViewportState;
  grid: {
    backgroundSize: string;
    backgroundPosition: string;
  };
  scene: GeometryScene;
  dimensionLabels: DimensionLabelItem[];
  geometryWarnings: GeometryWarningItem[];
  selection: SelectionState;
  connectedSegmentKeys: string[];
  onPointSelect: (contourId: string, pointId: string, isMultiSelect: boolean) => void;
  onPointMove: (contourId: string, pointId: string, x: number, y: number) => void;
  onPointDragEnd: (contourId: string, pointId: string, x: number, y: number) => void;
  onSegmentSelect: (contourId: string, segmentId: string, isMultiSelect: boolean) => void;
  onSegmentMoveByDelta: (contourId: string, segmentId: string, deltaX: number, deltaY: number) => void;
  onSegmentDragEnd: (contourId: string, segmentId: string) => void;
  onSelectionBoxSelect: (
    segments: Array<{ contourId: string; segmentId: string }>,
    append: boolean,
  ) => void;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onWheel: (event: WheelEvent<HTMLElement>) => void;
}

function toScreenCoordinates(event: PointerEvent<HTMLElement>, element: HTMLElement): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function intersectsRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): boolean {
  const inside = (x: number, y: number) => x >= minX && x <= maxX && y >= minY && y <= maxY;
  if (inside(x1, y1) || inside(x2, y2)) {
    return true;
  }

  const edges = [
    [minX, minY, maxX, minY],
    [maxX, minY, maxX, maxY],
    [maxX, maxY, minX, maxY],
    [minX, maxY, minX, minY],
  ] as const;

  const cross = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
    (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const onSegment = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
    Math.min(ax, bx) <= cx &&
    cx <= Math.max(ax, bx) &&
    Math.min(ay, by) <= cy &&
    cy <= Math.max(ay, by);

  const intersects = (
    ax: number,
    ay: number,
    bx: number,
    by: number,
    cx: number,
    cy: number,
    dx: number,
    dy: number,
  ) => {
    const d1 = cross(ax, ay, bx, by, cx, cy);
    const d2 = cross(ax, ay, bx, by, dx, dy);
    const d3 = cross(cx, cy, dx, dy, ax, ay);
    const d4 = cross(cx, cy, dx, dy, bx, by);

    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
      return true;
    }

    if (d1 === 0 && onSegment(ax, ay, bx, by, cx, cy)) {
      return true;
    }
    if (d2 === 0 && onSegment(ax, ay, bx, by, dx, dy)) {
      return true;
    }
    if (d3 === 0 && onSegment(cx, cy, dx, dy, ax, ay)) {
      return true;
    }
    if (d4 === 0 && onSegment(cx, cy, dx, dy, bx, by)) {
      return true;
    }

    return false;
  };

  return edges.some(([ex1, ey1, ex2, ey2]) => intersects(x1, y1, x2, y2, ex1, ey1, ex2, ey2));
}

export function ViewportCanvas({
  t,
  viewport,
  grid,
  scene,
  dimensionLabels,
  geometryWarnings,
  selection,
  connectedSegmentKeys,
  onPointSelect,
  onPointMove,
  onPointDragEnd,
  onSegmentSelect,
  onSegmentMoveByDelta,
  onSegmentDragEnd,
  onSelectionBoxSelect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  onWheel,
}: ViewportCanvasProps) {
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    append: boolean;
  } | null>(null);

  const boxStyle = useMemo(() => {
    if (!selectionBox) {
      return null;
    }

    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const width = Math.abs(selectionBox.endX - selectionBox.startX);
    const height = Math.abs(selectionBox.endY - selectionBox.startY);

    return { left, top, width, height };
  }, [selectionBox]);

  return (
    <section
      className="editor-shell__canvas"
      aria-label={t('editor.canvas.ariaLabel')}
      style={{
        backgroundSize: grid.backgroundSize,
        backgroundPosition: grid.backgroundPosition,
      }}
      onPointerDown={(event) => {
        onPointerDown(event);

        const target = event.target as HTMLElement;
        if (event.button !== 0 || target.closest('[data-interactive="true"]')) {
          return;
        }

        const coords = toScreenCoordinates(event, event.currentTarget);
        setSelectionBox({
          startX: coords.x,
          startY: coords.y,
          endX: coords.x,
          endY: coords.y,
          append: event.shiftKey,
        });
      }}
      onPointerMove={(event) => {
        onPointerMove(event);

        if (!selectionBox) {
          return;
        }

        const coords = toScreenCoordinates(event, event.currentTarget);
        setSelectionBox((current) =>
          current
            ? {
                ...current,
                endX: coords.x,
                endY: coords.y,
              }
            : current,
        );
      }}
      onPointerUp={(event) => {
        onPointerUp();

        if (!selectionBox) {
          return;
        }

        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const minX = (Math.min(selectionBox.startX, selectionBox.endX) / Math.max(rect.width, 1)) * GEOMETRY_CANVAS_WIDTH;
        const maxX = (Math.max(selectionBox.startX, selectionBox.endX) / Math.max(rect.width, 1)) * GEOMETRY_CANVAS_WIDTH;
        const minY = (Math.min(selectionBox.startY, selectionBox.endY) / Math.max(rect.height, 1)) * GEOMETRY_CANVAS_HEIGHT;
        const maxY = (Math.max(selectionBox.startY, selectionBox.endY) / Math.max(rect.height, 1)) * GEOMETRY_CANVAS_HEIGHT;

        const moved =
          Math.abs(selectionBox.endX - selectionBox.startX) +
          Math.abs(selectionBox.endY - selectionBox.startY);
        if (moved > 2) {
          const hitSegments = scene.segments
            .filter((segment) => {
              const x1 = segment.from.x * viewport.zoom + viewport.offsetX;
              const y1 = segment.from.y * viewport.zoom + viewport.offsetY;
              const x2 = segment.to.x * viewport.zoom + viewport.offsetX;
              const y2 = segment.to.y * viewport.zoom + viewport.offsetY;

              return intersectsRect(x1, y1, x2, y2, minX, minY, maxX, maxY);
            })
            .map((segment) => ({
              contourId: segment.contourId,
              segmentId: segment.segment.id,
            }));

          onSelectionBoxSelect(hitSegments, selectionBox.append);
        }

        setSelectionBox(null);
      }}
      onPointerLeave={() => {
        onPointerLeave();
        setSelectionBox(null);
      }}
      onWheel={onWheel}
    >
      <div className="editor-shell__canvas-overlay">
        <GeometryLayer
          viewport={viewport}
          scene={scene}
          dimensionLabels={dimensionLabels}
          geometryWarnings={geometryWarnings}
          connectedSegmentKeys={connectedSegmentKeys}
          selection={selection}
          onPointSelect={onPointSelect}
          onPointMove={onPointMove}
          onPointDragEnd={onPointDragEnd}
          onSegmentSelect={onSegmentSelect}
          onSegmentMoveByDelta={onSegmentMoveByDelta}
          onSegmentDragEnd={onSegmentDragEnd}
        />
      </div>

      {boxStyle ? (
        <div
          className="editor-selection-box"
          style={{
            left: boxStyle.left,
            top: boxStyle.top,
            width: boxStyle.width,
            height: boxStyle.height,
          }}
        />
      ) : null}
    </section>
  );
}
