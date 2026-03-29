import type { ContourPayload, DrawingPayload, PointPayload, SegmentPayload } from '@contracts';

export const GEOMETRY_CANVAS_WIDTH = 520;
export const GEOMETRY_CANVAS_HEIGHT = 320;

export interface PointRef {
  contourId: string;
  pointId: string;
}

export interface SegmentRef {
  contourId: string;
  segmentId: string;
}

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
