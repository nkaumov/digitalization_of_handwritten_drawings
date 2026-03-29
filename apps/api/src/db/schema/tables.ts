export type DrawingStatus =
  | 'new'
  | 'empty'
  | 'processing'
  | 'recognized'
  | 'needs_revision'
  | 'saved'
  | 'error';

export type RecognitionJobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type ExportFormat = 'pdf' | 'image';
export type ExportStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface DrawingRow {
  id: number;
  title: string;
  status: DrawingStatus;
  source_file_id: number | null;
  recognized_payload: string | null;
  edited_payload: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContourRow {
  id: number;
  drawing_id: number;
  contour_index: number;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PointRow {
  id: number;
  drawing_id: number;
  contour_id: number | null;
  point_index: number;
  x: number;
  y: number;
  created_at: string;
  updated_at: string;
}

export interface SegmentRow {
  id: number;
  drawing_id: number;
  contour_id: number | null;
  segment_index: number;
  start_point_id: number;
  end_point_id: number;
  created_at: string;
  updated_at: string;
}

export interface DimensionRow {
  id: number;
  drawing_id: number;
  segment_id: number | null;
  label: string | null;
  raw_value: string | null;
  normalized_value: number | null;
  unit: 'mm';
  confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface RecognitionJobRow {
  id: number;
  drawing_id: number;
  source_file_id: number;
  status: RecognitionJobStatus;
  error_message: string | null;
  warnings_payload: string | null;
  debug_payload: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoredFileRow {
  id: number;
  kind: 'source-image' | 'debug-artifact' | 'export-artifact' | 'other';
  storage_path: string;
  mime_type: string | null;
  original_name: string | null;
  size_bytes: number | null;
  checksum_sha256: string | null;
  created_at: string;
}

export interface ExportRow {
  id: number;
  drawing_id: number;
  file_id: number;
  format: ExportFormat;
  status: ExportStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

