import type { DrawingPayload } from '@contracts';

export function createEmptyDrawingPayload(drawingId: string): DrawingPayload {
  return {
    version: '1.0',
    drawingId,
    unit: 'mm',
    contours: [],
    warnings: [],
    confidence: null,
  };
}

