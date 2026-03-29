import type { Unit } from './status';
import type { WarningItem } from './warnings';

export interface PointPayload {
  id: string;
  x: number;
  y: number;
  label?: string;
}

export interface SegmentPayload {
  id: string;
  from: string;
  to: string;
  kind: 'line';
  order: number;
  confidence: number | null;
}

export interface DimensionPayload {
  id: string;
  segmentId: string;
  rawText: string;
  parsedValue: number | null;
  normalizedValueMm: number | null;
  assumedUnit: Unit;
  confidence: number | null;
  isResolved: boolean;
  warnings: WarningItem[];
}

export interface ContourPayload {
  id: string;
  closed: boolean;
  confidence: number | null;
  points: PointPayload[];
  segments: SegmentPayload[];
  dimensions: DimensionPayload[];
  warnings: WarningItem[];
}

export interface DrawingPayload {
  version: string;
  drawingId: string;
  unit: 'mm';
  contours: ContourPayload[];
  warnings: WarningItem[];
  confidence: number | null;
}
