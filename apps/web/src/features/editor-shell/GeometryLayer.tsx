import { useRef, type PointerEvent } from 'react';

import {
  GEOMETRY_CANVAS_HEIGHT,
  GEOMETRY_CANVAS_WIDTH,
  type GeometryScene,
} from '@/domains/geometry';
import type { SelectionState } from '@/domains/selection';

interface DragPointState {
  contourId: string;
  pointId: string;
  pointerId: number;
}

interface GeometryLayerProps {
  scene: GeometryScene;
  selection: SelectionState;
  onPointSelect: (contourId: string, pointId: string, isMultiSelect: boolean) => void;
  onPointMove: (contourId: string, pointId: string, x: number, y: number) => void;
  onSegmentSelect: (contourId: string, segmentId: string) => void;
}

function toSvgCoordinates(event: PointerEvent<SVGSVGElement>): { x: number; y: number } {
  const rect = event.currentTarget.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * GEOMETRY_CANVAS_WIDTH;
  const y = ((event.clientY - rect.top) / rect.height) * GEOMETRY_CANVAS_HEIGHT;

  return {
    x: Math.max(0, Math.min(GEOMETRY_CANVAS_WIDTH, x)),
    y: Math.max(0, Math.min(GEOMETRY_CANVAS_HEIGHT, y)),
  };
}

export function GeometryLayer({
  scene,
  selection,
  onPointSelect,
  onPointMove,
  onSegmentSelect,
}: GeometryLayerProps) {
  const dragStateRef = useRef<DragPointState | null>(null);

  const handleSvgPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState) {
      return;
    }

    const coords = toSvgCoordinates(event);
    onPointMove(dragState.contourId, dragState.pointId, coords.x, coords.y);
    event.stopPropagation();
  };

  const handleSvgPointerUp = () => {
    dragStateRef.current = null;
  };

  return (
    <svg
      className="editor-shell__geometry"
      viewBox={`0 0 ${GEOMETRY_CANVAS_WIDTH} ${GEOMETRY_CANVAS_HEIGHT}`}
      aria-hidden="true"
      onPointerMove={handleSvgPointerMove}
      onPointerUp={handleSvgPointerUp}
      onPointerCancel={handleSvgPointerUp}
      onPointerLeave={handleSvgPointerUp}
    >
      {scene.contours.map((contourScene) => (
        <g key={contourScene.contour.id}>
          {contourScene.segments.map((segmentNode) => {
            const selected =
              selection.segment?.contourId === segmentNode.contourId &&
              selection.segment.segmentId === segmentNode.segment.id;

            return (
              <line
                key={segmentNode.segment.id}
                data-interactive="true"
                className={selected ? 'editor-shell__segment is-selected' : 'editor-shell__segment'}
                x1={segmentNode.from.x}
                y1={segmentNode.from.y}
                x2={segmentNode.to.x}
                y2={segmentNode.to.y}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  onSegmentSelect(segmentNode.contourId, segmentNode.segment.id);
                }}
              />
            );
          })}

          {contourScene.points.map((pointNode) => {
            const selected = selection.points.some(
              (point) =>
                point.contourId === pointNode.contourId && point.pointId === pointNode.point.id,
            );

            return (
              <circle
                key={pointNode.point.id}
                data-interactive="true"
                className={selected ? 'editor-shell__point is-selected' : 'editor-shell__point'}
                cx={pointNode.point.x}
                cy={pointNode.point.y}
                r={5}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  dragStateRef.current = {
                    contourId: pointNode.contourId,
                    pointId: pointNode.point.id,
                    pointerId: event.pointerId,
                  };

                  event.currentTarget.setPointerCapture(event.pointerId);
                  onPointSelect(pointNode.contourId, pointNode.point.id, event.shiftKey);
                }}
                onPointerUp={(event) => {
                  if (dragStateRef.current?.pointerId === event.pointerId) {
                    dragStateRef.current = null;
                  }
                }}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
