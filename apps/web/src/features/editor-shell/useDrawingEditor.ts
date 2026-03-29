import { useMemo, useState } from 'react';

import {
  buildGeometryScene,
  collectGeometryWarnings,
  connectPoints,
  createSegmentBetweenPoints,
  deleteSegment,
  movePoint,
  type PointRef,
  type SegmentRef,
} from '@/domains/geometry';
import { buildDimensionLabels, updateDimensionRawText, type DimensionLabelItem } from '@/domains/dimensions';
import type { DrawingPayload } from '@contracts';

export interface DrawingEditorApi {
  drawing: DrawingPayload;
  scene: ReturnType<typeof buildGeometryScene>;
  dimensionLabels: DimensionLabelItem[];
  geometryWarnings: ReturnType<typeof collectGeometryWarnings>;
  createLine: (points: PointRef[]) => void;
  connectLines: (points: PointRef[]) => void;
  movePoint: (point: PointRef, x: number, y: number) => void;
  deleteSegment: (segment: SegmentRef) => void;
  updateDimensionRawText: (contourId: string, dimensionId: string, rawText: string) => void;
}

export function useDrawingEditor(initialDrawing: DrawingPayload): DrawingEditorApi {
  const [drawing, setDrawing] = useState(initialDrawing);

  const scene = useMemo(() => buildGeometryScene(drawing), [drawing]);
  const dimensionLabels = useMemo(() => buildDimensionLabels(scene), [scene]);
  const geometryWarnings = useMemo(() => collectGeometryWarnings(drawing), [drawing]);

  return useMemo(
    () => ({
      drawing,
      scene,
      dimensionLabels,
      geometryWarnings,
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
      updateDimensionRawText: (contourId, dimensionId, rawText) => {
        setDrawing((current) => updateDimensionRawText(current, contourId, dimensionId, rawText));
      },
    }),
    [dimensionLabels, drawing, geometryWarnings, scene],
  );
}
