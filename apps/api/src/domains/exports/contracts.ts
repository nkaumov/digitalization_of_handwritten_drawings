import type { ExportFormat } from '@/db/schema/tables';

export interface StartExportRequest {
  drawingId: string;
}

export interface StartExportResponse {
  exportId: string;
  drawingId: string;
  format: ExportFormat;
  status: 'completed' | 'failed' | 'processing' | 'queued';
  fileId: string;
  storagePath: string;
}

