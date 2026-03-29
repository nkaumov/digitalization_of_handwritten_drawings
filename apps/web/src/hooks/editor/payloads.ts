export interface DrawingLoadPayload {
  drawingId: string;
  source: 'blank' | 'photo' | 'stored';
}

export interface ElementCreatePayload {
  elementId: string;
  elementType: 'point' | 'segment' | 'dimension' | 'contour' | 'unknown';
}

export interface ElementUpdatePayload {
  elementId: string;
  patch: Record<string, unknown>;
}

export interface ElementDeletePayload {
  elementId: string;
  reason?: string;
}

export interface DrawingSavePayload {
  drawingId: string;
  mode: 'manual' | 'auto';
}

export interface ExportPayload {
  drawingId: string;
  format: 'pdf' | 'image';
}