import type { DimensionPayload, DrawingPayload, SegmentPayload, WarningItem } from '@contracts';

import type { GeometryScene } from '@/domains/geometry';

export interface DimensionLabelItem {
  contourId: string;
  dimensionId: string;
  segmentId: string;
  x: number;
  y: number;
  text: string;
  hasWarning: boolean;
}

function parseDimensionValue(rawText: string): number | null {
  const normalized = rawText.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}

function buildParseWarnings(rawText: string, parsedValue: number | null): WarningItem[] {
  if (!rawText.trim()) {
    return [
      {
        code: 'dimension.empty',
        message: 'Dimension is empty',
        level: 'warning',
        source: 'editor.dimensions',
      },
    ];
  }

  if (parsedValue === null) {
    return [
      {
        code: 'dimension.parse_failed',
        message: 'Unable to parse numeric value',
        level: 'warning',
        source: 'editor.dimensions',
      },
    ];
  }

  return [];
}

function withDimensionText(dimension: DimensionPayload): string {
  return dimension.rawText.trim() || (dimension.parsedValue !== null ? `${dimension.parsedValue}` : '?');
}

function getLabelPosition(segment: SegmentPayload, pointById: Map<string, { x: number; y: number }>): { x: number; y: number } | null {
  const from = pointById.get(segment.from);
  const to = pointById.get(segment.to);
  if (!from || !to) {
    return null;
  }

  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);

  if (length < 0.001) {
    return { x: midX, y: midY };
  }

  const offset = 12;
  const normalX = (-dy / length) * offset;
  const normalY = (dx / length) * offset;

  return {
    x: midX + normalX,
    y: midY + normalY,
  };
}

export function buildDimensionLabels(scene: GeometryScene): DimensionLabelItem[] {
  const labels: DimensionLabelItem[] = [];

  for (const contourScene of scene.contours) {
    const pointById = new Map(contourScene.points.map((item) => [item.point.id, item.point]));
    const segmentById = new Map(contourScene.segments.map((item) => [item.segment.id, item.segment]));

    for (const dimension of contourScene.contour.dimensions) {
      const segment = segmentById.get(dimension.segmentId);
      if (!segment) {
        continue;
      }

      const position = getLabelPosition(segment, pointById);
      if (!position) {
        continue;
      }

      labels.push({
        contourId: contourScene.contour.id,
        dimensionId: dimension.id,
        segmentId: dimension.segmentId,
        x: position.x,
        y: position.y,
        text: withDimensionText(dimension),
        hasWarning: dimension.warnings.length > 0 || !dimension.isResolved,
      });
    }
  }

  return labels;
}

export function updateDimensionRawText(
  payload: DrawingPayload,
  contourId: string,
  dimensionId: string,
  rawText: string,
): DrawingPayload {
  const contours = payload.contours.map((contour) => {
    if (contour.id !== contourId) {
      return contour;
    }

    return {
      ...contour,
      dimensions: contour.dimensions.map((dimension) => {
        if (dimension.id !== dimensionId) {
          return dimension;
        }

        const parsedValue = parseDimensionValue(rawText);
        const warnings = buildParseWarnings(rawText, parsedValue);

        return {
          ...dimension,
          rawText,
          parsedValue,
          normalizedValueMm: parsedValue,
          isResolved: parsedValue !== null,
          warnings,
        };
      }),
    };
  });

  return {
    ...payload,
    contours,
  };
}
