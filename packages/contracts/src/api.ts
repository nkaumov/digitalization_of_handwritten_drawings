import type { DrawingPayload } from './payloads';
import type { DrawingStatus, RecognitionJobStatus } from './status';

export interface CreateDrawingRequest {
  title: string;
  sourceType: 'blank' | 'photo';
  locale: string;
}

export interface CreateDrawingResponse {
  id: string;
  status: DrawingStatus;
}

export interface StartRecognitionResponse {
  drawingId: string;
  jobId: string;
  status: Extract<DrawingStatus, 'recognition_pending'>;
}

export interface GetRecognitionJobStatusResponse {
  jobId: string;
  status: RecognitionJobStatus;
  drawingStatus?: DrawingStatus;
}

export interface GetDrawingResponse {
  id: string;
  title: string;
  status: DrawingStatus;
  payload: DrawingPayload;
}

export interface SaveDrawingRequest {
  payload: DrawingPayload;
}

export interface SaveDrawingResponse {
  id: string;
  status: Extract<DrawingStatus, 'saved'>;
}
