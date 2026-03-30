import { useMemo, useState } from 'react';

import { buildDimensionLabels, updateDimensionRawText, type DimensionLabelItem } from '@/domains/dimensions';
import {
  addDefaultLine,
  addRectangleContour,
  buildGeometryScene,
  collectGeometryWarnings,
  connectPoints,
  connectPointsIfCoincident,
  createSegmentBetweenPoints,
  duplicateSegments,
  deleteSegment,
  disconnectSegments,
  moveSegmentByDelta,
  moveSegmentsByDelta,
  movePoint,
  movePointWithLockedSegmentLength,
  snapSegmentEndpointAndConnect,
  updateSegmentAngle,
  updateSegmentLength,
  type PointRef,
  type SegmentRef,
} from '@/domains/geometry';
import type { DrawingPayload } from '@contracts';

export interface DrawingEditorApi {
  drawing: DrawingPayload;
  scene: ReturnType<typeof buildGeometryScene>;
  dimensionLabels: DimensionLabelItem[];
  geometryWarnings: ReturnType<typeof collectGeometryWarnings>;
  createLine: (points: PointRef[]) => void;
  connectLines: (points: PointRef[]) => void;
  connectLinesIfCoincident: (points: PointRef[]) => void;
  snapSegmentEndpointAndConnect: (
    segment: SegmentRef,
    movingPointId: string,
    targetPoint: PointRef,
  ) => void;
  movePoint: (point: PointRef, x: number, y: number) => void;
  movePointWithLockedSegmentLength: (point: PointRef, segment: SegmentRef, x: number, y: number) => void;
  moveSegmentByDelta: (segment: SegmentRef, deltaX: number, deltaY: number) => void;
  moveSegmentsByDelta: (segments: SegmentRef[], deltaX: number, deltaY: number) => void;
  addDefaultLine: (length: number) => void;
  addRectangleContour: (width: number, length: number) => void;
  updateSegmentLength: (segment: SegmentRef, length: number) => void;
  updateSegmentAngle: (segment: SegmentRef, angle: number) => void;
  duplicateSegments: (segments: SegmentRef[], offsetX?: number, offsetY?: number) => SegmentRef[];
  deleteSegment: (segment: SegmentRef) => void;
  disconnectSegments: (segments: SegmentRef[]) => void;
  updateDimensionRawText: (contourId: string, dimensionId: string, rawText: string) => void;
  canUndo: boolean;
  undo: () => void;
  replaceDrawing: (payload: DrawingPayload) => void;
}

export function useDrawingEditor(initialDrawing: DrawingPayload): DrawingEditorApi {
  const [drawing, setDrawing] = useState(initialDrawing);
  const [history, setHistory] = useState<DrawingPayload[]>([]);

  const scene = useMemo(() => buildGeometryScene(drawing), [drawing]);
  const dimensionLabels = useMemo(() => buildDimensionLabels(scene), [scene]);
  const geometryWarnings = useMemo(() => collectGeometryWarnings(drawing), [drawing]);

  return useMemo(
    () => {
      const applyChange = (updater: (current: DrawingPayload) => DrawingPayload) => {
        setDrawing((current) => {
          const next = updater(current);
          if (next !== current) {
            setHistory((prev) => [...prev, current]);
          }
          return next;
        });
      };

      return ({
      drawing,
      scene,
      dimensionLabels,
      geometryWarnings,
      createLine: (points) => {
        applyChange((current) => createSegmentBetweenPoints(current, points));
      },
      connectLines: (points) => {
        applyChange((current) => connectPoints(current, points));
      },
      connectLinesIfCoincident: (points) => {
        applyChange((current) => connectPointsIfCoincident(current, points));
      },
      snapSegmentEndpointAndConnect: (segment, movingPointId, targetPoint) => {
        applyChange((current) =>
          snapSegmentEndpointAndConnect(current, segment, movingPointId, targetPoint),
        );
      },
      movePoint: (point, x, y) => {
        applyChange((current) => movePoint(current, point, x, y));
      },
      movePointWithLockedSegmentLength: (point, segment, x, y) => {
        applyChange((current) => movePointWithLockedSegmentLength(current, point, segment, x, y));
      },
      moveSegmentByDelta: (segment, deltaX, deltaY) => {
        applyChange((current) => moveSegmentByDelta(current, segment, deltaX, deltaY));
      },
      moveSegmentsByDelta: (segments, deltaX, deltaY) => {
        applyChange((current) => moveSegmentsByDelta(current, segments, deltaX, deltaY));
      },
      addDefaultLine: (length) => {
        applyChange((current) => addDefaultLine(current, length));
      },
      addRectangleContour: (width, length) => {
        applyChange((current) => addRectangleContour(current, width, length));
      },
      updateSegmentLength: (segment, length) => {
        applyChange((current) => updateSegmentLength(current, segment, length));
      },
      updateSegmentAngle: (segment, angle) => {
        applyChange((current) => updateSegmentAngle(current, segment, angle));
      },
      duplicateSegments: (segments, offsetX = 24, offsetY = 24) => {
        let created: SegmentRef[] = [];
        applyChange((current) => {
          const result = duplicateSegments(current, segments, offsetX, offsetY);
          created = result.created;
          return result.payload;
        });
        return created;
      },
      deleteSegment: (segment) => {
        applyChange((current) => deleteSegment(current, segment));
      },
      disconnectSegments: (segments) => {
        applyChange((current) => disconnectSegments(current, segments));
      },
      updateDimensionRawText: (contourId, dimensionId, rawText) => {
        applyChange((current) => updateDimensionRawText(current, contourId, dimensionId, rawText));
      },
      canUndo: history.length > 0,
      undo: () => {
        setHistory((prev) => {
          const snapshot = prev[prev.length - 1];
          if (snapshot) {
            setDrawing(snapshot);
          }
          return prev.slice(0, -1);
        });
      },
      replaceDrawing: (payload) => {
        setHistory([]);
        setDrawing(payload);
      },
      });
    },
    [dimensionLabels, drawing, geometryWarnings, history.length, scene],
  );
}
