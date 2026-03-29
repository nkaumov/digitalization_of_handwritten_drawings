import type { WarningLevel } from '@contracts';
import type { DrawingPayload } from '@contracts';

export interface GeometryWarningItem {
  id: string;
  code: string;
  level: WarningLevel;
  contourId: string;
  pointId?: string;
  segmentId?: string;
}

function segmentLength(segment: { from: { x: number; y: number }; to: { x: number; y: number } }): number {
  return Math.hypot(segment.to.x - segment.from.x, segment.to.y - segment.from.y);
}

export function collectGeometryWarnings(payload: DrawingPayload): GeometryWarningItem[] {
  const warnings: GeometryWarningItem[] = [];

  for (const contour of payload.contours) {
    const pointById = new Map(contour.points.map((point) => [point.id, point]));
    const degreeByPointId = new Map(contour.points.map((point) => [point.id, 0]));

    if (!contour.closed) {
      warnings.push({
        id: `${contour.id}:open`,
        code: 'geometry.contour_open',
        level: 'warning',
        contourId: contour.id,
      });
    }

    for (const segment of contour.segments) {
      degreeByPointId.set(segment.from, (degreeByPointId.get(segment.from) ?? 0) + 1);
      degreeByPointId.set(segment.to, (degreeByPointId.get(segment.to) ?? 0) + 1);

      const from = pointById.get(segment.from);
      const to = pointById.get(segment.to);

      if (!from || !to) {
        warnings.push({
          id: `${contour.id}:${segment.id}:broken_ref`,
          code: 'geometry.segment_broken_reference',
          level: 'error',
          contourId: contour.id,
          segmentId: segment.id,
        });
        continue;
      }

      if (segmentLength({ from, to }) < 12) {
        warnings.push({
          id: `${contour.id}:${segment.id}:short`,
          code: 'geometry.segment_too_short',
          level: 'warning',
          contourId: contour.id,
          segmentId: segment.id,
        });
      }
    }

    for (const [pointId, degree] of degreeByPointId.entries()) {
      if (degree === 2) {
        continue;
      }

      warnings.push({
        id: `${contour.id}:${pointId}:degree`,
        code: 'geometry.point_degree_invalid',
        level: 'warning',
        contourId: contour.id,
        pointId,
      });
    }
  }

  return warnings;
}
