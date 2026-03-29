import type { ContourPayload, DrawingPayload, SegmentPayload } from '@contracts';

import { normalizeSegmentOrder, withClosedFlag } from './closure';
import type { PointRef, SegmentRef } from './contracts';

function updateContour(
  payload: DrawingPayload,
  contourId: string,
  updater: (contour: ContourPayload) => ContourPayload,
): DrawingPayload {
  let changed = false;

  const contours = payload.contours.map((contour) => {
    if (contour.id !== contourId) {
      return contour;
    }

    changed = true;
    return withClosedFlag(updater(contour));
  });

  return changed
    ? {
        ...payload,
        contours,
      }
    : payload;
}

function nextSegmentId(contour: ContourPayload): string {
  const maxSuffix = contour.segments.reduce((max, segment) => {
    const match = segment.id.match(/(\d+)$/);
    if (!match) {
      return max;
    }

    const rawSuffix = match[1];
    if (!rawSuffix) {
      return max;
    }

    const suffix = Number.parseInt(rawSuffix, 10);
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0);

  return `${contour.id}-s${maxSuffix + 1}`;
}

function segmentExists(contour: ContourPayload, a: string, b: string): boolean {
  return contour.segments.some(
    (segment) =>
      (segment.from === a && segment.to === b) ||
      (segment.from === b && segment.to === a),
  );
}

export function createSegmentBetweenPoints(payload: DrawingPayload, refs: PointRef[]): DrawingPayload {
  if (refs.length !== 2) {
    return payload;
  }

  const [first, second] = refs;
  if (!first || !second || first.pointId === second.pointId || first.contourId !== second.contourId) {
    return payload;
  }

  return updateContour(payload, first.contourId, (contour) => {
    if (segmentExists(contour, first.pointId, second.pointId)) {
      return contour;
    }

    const segment: SegmentPayload = {
      id: nextSegmentId(contour),
      from: first.pointId,
      to: second.pointId,
      kind: 'line',
      order: contour.segments.length + 1,
      confidence: null,
    };

    return {
      ...contour,
      segments: [...contour.segments, segment],
    };
  });
}

export function movePoint(payload: DrawingPayload, pointRef: PointRef, x: number, y: number): DrawingPayload {
  return updateContour(payload, pointRef.contourId, (contour) => ({
    ...contour,
    points: contour.points.map((point) =>
      point.id === pointRef.pointId
        ? {
            ...point,
            x,
            y,
          }
        : point,
    ),
  }));
}

export function deleteSegment(payload: DrawingPayload, ref: SegmentRef): DrawingPayload {
  return updateContour(payload, ref.contourId, (contour) => ({
    ...contour,
    segments: normalizeSegmentOrder(
      contour.segments.filter((segment) => segment.id !== ref.segmentId),
    ),
  }));
}

export function connectPoints(payload: DrawingPayload, refs: PointRef[]): DrawingPayload {
  if (refs.length !== 2) {
    return payload;
  }

  const [primary, secondary] = refs;
  if (!primary || !secondary || primary.pointId === secondary.pointId || primary.contourId !== secondary.contourId) {
    return payload;
  }

  return updateContour(payload, primary.contourId, (contour) => {
    if (!contour.points.some((point) => point.id === primary.pointId) || !contour.points.some((point) => point.id === secondary.pointId)) {
      return contour;
    }

    const rewiredSegments = contour.segments
      .map((segment) => ({
        ...segment,
        from: segment.from === secondary.pointId ? primary.pointId : segment.from,
        to: segment.to === secondary.pointId ? primary.pointId : segment.to,
      }))
      .filter((segment) => segment.from !== segment.to);

    const deduped = new Map<string, SegmentPayload>();
    for (const segment of rewiredSegments) {
      const key = [segment.from, segment.to].sort().join('::');
      if (!deduped.has(key)) {
        deduped.set(key, segment);
      }
    }

    return {
      ...contour,
      points: contour.points.filter((point) => point.id !== secondary.pointId),
      segments: normalizeSegmentOrder([...deduped.values()]),
    };
  });
}
