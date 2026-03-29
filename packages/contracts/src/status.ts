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

export type WarningLevel = 'info' | 'warning' | 'error';

export type Unit = 'mm' | 'cm' | 'm' | 'unknown';
