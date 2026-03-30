import type { DimensionPayload, DrawingPayload, SegmentPayload, WarningItem } from '@contracts';

import type { GeometryScene } from '@/domains/geometry';

export interface DimensionLabelItem {
  contourId: string;
  dimensionId: string;
  segmentId: string;
  x: number;
  y: number;
  text: string;
  boxWidth: number;
  hasWarning: boolean;
}

function parseDimensionValue(rawText: string): number | null {
  const normalized = rawText.trim().replace(',', '.');
  if (!normalized) {
    return null;
  }

  const numericPattern = /^[+-]?\d+(?:\.\d+)?$/;
  if (!numericPattern.test(normalized)) {
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

function estimateLabelWidth(text: string): number {
  return Math.max(34, text.length * 7 + 14);
}

function contourCentroid(pointById: Map<string, { x: number; y: number }>): { x: number; y: number } | null {
  const points = [...pointById.values()];
  if (points.length === 0) {
    return null;
  }

  const sum = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

function getLabelPosition(
  segment: SegmentPayload,
  pointById: Map<string, { x: number; y: number }>,
  isClosedContour: boolean,
): { x: number; y: number } | null {
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

  const offset = 16;
  const normalA = { x: (-dy / length) * offset, y: (dx / length) * offset };
  const normalB = { x: -normalA.x, y: -normalA.y };

  if (isClosedContour) {
    const centroid = contourCentroid(pointById);
    if (centroid) {
      const candidateA = { x: midX + normalA.x, y: midY + normalA.y };
      const candidateB = { x: midX + normalB.x, y: midY + normalB.y };
      const distanceA = Math.hypot(candidateA.x - centroid.x, candidateA.y - centroid.y);
      const distanceB = Math.hypot(candidateB.x - centroid.x, candidateB.y - centroid.y);

      return distanceA >= distanceB ? candidateA : candidateB;
    }
  }

  const preferred = normalA.y <= normalB.y ? normalA : normalB;

  return {
    x: midX + preferred.x,
    y: midY + preferred.y,
  };
}

export function buildDimensionLabels(scene: GeometryScene): DimensionLabelItem[] {
  const labels: DimensionLabelItem[] = [];

  for (const contourScene of scene.contours) {
    const pointById = new Map(contourScene.points.map((item) => [item.point.id, item.point]));
    const dimensionBySegment = new Map(contourScene.contour.dimensions.map((item) => [item.segmentId, item]));

    for (const segmentNode of contourScene.segments) {
      const position = getLabelPosition(segmentNode.segment, pointById, contourScene.contour.closed);
      if (!position) {
        continue;
      }

      const dimension = dimensionBySegment.get(segmentNode.segment.id);
      const fallbackLength = Math.hypot(
        segmentNode.to.x - segmentNode.from.x,
        segmentNode.to.y - segmentNode.from.y,
      );
      const text = dimension ? withDimensionText(dimension) : fallbackLength.toFixed(1);

      labels.push({
        contourId: contourScene.contour.id,
        dimensionId: dimension?.id ?? `${contourScene.contour.id}:${segmentNode.segment.id}:auto`,
        segmentId: segmentNode.segment.id,
        x: position.x,
        y: position.y,
        text,
        boxWidth: estimateLabelWidth(text),
        hasWarning: dimension ? dimension.warnings.length > 0 || !dimension.isResolved : false,
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
