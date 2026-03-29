export type WarningLevel = 'info' | 'warning' | 'error';

export interface WarningItem {
  code: string;
  message: string;
  level: WarningLevel;
  source?: string;
}

export type DrawingStatus =
  | 'draft'
  | 'blank_ready'
  | 'recognition_pending'
  | 'recognition_processing'
  | 'recognized'
  | 'needs_review'
  | 'saved'
  | 'error';

export type RecognitionJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type Unit = 'mm' | 'cm' | 'm' | 'unknown';

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

export interface RecognitionDebugPayload {
  sourceImagePath: string;
  normalizedImagePath?: string;
  notes?: string[];
}
