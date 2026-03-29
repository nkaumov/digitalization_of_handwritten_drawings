import type { ContourPayload, DrawingPayload, PointPayload, SegmentPayload } from '@contracts';

export interface GeometryPointNode {
  contourId: string;
  point: PointPayload;
}

export interface GeometrySegmentNode {
  contourId: string;
  segment: SegmentPayload;
  from: PointPayload;
  to: PointPayload;
}

export interface GeometryContourScene {
  contour: ContourPayload;
  points: GeometryPointNode[];
  segments: GeometrySegmentNode[];
}

export interface GeometryScene {
  drawingId: string;
  contours: GeometryContourScene[];
  points: GeometryPointNode[];
  segments: GeometrySegmentNode[];
}

export function buildGeometryScene(payload: DrawingPayload): GeometryScene {
  const contours = payload.contours.map((contour) => buildContourScene(contour));

  return {
    drawingId: payload.drawingId,
    contours,
    points: contours.flatMap((item) => item.points),
    segments: contours.flatMap((item) => item.segments),
  };
}

function buildContourScene(contour: ContourPayload): GeometryContourScene {
  const pointById = new Map(contour.points.map((point) => [point.id, point]));

  const segments = contour.segments
    .map((segment) => {
      const from = pointById.get(segment.from);
      const to = pointById.get(segment.to);
      if (!from || !to) {
        return null;
      }

      return {
        contourId: contour.id,
        segment,
        from,
        to,
      } satisfies GeometrySegmentNode;
    })
    .filter((item): item is GeometrySegmentNode => item !== null);

  const points = contour.points.map((point) => ({
    contourId: contour.id,
    point,
  }));

  return {
    contour,
    points,
    segments,
  };
}
