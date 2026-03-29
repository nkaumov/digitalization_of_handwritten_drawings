import { useMemo, useState } from 'react';

import {
  buildGeometryScene,
  connectPoints,
  createSegmentBetweenPoints,
  deleteSegment,
  movePoint,
  type PointRef,
  type SegmentRef,
} from '@/domains/geometry';
import type { DrawingPayload } from '@contracts';

export interface DrawingEditorApi {
  drawing: DrawingPayload;
  scene: ReturnType<typeof buildGeometryScene>;
  createLine: (points: PointRef[]) => void;
  connectLines: (points: PointRef[]) => void;
  movePoint: (point: PointRef, x: number, y: number) => void;
  deleteSegment: (segment: SegmentRef) => void;
}

export function useDrawingEditor(initialDrawing: DrawingPayload): DrawingEditorApi {
  const [drawing, setDrawing] = useState(initialDrawing);

  const scene = useMemo(() => buildGeometryScene(drawing), [drawing]);

  return useMemo(
    () => ({
      drawing,
      scene,
      createLine: (points) => {
        setDrawing((current) => createSegmentBetweenPoints(current, points));
      },
      connectLines: (points) => {
        setDrawing((current) => connectPoints(current, points));
      },
      movePoint: (point, x, y) => {
        setDrawing((current) => movePoint(current, point, x, y));
      },
      deleteSegment: (segment) => {
        setDrawing((current) => deleteSegment(current, segment));
      },
    }),
    [drawing, scene],
  );
}
