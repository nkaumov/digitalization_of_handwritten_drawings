import type { GeometryScene } from '@/domains/geometry';
import type { SelectionState } from '@/domains/selection';

interface GeometryLayerProps {
  scene: GeometryScene;
  selection: SelectionState;
  onPointSelect: (contourId: string, pointId: string) => void;
  onSegmentSelect: (contourId: string, segmentId: string) => void;
}

export function GeometryLayer({ scene, selection, onPointSelect, onSegmentSelect }: GeometryLayerProps) {
  return (
    <svg className="editor-shell__geometry" viewBox="0 0 640 360" aria-hidden="true">
      {scene.contours.map((contourScene) => (
        <g key={contourScene.contour.id}>
          {contourScene.segments.map((segmentNode) => {
            const selected =
              selection.target?.kind === 'segment' &&
              selection.target.contourId === segmentNode.contourId &&
              selection.target.segmentId === segmentNode.segment.id;

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
            const selected =
              selection.target?.kind === 'point' &&
              selection.target.contourId === pointNode.contourId &&
              selection.target.pointId === pointNode.point.id;

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
                  onPointSelect(pointNode.contourId, pointNode.point.id);
                }}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
