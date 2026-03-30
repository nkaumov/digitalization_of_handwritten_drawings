import { useRef, useState, type PointerEvent } from 'react';

import {
  GEOMETRY_CANVAS_HEIGHT,
  GEOMETRY_CANVAS_WIDTH,
  type GeometryScene,
  type GeometryWarningItem,
} from '@/domains/geometry';
import type { DimensionLabelItem } from '@/domains/dimensions';
import type { SelectionState } from '@/domains/selection';
import type { ViewportState } from '@/domains/viewport';

interface PointDragState {
  kind: 'point';
  contourId: string;
  pointId: string;
  pointerId: number;
}

interface SegmentDragState {
  kind: 'segment';
  contourId: string;
  segmentId: string;
  pointerId: number;
  lastX: number;
  lastY: number;
}

type DragState = PointDragState | SegmentDragState;

interface GeometryLayerProps {
  viewport: ViewportState;
  scene: GeometryScene;
  dimensionLabels: DimensionLabelItem[];
  geometryWarnings: GeometryWarningItem[];
  connectedSegmentKeys: string[];
  selection: SelectionState;
  onPointSelect: (contourId: string, pointId: string, isMultiSelect: boolean) => void;
  onPointMove: (contourId: string, pointId: string, x: number, y: number) => void;
  onPointDragEnd: (contourId: string, pointId: string, x: number, y: number) => void;
  onSegmentSelect: (contourId: string, segmentId: string, isMultiSelect: boolean) => void;
  onSegmentMoveByDelta: (contourId: string, segmentId: string, deltaX: number, deltaY: number) => void;
  onSegmentDragEnd: (contourId: string, segmentId: string) => void;
}

function toSvgCoordinates(
  clientX: number,
  clientY: number,
  svg: SVGSVGElement,
  viewport: ViewportState,
): { x: number; y: number } {
  const rect = svg.getBoundingClientRect();
  const screenX = ((clientX - rect.left) / rect.width) * GEOMETRY_CANVAS_WIDTH;
  const screenY = ((clientY - rect.top) / rect.height) * GEOMETRY_CANVAS_HEIGHT;

  return {
    x: (screenX - viewport.offsetX) / viewport.zoom,
    y: (screenY - viewport.offsetY) / viewport.zoom,
  };
}

export function GeometryLayer({
  viewport,
  scene,
  dimensionLabels,
  geometryWarnings,
  connectedSegmentKeys,
  selection,
  onPointSelect,
  onPointMove,
  onPointDragEnd,
  onSegmentSelect,
  onSegmentMoveByDelta,
  onSegmentDragEnd,
}: GeometryLayerProps) {
  const [hoveredSegment, setHoveredSegment] = useState<{ contourId: string; segmentId: string } | null>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const segmentWarningSet = new Set(
    geometryWarnings
      .filter((warning) => warning.segmentId)
      .map((warning) => `${warning.contourId}:${warning.segmentId}`),
  );

  const pointWarningSet = new Set(
    geometryWarnings
      .filter((warning) => warning.pointId)
      .map((warning) => `${warning.contourId}:${warning.pointId}`),
  );

  const connectedSet = new Set(connectedSegmentKeys);

  const visiblePointKeys = new Set<string>();

  if (hoveredSegment) {
    const hoveredContour = scene.contours.find((item) => item.contour.id === hoveredSegment.contourId);
    const hoveredSegmentNode = hoveredContour?.segments.find((item) => item.segment.id === hoveredSegment.segmentId);
    if (hoveredSegmentNode) {
      visiblePointKeys.add(`${hoveredSegmentNode.contourId}:${hoveredSegmentNode.from.id}`);
      visiblePointKeys.add(`${hoveredSegmentNode.contourId}:${hoveredSegmentNode.to.id}`);
    }
  }

  for (const selected of selection.segments) {
    const selectedContour = scene.contours.find((item) => item.contour.id === selected.contourId);
    const selectedSegmentNode = selectedContour?.segments.find((item) => item.segment.id === selected.segmentId);
    if (selectedSegmentNode) {
      visiblePointKeys.add(`${selectedSegmentNode.contourId}:${selectedSegmentNode.from.id}`);
      visiblePointKeys.add(`${selectedSegmentNode.contourId}:${selectedSegmentNode.to.id}`);
    }
  }

  for (const point of selection.points) {
    visiblePointKeys.add(`${point.contourId}:${point.pointId}`);
  }

  const handleSvgPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState) {
      return;
    }

    const coords = toSvgCoordinates(event.clientX, event.clientY, event.currentTarget, viewport);

    if (dragState.kind === 'point') {
      onPointMove(dragState.contourId, dragState.pointId, coords.x, coords.y);
    } else {
      const deltaX = coords.x - dragState.lastX;
      const deltaY = coords.y - dragState.lastY;
      dragStateRef.current = {
        ...dragState,
        lastX: coords.x,
        lastY: coords.y,
      };
      onSegmentMoveByDelta(dragState.contourId, dragState.segmentId, deltaX, deltaY);
    }

    event.stopPropagation();
  };

  const finishDrag = (svg: SVGSVGElement | null, clientX: number, clientY: number) => {
    const dragState = dragStateRef.current;
    if (!dragState || !svg) {
      dragStateRef.current = null;
      return;
    }

    const coords = toSvgCoordinates(clientX, clientY, svg, viewport);

    if (dragState.kind === 'point') {
      onPointDragEnd(dragState.contourId, dragState.pointId, coords.x, coords.y);
    } else {
      onSegmentDragEnd(dragState.contourId, dragState.segmentId);
    }

    dragStateRef.current = null;
  };

  return (
    <svg
      className="editor-shell__geometry"
      viewBox={`0 0 ${GEOMETRY_CANVAS_WIDTH} ${GEOMETRY_CANVAS_HEIGHT}`}
      aria-hidden="true"
      onPointerMove={handleSvgPointerMove}
      onPointerUp={(event) => finishDrag(event.currentTarget, event.clientX, event.clientY)}
      onPointerCancel={(event) => finishDrag(event.currentTarget, event.clientX, event.clientY)}
      onPointerLeave={() => {
        if (!dragStateRef.current) {
          return;
        }

        dragStateRef.current = null;
      }}
    >
      <g transform={`translate(${viewport.offsetX} ${viewport.offsetY}) scale(${viewport.zoom})`}>
        {scene.contours.map((contourScene) => (
          <g key={contourScene.contour.id}>
          {contourScene.segments.map((segmentNode) => {
            const selected = selection.segments.some(
              (item) =>
                item.contourId === segmentNode.contourId && item.segmentId === segmentNode.segment.id,
            );
            const hasWarning = segmentWarningSet.has(`${segmentNode.contourId}:${segmentNode.segment.id}`);
            const isConnected = connectedSet.has(`${segmentNode.contourId}:${segmentNode.segment.id}`);

            return (
              <line
                key={segmentNode.segment.id}
                data-interactive="true"
                className={[
                  'editor-shell__segment',
                  selected ? 'is-selected' : '',
                  hasWarning ? 'is-warning' : '',
                  isConnected ? 'is-connected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                x1={segmentNode.from.x}
                y1={segmentNode.from.y}
                x2={segmentNode.to.x}
                y2={segmentNode.to.y}
                onPointerEnter={() =>
                  setHoveredSegment({
                    contourId: segmentNode.contourId,
                    segmentId: segmentNode.segment.id,
                  })
                }
                onPointerLeave={() => setHoveredSegment(null)}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  const svg = event.currentTarget.ownerSVGElement;
                  if (!svg) {
                    return;
                  }

                  const coords = toSvgCoordinates(event.clientX, event.clientY, svg, viewport);
                  dragStateRef.current = {
                    kind: 'segment',
                    contourId: segmentNode.contourId,
                    segmentId: segmentNode.segment.id,
                    pointerId: event.pointerId,
                    lastX: coords.x,
                    lastY: coords.y,
                  };

                  event.currentTarget.setPointerCapture(event.pointerId);
                  onSegmentSelect(segmentNode.contourId, segmentNode.segment.id, event.shiftKey);
                }}
                onPointerUp={(event) => {
                  finishDrag(event.currentTarget.ownerSVGElement, event.clientX, event.clientY);
                }}
              />
            );
          })}

          {contourScene.points.map((pointNode) => {
            const pointKey = `${pointNode.contourId}:${pointNode.point.id}`;
            const visible = visiblePointKeys.has(pointKey);
            if (!visible) {
              return null;
            }

            const selected = selection.points.some(
              (point) =>
                point.contourId === pointNode.contourId && point.pointId === pointNode.point.id,
            );
            const hasWarning = pointWarningSet.has(pointKey);

            return (
              <circle
                key={pointNode.point.id}
                data-interactive="true"
                className={[
                  'editor-shell__point',
                  selected ? 'is-selected' : '',
                  hasWarning ? 'is-warning' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                cx={pointNode.point.x}
                cy={pointNode.point.y}
                r={5}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  dragStateRef.current = {
                    kind: 'point',
                    contourId: pointNode.contourId,
                    pointId: pointNode.point.id,
                    pointerId: event.pointerId,
                  };

                  event.currentTarget.setPointerCapture(event.pointerId);
                  onPointSelect(pointNode.contourId, pointNode.point.id, event.shiftKey);
                }}
                onPointerUp={(event) => {
                  finishDrag(event.currentTarget.ownerSVGElement, event.clientX, event.clientY);
                }}
              />
            );
          })}
          </g>
        ))}

        {dimensionLabels.map((label) => (
          <g
            key={label.dimensionId}
            className={label.hasWarning ? 'editor-shell__dimension is-warning' : 'editor-shell__dimension'}
          >
            <rect x={label.x - label.boxWidth / 2} y={label.y - 9} width={label.boxWidth} height={18} rx={4} />
            <text x={label.x} y={label.y + 4}>
              {label.text}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}
