import type {
  ContourPayload,
  CreateDrawingRequest,
  DimensionPayload,
  DrawingPayload,
  DrawingStatus,
  PointPayload,
  SaveDrawingRequest,
  SegmentPayload,
  WarningItem,
} from '@contracts';

import { AppError } from '@/common/errors/app-error';
import type { UpdateDrawingRequest } from '@/domains/drawings/contracts';

const DRAWING_STATUSES: readonly DrawingStatus[] = [
  'draft',
  'blank_ready',
  'recognition_pending',
  'recognition_processing',
  'recognized',
  'needs_review',
  'saved',
  'error',
];

type AnyRecord = Record<string, unknown>;

function asRecord(value: unknown, code: string, message: string): AnyRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AppError(code, 400, message);
  }
  return value as AnyRecord;
}

function asString(value: unknown, code: string, message: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new AppError(code, 400, message);
  }
  return value;
}

function asNumberOrNull(value: unknown, code: string, message: string): number | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new AppError(code, 400, message);
  }
  return value;
}

function asNumber(value: unknown, code: string, message: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new AppError(code, 400, message);
  }
  return value;
}

function asBoolean(value: unknown, code: string, message: string): boolean {
  if (typeof value !== 'boolean') {
    throw new AppError(code, 400, message);
  }
  return value;
}

function validateWarningItem(value: unknown): WarningItem {
  const record = asRecord(value, 'DRAWING_PAYLOAD_INVALID', 'warning item must be object');
  const level = asString(
    record.level,
    'DRAWING_PAYLOAD_INVALID',
    'warning level must be info|warning|error',
  );
  if (level !== 'info' && level !== 'warning' && level !== 'error') {
    throw new AppError('DRAWING_PAYLOAD_INVALID', 400, 'warning level must be info|warning|error');
  }
  return {
    code: asString(record.code, 'DRAWING_PAYLOAD_INVALID', 'warning code is required'),
    message: asString(record.message, 'DRAWING_PAYLOAD_INVALID', 'warning message is required'),
    level,
    ...(typeof record.source === 'string' ? { source: record.source } : {}),
  };
}

function validatePoint(value: unknown): PointPayload {
  const record = asRecord(value, 'DRAWING_PAYLOAD_INVALID', 'point item must be object');
  return {
    id: asString(record.id, 'DRAWING_PAYLOAD_INVALID', 'point id is required'),
    x: asNumber(record.x, 'DRAWING_PAYLOAD_INVALID', 'point x must be number'),
    y: asNumber(record.y, 'DRAWING_PAYLOAD_INVALID', 'point y must be number'),
    ...(typeof record.label === 'string' ? { label: record.label } : {}),
  };
}

function validateSegment(value: unknown): SegmentPayload {
  const record = asRecord(value, 'DRAWING_PAYLOAD_INVALID', 'segment item must be object');
  const kind = asString(record.kind, 'DRAWING_PAYLOAD_INVALID', 'segment kind is required');
  if (kind !== 'line') {
    throw new AppError('DRAWING_PAYLOAD_INVALID', 400, 'segment kind must be line');
  }
  const order = asNumberOrNull(record.order, 'DRAWING_PAYLOAD_INVALID', 'segment order must be number');
  if (order === null || !Number.isInteger(order) || order < 0) {
    throw new AppError('DRAWING_PAYLOAD_INVALID', 400, 'segment order must be non-negative integer');
  }
  return {
    id: asString(record.id, 'DRAWING_PAYLOAD_INVALID', 'segment id is required'),
    from: asString(record.from, 'DRAWING_PAYLOAD_INVALID', 'segment from is required'),
    to: asString(record.to, 'DRAWING_PAYLOAD_INVALID', 'segment to is required'),
    kind: 'line',
    order,
    confidence: asNumberOrNull(
      record.confidence,
      'DRAWING_PAYLOAD_INVALID',
      'segment confidence must be number|null',
    ),
  };
}

function validateDimension(value: unknown): DimensionPayload {
  const record = asRecord(value, 'DRAWING_PAYLOAD_INVALID', 'dimension item must be object');
  const assumedUnit = asString(
    record.assumedUnit,
    'DRAWING_PAYLOAD_INVALID',
    'dimension assumedUnit is required',
  );
  if (assumedUnit !== 'mm' && assumedUnit !== 'cm' && assumedUnit !== 'm' && assumedUnit !== 'unknown') {
    throw new AppError('DRAWING_PAYLOAD_INVALID', 400, 'dimension assumedUnit is invalid');
  }
  const warningsRaw = Array.isArray(record.warnings) ? record.warnings : [];
  return {
    id: asString(record.id, 'DRAWING_PAYLOAD_INVALID', 'dimension id is required'),
    segmentId: asString(record.segmentId, 'DRAWING_PAYLOAD_INVALID', 'dimension segmentId is required'),
    rawText: asString(record.rawText, 'DRAWING_PAYLOAD_INVALID', 'dimension rawText is required'),
    parsedValue: asNumberOrNull(
      record.parsedValue,
      'DRAWING_PAYLOAD_INVALID',
      'dimension parsedValue must be number|null',
    ),
    normalizedValueMm: asNumberOrNull(
      record.normalizedValueMm,
      'DRAWING_PAYLOAD_INVALID',
      'dimension normalizedValueMm must be number|null',
    ),
    assumedUnit,
    confidence: asNumberOrNull(
      record.confidence,
      'DRAWING_PAYLOAD_INVALID',
      'dimension confidence must be number|null',
    ),
    isResolved: asBoolean(
      record.isResolved,
      'DRAWING_PAYLOAD_INVALID',
      'dimension isResolved must be boolean',
    ),
    warnings: warningsRaw.map(validateWarningItem),
  };
}

function validateContour(value: unknown): ContourPayload {
  const record = asRecord(value, 'DRAWING_PAYLOAD_INVALID', 'contour item must be object');
  const pointsRaw = Array.isArray(record.points) ? record.points : null;
  const segmentsRaw = Array.isArray(record.segments) ? record.segments : null;
  const dimensionsRaw = Array.isArray(record.dimensions) ? record.dimensions : [];
  const warningsRaw = Array.isArray(record.warnings) ? record.warnings : [];

  if (!pointsRaw || !segmentsRaw) {
    throw new AppError('DRAWING_PAYLOAD_INVALID', 400, 'contour points and segments must be arrays');
  }

  return {
    id: asString(record.id, 'DRAWING_PAYLOAD_INVALID', 'contour id is required'),
    closed: asBoolean(record.closed, 'DRAWING_PAYLOAD_INVALID', 'contour closed must be boolean'),
    confidence: asNumberOrNull(
      record.confidence,
      'DRAWING_PAYLOAD_INVALID',
      'contour confidence must be number|null',
    ),
    points: pointsRaw.map(validatePoint),
    segments: segmentsRaw.map(validateSegment),
    dimensions: dimensionsRaw.map(validateDimension),
    warnings: warningsRaw.map(validateWarningItem),
  };
}

export function validateCreateDrawingRequest(body: unknown): CreateDrawingRequest {
  const record = asRecord(body, 'DRAWING_CREATE_INVALID', 'create drawing body must be object');
  const sourceType = asString(
    record.sourceType,
    'DRAWING_CREATE_INVALID',
    'sourceType must be blank|photo',
  );
  if (sourceType !== 'blank' && sourceType !== 'photo') {
    throw new AppError('DRAWING_CREATE_INVALID', 400, 'sourceType must be blank|photo');
  }

  return {
    title: asString(record.title, 'DRAWING_CREATE_INVALID', 'title is required'),
    sourceType,
    locale: asString(record.locale, 'DRAWING_CREATE_INVALID', 'locale is required'),
  };
}

export function validateUpdateDrawingRequest(body: unknown): UpdateDrawingRequest {
  const record = asRecord(body, 'DRAWING_UPDATE_INVALID', 'update drawing body must be object');
  const result: UpdateDrawingRequest = {};

  if (record.title !== undefined) {
    result.title = asString(record.title, 'DRAWING_UPDATE_INVALID', 'title must be non-empty string');
  }

  if (record.locale !== undefined) {
    result.locale = asString(record.locale, 'DRAWING_UPDATE_INVALID', 'locale must be non-empty string');
  }

  if (record.status !== undefined) {
    const status = asString(record.status, 'DRAWING_UPDATE_INVALID', 'status must be valid');
    if (!DRAWING_STATUSES.includes(status as DrawingStatus)) {
      throw new AppError('DRAWING_UPDATE_INVALID', 400, 'status must be valid drawing status');
    }
    result.status = status as DrawingStatus;
  }

  if (Object.keys(result).length === 0) {
    throw new AppError(
      'DRAWING_UPDATE_INVALID',
      400,
      'at least one field is required: title, locale, status',
    );
  }

  return result;
}

export function validateSaveDrawingRequest(body: unknown): SaveDrawingRequest {
  const record = asRecord(body, 'DRAWING_SAVE_INVALID', 'save drawing body must be object');
  const payloadRaw = asRecord(record.payload, 'DRAWING_SAVE_INVALID', 'payload is required');
  const warningsRaw = Array.isArray(payloadRaw.warnings) ? payloadRaw.warnings : [];
  const contoursRaw = Array.isArray(payloadRaw.contours) ? payloadRaw.contours : null;
  if (!contoursRaw) {
    throw new AppError('DRAWING_SAVE_INVALID', 400, 'payload.contours must be an array');
  }

  const unit = asString(payloadRaw.unit, 'DRAWING_SAVE_INVALID', 'payload.unit is required');
  if (unit !== 'mm') {
    throw new AppError('DRAWING_SAVE_INVALID', 400, 'payload.unit must be mm');
  }

  const payload: DrawingPayload = {
    version: asString(payloadRaw.version, 'DRAWING_SAVE_INVALID', 'payload.version is required'),
    drawingId: asString(payloadRaw.drawingId, 'DRAWING_SAVE_INVALID', 'payload.drawingId is required'),
    unit: 'mm',
    contours: contoursRaw.map(validateContour),
    warnings: warningsRaw.map(validateWarningItem),
    confidence: asNumberOrNull(
      payloadRaw.confidence,
      'DRAWING_SAVE_INVALID',
      'payload.confidence must be number|null',
    ),
  };

  return { payload };
}
