import type { DrawingPayload } from '@contracts';

export const editorShellMockDrawing: DrawingPayload = {
  version: '1.0.0',
  drawingId: 'mock-drawing-stage-6',
  unit: 'mm',
  confidence: null,
  warnings: [],
  contours: [
    {
      id: 'contour-a',
      closed: true,
      confidence: null,
      warnings: [],
      dimensions: [],
      points: [
        { id: 'a-p1', x: 40, y: 40, label: 'A1' },
        { id: 'a-p2', x: 280, y: 40, label: 'A2' },
        { id: 'a-p3', x: 280, y: 180, label: 'A3' },
        { id: 'a-p4', x: 40, y: 180, label: 'A4' },
      ],
      segments: [
        { id: 'a-s1', from: 'a-p1', to: 'a-p2', kind: 'line', order: 1, confidence: null },
        { id: 'a-s2', from: 'a-p2', to: 'a-p3', kind: 'line', order: 2, confidence: null },
        { id: 'a-s3', from: 'a-p3', to: 'a-p4', kind: 'line', order: 3, confidence: null },
        { id: 'a-s4', from: 'a-p4', to: 'a-p1', kind: 'line', order: 4, confidence: null },
      ],
    },
    {
      id: 'contour-b',
      closed: true,
      confidence: null,
      warnings: [],
      dimensions: [],
      points: [
        { id: 'b-p1', x: 360, y: 80, label: 'B1' },
        { id: 'b-p2', x: 500, y: 80, label: 'B2' },
        { id: 'b-p3', x: 500, y: 220, label: 'B3' },
        { id: 'b-p4', x: 360, y: 220, label: 'B4' },
      ],
      segments: [
        { id: 'b-s1', from: 'b-p1', to: 'b-p2', kind: 'line', order: 1, confidence: null },
        { id: 'b-s2', from: 'b-p2', to: 'b-p3', kind: 'line', order: 2, confidence: null },
        { id: 'b-s3', from: 'b-p3', to: 'b-p4', kind: 'line', order: 3, confidence: null },
        { id: 'b-s4', from: 'b-p4', to: 'b-p1', kind: 'line', order: 4, confidence: null },
      ],
    },
  ],
};
