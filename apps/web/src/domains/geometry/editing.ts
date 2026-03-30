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

function nextContourId(payload: DrawingPayload): string {
  const maxSuffix = payload.contours.reduce((max, contour) => {
    const match = contour.id.match(/(\d+)$/);
    if (!match?.[1]) {
      return max;
    }
    const suffix = Number.parseInt(match[1], 10);
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0);

  return `contour-${maxSuffix + 1}`;
}

function nextSegmentId(contour: ContourPayload): string {
  const maxSuffix = contour.segments.reduce((max, segment) => {
    const match = segment.id.match(/(\d+)$/);
    if (!match?.[1]) {
      return max;
    }

    const suffix = Number.parseInt(match[1], 10);
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0);

  return `${contour.id}-s${maxSuffix + 1}`;
}

function nextPointId(contour: ContourPayload): string {
  const maxSuffix = contour.points.reduce((max, point) => {
    const match = point.id.match(/(\d+)$/);
    if (!match?.[1]) {
      return max;
    }

    const suffix = Number.parseInt(match[1], 10);
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0);

  return `${contour.id}-p${maxSuffix + 1}`;
}

function nextDimensionId(contour: ContourPayload): string {
  const maxSuffix = contour.dimensions.reduce((max, dimension) => {
    const match = dimension.id.match(/(\d+)$/);
    if (!match?.[1]) {
      return max;
    }

    const suffix = Number.parseInt(match[1], 10);
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0);

  return `${contour.id}-d${maxSuffix + 1}`;
}

function nextNumericSuffix(existingIds: string[]): number {
  return existingIds.reduce((max, id) => {
    const match = id.match(/(\d+)$/);
    if (!match?.[1]) {
      return max;
    }
    const suffix = Number.parseInt(match[1], 10);
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0);
}

function pointNumericSuffix(pointId: string): number {
  const match = pointId.match(/(\d+)$/);
  if (!match?.[1]) {
    return 0;
  }

  const suffix = Number.parseInt(match[1], 10);
  return Number.isFinite(suffix) ? suffix : 0;
}

function segmentExists(contour: ContourPayload, a: string, b: string): boolean {
  return contour.segments.some(
    (segment) =>
      (segment.from === a && segment.to === b) ||
      (segment.from === b && segment.to === a),
  );
}

function pruneOrphanDimensions(contour: ContourPayload): ContourPayload {
  const segmentIds = new Set(contour.segments.map((segment) => segment.id));

  return {
    ...contour,
    dimensions: contour.dimensions.filter((dimension) => segmentIds.has(dimension.segmentId)),
  };
}

function syncDimensionValuesForPointMove(
  contour: ContourPayload,
  movedPointId: string,
): ContourPayload {
  const pointById = new Map(contour.points.map((point) => [point.id, point]));
  const affectedSegmentIds = new Set(
    contour.segments
      .filter((segment) => segment.from === movedPointId || segment.to === movedPointId)
      .map((segment) => segment.id),
  );

  if (affectedSegmentIds.size === 0) {
    return contour;
  }

  return {
    ...contour,
    dimensions: contour.dimensions.map((dimension) => {
      if (!affectedSegmentIds.has(dimension.segmentId)) {
        return dimension;
      }

      const segment = contour.segments.find((item) => item.id === dimension.segmentId);
      if (!segment) {
        return dimension;
      }

      const from = pointById.get(segment.from);
      const to = pointById.get(segment.to);
      if (!from || !to) {
        return dimension;
      }

      const length = Math.hypot(to.x - from.x, to.y - from.y);

      return {
        ...dimension,
        rawText: length.toFixed(1),
        parsedValue: length,
        normalizedValueMm: length,
        isResolved: true,
        warnings: [],
      };
    }),
  };
}

export function addPoint(payload: DrawingPayload, contourId: string | null, x: number, y: number): DrawingPayload {
  if (payload.contours.length === 0) {
    const newContour: ContourPayload = {
      id: 'contour-1',
      closed: false,
      confidence: null,
      warnings: [],
      dimensions: [],
      points: [{ id: 'contour-1-p1', x, y }],
      segments: [],
    };

    return {
      ...payload,
      contours: [newContour],
    };
  }

  const targetContourId = contourId ?? payload.contours[0]?.id;
  if (!targetContourId) {
    return payload;
  }

  return updateContour(payload, targetContourId, (contour) => ({
    ...contour,
    points: [
      ...contour.points,
      {
        id: nextPointId(contour),
        x,
        y,
      },
    ],
  }));
}

export function addDefaultLine(payload: DrawingPayload, length: number = 140): DrawingPayload {
  const normalizedLength = Number.isFinite(length) && length > 0 ? length : 140;

  if (payload.contours.length === 0) {
    const contourId = 'contour-1';
    const p1 = { id: `${contourId}-p1`, x: 120, y: 120 };
    const p2 = { id: `${contourId}-p2`, x: 120 + normalizedLength, y: 120 };
    const segmentId = `${contourId}-s1`;

    return {
      ...payload,
      contours: [
        {
          id: contourId,
          closed: false,
          confidence: null,
          warnings: [],
          dimensions: [
            {
              id: `${contourId}-d1`,
              segmentId,
              rawText: normalizedLength.toFixed(1),
              parsedValue: normalizedLength,
              normalizedValueMm: normalizedLength,
              assumedUnit: 'mm',
              confidence: null,
              isResolved: true,
              warnings: [],
            },
          ],
          points: [p1, p2],
          segments: [
            {
              id: segmentId,
              from: p1.id,
              to: p2.id,
              kind: 'line',
              order: 1,
              confidence: null,
            },
          ],
        },
      ],
    };
  }

  const targetContourId = payload.contours[0]?.id;
  if (!targetContourId) {
    return payload;
  }

  return updateContour(payload, targetContourId, (contour) => {
    const p1 = { id: nextPointId(contour), x: 120, y: 120 };
    const p2 = {
      id: `${contour.id}-p${pointNumericSuffix(p1.id) + 1}`,
      x: 120 + normalizedLength,
      y: 120,
    };

    const nextSegment: SegmentPayload = {
      id: nextSegmentId(contour),
      from: p1.id,
      to: p2.id,
      kind: 'line',
      order: contour.segments.length + 1,
      confidence: null,
    };

    return {
      ...contour,
      dimensions: [
        ...contour.dimensions,
        {
          id: nextDimensionId(contour),
          segmentId: nextSegment.id,
          rawText: normalizedLength.toFixed(1),
          parsedValue: normalizedLength,
          normalizedValueMm: normalizedLength,
          assumedUnit: 'mm',
          confidence: null,
          isResolved: true,
          warnings: [],
        },
      ],
      points: [...contour.points, p1, p2],
      segments: [...contour.segments, nextSegment],
    };
  });
}

export function addRectangleContour(
  payload: DrawingPayload,
  width: number,
  length: number,
): DrawingPayload {
  if (!Number.isFinite(width) || !Number.isFinite(length) || width <= 0 || length <= 0) {
    return payload;
  }

  const contourId = nextContourId(payload);
  const index = payload.contours.length;
  const startX = 120 + index * 18;
  const startY = 120 + index * 18;

  const p1 = { id: `${contourId}-p1`, x: startX, y: startY };
  const p2 = { id: `${contourId}-p2`, x: startX + width, y: startY };
  const p3 = { id: `${contourId}-p3`, x: startX + width, y: startY + length };
  const p4 = { id: `${contourId}-p4`, x: startX, y: startY + length };

  const s1 = { id: `${contourId}-s1`, from: p1.id, to: p2.id, kind: 'line' as const, order: 1, confidence: null };
  const s2 = { id: `${contourId}-s2`, from: p2.id, to: p3.id, kind: 'line' as const, order: 2, confidence: null };
  const s3 = { id: `${contourId}-s3`, from: p3.id, to: p4.id, kind: 'line' as const, order: 3, confidence: null };
  const s4 = { id: `${contourId}-s4`, from: p4.id, to: p1.id, kind: 'line' as const, order: 4, confidence: null };

  const contour: ContourPayload = {
    id: contourId,
    closed: true,
    confidence: null,
    warnings: [],
    points: [p1, p2, p3, p4],
    segments: [s1, s2, s3, s4],
    dimensions: [
      {
        id: `${contourId}-d1`,
        segmentId: s1.id,
        rawText: width.toFixed(1),
        parsedValue: width,
        normalizedValueMm: width,
        assumedUnit: 'mm',
        confidence: null,
        isResolved: true,
        warnings: [],
      },
      {
        id: `${contourId}-d2`,
        segmentId: s2.id,
        rawText: length.toFixed(1),
        parsedValue: length,
        normalizedValueMm: length,
        assumedUnit: 'mm',
        confidence: null,
        isResolved: true,
        warnings: [],
      },
      {
        id: `${contourId}-d3`,
        segmentId: s3.id,
        rawText: width.toFixed(1),
        parsedValue: width,
        normalizedValueMm: width,
        assumedUnit: 'mm',
        confidence: null,
        isResolved: true,
        warnings: [],
      },
      {
        id: `${contourId}-d4`,
        segmentId: s4.id,
        rawText: length.toFixed(1),
        parsedValue: length,
        normalizedValueMm: length,
        assumedUnit: 'mm',
        confidence: null,
        isResolved: true,
        warnings: [],
      },
    ],
  };

  return {
    ...payload,
    contours: [...payload.contours, contour],
  };
}

export function updateSegmentLength(
  payload: DrawingPayload,
  ref: SegmentRef,
  length: number,
): DrawingPayload {
  if (!Number.isFinite(length) || length <= 0) {
    return payload;
  }

  return updateContour(payload, ref.contourId, (contour) => {
    const segment = contour.segments.find((item) => item.id === ref.segmentId);
    if (!segment) {
      return contour;
    }

    const from = contour.points.find((point) => point.id === segment.from);
    const to = contour.points.find((point) => point.id === segment.to);
    if (!from || !to) {
      return contour;
    }

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const baseLength = Math.hypot(dx, dy);
    if (baseLength < 0.0001) {
      return contour;
    }

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const dirX = dx / baseLength;
    const dirY = dy / baseLength;
    const half = length / 2;

    const fromNext = { x: midX - dirX * half, y: midY - dirY * half };
    const toNext = { x: midX + dirX * half, y: midY + dirY * half };

    return {
      ...contour,
      points: contour.points.map((point) => {
        if (point.id === from.id) {
          return {
            ...point,
            x: fromNext.x,
            y: fromNext.y,
          };
        }
        if (point.id === to.id) {
          return {
            ...point,
            x: toNext.x,
            y: toNext.y,
          };
        }
        return point;
      }),
      dimensions: contour.dimensions.map((dimension) =>
        dimension.segmentId === segment.id
          ? {
              ...dimension,
              rawText: length.toFixed(1),
              parsedValue: length,
              normalizedValueMm: length,
              isResolved: true,
              warnings: [],
            }
          : dimension,
      ),
    };
  });
}

export function updateSegmentAngle(
  payload: DrawingPayload,
  ref: SegmentRef,
  angleDeg: number,
): DrawingPayload {
  if (!Number.isFinite(angleDeg)) {
    return payload;
  }

  return updateContour(payload, ref.contourId, (contour) => {
    const segment = contour.segments.find((item) => item.id === ref.segmentId);
    if (!segment) {
      return contour;
    }

    const from = contour.points.find((point) => point.id === segment.from);
    const to = contour.points.find((point) => point.id === segment.to);
    if (!from || !to) {
      return contour;
    }

    const length = Math.hypot(to.x - from.x, to.y - from.y);
    if (length < 0.0001) {
      return contour;
    }

    const radians = (angleDeg * Math.PI) / 180;
    const dirX = Math.cos(radians);
    const dirY = Math.sin(radians);
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const half = length / 2;

    const fromNext = { x: midX - dirX * half, y: midY - dirY * half };
    const toNext = { x: midX + dirX * half, y: midY + dirY * half };

    return {
      ...contour,
      points: contour.points.map((point) => {
        if (point.id === from.id) {
          return {
            ...point,
            x: fromNext.x,
            y: fromNext.y,
          };
        }
        if (point.id === to.id) {
          return {
            ...point,
            x: toNext.x,
            y: toNext.y,
          };
        }
        return point;
      }),
    };
  });
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
  return updateContour(payload, pointRef.contourId, (contour) => {
    const updated = {
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
    };

    return syncDimensionValuesForPointMove(updated, pointRef.pointId);
  });
}

export function moveSegmentByDelta(
  payload: DrawingPayload,
  ref: SegmentRef,
  deltaX: number,
  deltaY: number,
): DrawingPayload {
  return updateContour(payload, ref.contourId, (contour) => {
    const segment = contour.segments.find((item) => item.id === ref.segmentId);
    if (!segment) {
      return contour;
    }

    return {
      ...contour,
      points: contour.points.map((point) => {
        if (point.id !== segment.from && point.id !== segment.to) {
          return point;
        }

        return {
          ...point,
          x: point.x + deltaX,
          y: point.y + deltaY,
        };
      }),
    };
  });
}

export function moveSegmentsByDelta(
  payload: DrawingPayload,
  refs: SegmentRef[],
  deltaX: number,
  deltaY: number,
): DrawingPayload {
  if (refs.length === 0) {
    return payload;
  }

  const refsByContour = refs.reduce<Map<string, Set<string>>>((acc, ref) => {
    const set = acc.get(ref.contourId) ?? new Set<string>();
    set.add(ref.segmentId);
    acc.set(ref.contourId, set);
    return acc;
  }, new Map<string, Set<string>>());

  const contours = payload.contours.map((contour) => {
    const segmentIds = refsByContour.get(contour.id);
    if (!segmentIds || segmentIds.size === 0) {
      return contour;
    }

    const movedPointIds = new Set<string>();
    for (const segment of contour.segments) {
      if (!segmentIds.has(segment.id)) {
        continue;
      }
      movedPointIds.add(segment.from);
      movedPointIds.add(segment.to);
    }

    if (movedPointIds.size === 0) {
      return contour;
    }

    return withClosedFlag({
      ...contour,
      points: contour.points.map((point) =>
        movedPointIds.has(point.id)
          ? {
              ...point,
              x: point.x + deltaX,
              y: point.y + deltaY,
            }
          : point,
      ),
    });
  });

  return {
    ...payload,
    contours,
  };
}

export function movePointWithLockedSegmentLength(
  payload: DrawingPayload,
  pointRef: PointRef,
  segmentRef: SegmentRef,
  x: number,
  y: number,
): DrawingPayload {
  return updateContour(payload, segmentRef.contourId, (contour) => {
    const segment = contour.segments.find((item) => item.id === segmentRef.segmentId);
    if (!segment) {
      return contour;
    }

    const isFrom = segment.from === pointRef.pointId;
    const isTo = segment.to === pointRef.pointId;
    if (!isFrom && !isTo) {
      return contour;
    }

    const anchorPointId = isFrom ? segment.to : segment.from;
    const anchor = contour.points.find((item) => item.id === anchorPointId);
    if (!anchor) {
      return contour;
    }

    const movingCurrent = contour.points.find((item) => item.id === pointRef.pointId);
    if (!movingCurrent) {
      return contour;
    }

    const lockedLength = Math.hypot(movingCurrent.x - anchor.x, movingCurrent.y - anchor.y);
    const vectorX = x - anchor.x;
    const vectorY = y - anchor.y;
    const vectorLength = Math.hypot(vectorX, vectorY);

    if (vectorLength < 0.0001 || lockedLength < 0.0001) {
      return contour;
    }

    const normalizedX = vectorX / vectorLength;
    const normalizedY = vectorY / vectorLength;

    const nextX = anchor.x + normalizedX * lockedLength;
    const nextY = anchor.y + normalizedY * lockedLength;

    const updated = {
      ...contour,
      points: contour.points.map((point) =>
        point.id === pointRef.pointId
          ? {
              ...point,
              x: nextX,
              y: nextY,
            }
          : point,
      ),
    };

    return syncDimensionValuesForPointMove(updated, pointRef.pointId);
  });
}

export function deleteSegment(payload: DrawingPayload, ref: SegmentRef): DrawingPayload {
  return updateContour(payload, ref.contourId, (contour) =>
    pruneOrphanDimensions({
      ...contour,
      segments: normalizeSegmentOrder(
        contour.segments.filter((segment) => segment.id !== ref.segmentId),
      ),
    }),
  );
}

export function connectPoints(payload: DrawingPayload, refs: PointRef[]): DrawingPayload {
  if (refs.length !== 2) {
    return payload;
  }

  const [primary, secondary] = refs;
  if (
    !primary ||
    !secondary ||
    primary.pointId === secondary.pointId ||
    primary.contourId !== secondary.contourId
  ) {
    return payload;
  }

  return updateContour(payload, primary.contourId, (contour) => {
    const primaryPoint = contour.points.find((point) => point.id === primary.pointId);
    const secondaryPoint = contour.points.find((point) => point.id === secondary.pointId);
    if (!primaryPoint || !secondaryPoint) {
      return contour;
    }

    // Snap the moving point to the target point first. This keeps the target segment
    // geometry stable and prevents accidental length drift on the segment we connect to.
    const snappedPoints = contour.points.map((point) =>
      point.id === primary.pointId
        ? {
            ...point,
            x: secondaryPoint.x,
            y: secondaryPoint.y,
          }
        : point,
    );

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

    return pruneOrphanDimensions({
      ...contour,
      points: snappedPoints.filter((point) => point.id !== secondary.pointId),
      segments: normalizeSegmentOrder([...deduped.values()]),
    });
  });
}

export function connectPointsIfCoincident(
  payload: DrawingPayload,
  refs: PointRef[],
  tolerance: number = 0.001,
): DrawingPayload {
  if (refs.length !== 2) {
    return payload;
  }

  const [primary, secondary] = refs;
  if (
    !primary ||
    !secondary ||
    primary.pointId === secondary.pointId ||
    primary.contourId !== secondary.contourId
  ) {
    return payload;
  }

  return updateContour(payload, primary.contourId, (contour) => {
    const primaryPoint = contour.points.find((point) => point.id === primary.pointId);
    const secondaryPoint = contour.points.find((point) => point.id === secondary.pointId);
    if (!primaryPoint || !secondaryPoint) {
      return contour;
    }

    const distance = Math.hypot(primaryPoint.x - secondaryPoint.x, primaryPoint.y - secondaryPoint.y);
    if (distance > tolerance) {
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

    return pruneOrphanDimensions({
      ...contour,
      points: contour.points.filter((point) => point.id !== secondary.pointId),
      segments: normalizeSegmentOrder([...deduped.values()]),
    });
  });
}

export function snapSegmentEndpointAndConnect(
  payload: DrawingPayload,
  segmentRef: SegmentRef,
  movingPointId: string,
  targetPointRef: PointRef,
): DrawingPayload {
  const contour = payload.contours.find((item) => item.id === segmentRef.contourId);
  if (!contour || contour.id !== targetPointRef.contourId) {
    return payload;
  }

  const segment = contour.segments.find((item) => item.id === segmentRef.segmentId);
  if (!segment) {
    return payload;
  }

  if (movingPointId !== segment.from && movingPointId !== segment.to) {
    return payload;
  }

  const movingPoint = contour.points.find((point) => point.id === movingPointId);
  const targetPoint = contour.points.find((point) => point.id === targetPointRef.pointId);
  if (!movingPoint || !targetPoint) {
    return payload;
  }

  const deltaX = targetPoint.x - movingPoint.x;
  const deltaY = targetPoint.y - movingPoint.y;

  const moved = moveSegmentByDelta(payload, segmentRef, deltaX, deltaY);
  return connectPoints(moved, [
    { contourId: segmentRef.contourId, pointId: movingPointId },
    targetPointRef,
  ]);
}

export interface DuplicateSegmentsResult {
  payload: DrawingPayload;
  created: SegmentRef[];
}

export function duplicateSegments(
  payload: DrawingPayload,
  refs: SegmentRef[],
  offsetX: number = 24,
  offsetY: number = 24,
): DuplicateSegmentsResult {
  if (refs.length === 0) {
    return { payload, created: [] };
  }

  const refsByContour = refs.reduce<Map<string, Set<string>>>((acc, ref) => {
    const current = acc.get(ref.contourId) ?? new Set<string>();
    current.add(ref.segmentId);
    acc.set(ref.contourId, current);
    return acc;
  }, new Map<string, Set<string>>());

  const created: SegmentRef[] = [];

  const contours = payload.contours.map((contour) => {
    const segmentIds = refsByContour.get(contour.id);
    if (!segmentIds || segmentIds.size === 0) {
      return contour;
    }

    const selectedSegments = contour.segments.filter((segment) => segmentIds.has(segment.id));
    if (selectedSegments.length === 0) {
      return contour;
    }

    const pointById = new Map(contour.points.map((point) => [point.id, point]));
    const dimensionBySegmentId = new Map(contour.dimensions.map((dimension) => [dimension.segmentId, dimension]));

    const nextPointSuffixStart = nextNumericSuffix(contour.points.map((point) => point.id));
    const nextSegmentSuffixStart = nextNumericSuffix(contour.segments.map((segment) => segment.id));
    const nextDimensionSuffixStart = nextNumericSuffix(contour.dimensions.map((dimension) => dimension.id));

    let pointCounter = nextPointSuffixStart;
    let segmentCounter = nextSegmentSuffixStart;
    let dimensionCounter = nextDimensionSuffixStart;

    const pointMapping = new Map<string, string>();
    const appendedPoints = [...contour.points];
    const appendedSegments = [...contour.segments];
    const appendedDimensions = [...contour.dimensions];

    const mapPoint = (oldPointId: string): string => {
      const mapped = pointMapping.get(oldPointId);
      if (mapped) {
        return mapped;
      }

      const source = pointById.get(oldPointId);
      if (!source) {
        return oldPointId;
      }

      pointCounter += 1;
      const nextPointIdValue = `${contour.id}-p${pointCounter}`;
      pointMapping.set(oldPointId, nextPointIdValue);
      appendedPoints.push({
        ...source,
        id: nextPointIdValue,
        x: source.x + offsetX,
        y: source.y + offsetY,
      });

      return nextPointIdValue;
    };

    for (const sourceSegment of selectedSegments) {
      const nextFrom = mapPoint(sourceSegment.from);
      const nextTo = mapPoint(sourceSegment.to);

      segmentCounter += 1;
      const nextSegmentIdValue = `${contour.id}-s${segmentCounter}`;

      appendedSegments.push({
        ...sourceSegment,
        id: nextSegmentIdValue,
        from: nextFrom,
        to: nextTo,
        order: appendedSegments.length + 1,
      });

      const sourceDimension = dimensionBySegmentId.get(sourceSegment.id);
      if (sourceDimension) {
        dimensionCounter += 1;
        appendedDimensions.push({
          ...sourceDimension,
          id: `${contour.id}-d${dimensionCounter}`,
          segmentId: nextSegmentIdValue,
        });
      }

      created.push({
        contourId: contour.id,
        segmentId: nextSegmentIdValue,
      });
    }

    return withClosedFlag({
      ...contour,
      points: appendedPoints,
      segments: normalizeSegmentOrder(appendedSegments),
      dimensions: appendedDimensions,
    });
  });

  return {
    payload: {
      ...payload,
      contours,
    },
    created,
  };
}

export function disconnectSegments(payload: DrawingPayload, refs: SegmentRef[]): DrawingPayload {
  if (refs.length !== 2) {
    return payload;
  }

  const [first, second] = refs;
  if (!first || !second || first.contourId !== second.contourId || first.segmentId === second.segmentId) {
    return payload;
  }

  return updateContour(payload, first.contourId, (contour) => {
    const firstSegment = contour.segments.find((item) => item.id === first.segmentId);
    const secondSegment = contour.segments.find((item) => item.id === second.segmentId);

    if (!firstSegment || !secondSegment) {
      return contour;
    }

    const sharedPointId = [firstSegment.from, firstSegment.to].find(
      (id) => id === secondSegment.from || id === secondSegment.to,
    );

    if (!sharedPointId) {
      return contour;
    }

    const sharedPoint = contour.points.find((point) => point.id === sharedPointId);
    if (!sharedPoint) {
      return contour;
    }

    const replacementPointId = nextPointId(contour);

    return {
      ...contour,
      points: [
        ...contour.points,
        {
          ...sharedPoint,
          id: replacementPointId,
        },
      ],
      segments: contour.segments.map((segment) => {
        if (segment.id !== secondSegment.id) {
          return segment;
        }

        return {
          ...segment,
          from: segment.from === sharedPointId ? replacementPointId : segment.from,
          to: segment.to === sharedPointId ? replacementPointId : segment.to,
        };
      }),
    };
  });
}
