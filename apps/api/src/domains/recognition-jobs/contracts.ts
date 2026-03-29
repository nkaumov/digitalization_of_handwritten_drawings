import type {
  DrawingPayload,
  DrawingStatus,
  GetRecognitionJobStatusResponse,
  RecognitionJobStatus,
  StartRecognitionResponse,
} from '@contracts';

export interface StartRecognitionRequest {
  drawingId: string;
  fileId: string;
}

export interface RecognitionStageLogItem {
  stage: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  createdAt: string;
}

export interface RecognitionJobResultResponse {
  jobId: string;
  status: RecognitionJobStatus;
  drawingId: string;
  drawingStatus: DrawingStatus;
  resultPayload: DrawingPayload;
  stageLogs: RecognitionStageLogItem[];
}

export type StartRecognitionResult = StartRecognitionResponse;
export type RecognitionJobStatusResult = GetRecognitionJobStatusResponse;

export interface RecognitionJobRecord {
  id: number;
  drawingId: number;
  sourceFileId: number;
  status: RecognitionJobStatus;
  errorMessage: string | null;
  debugPayload: Record<string, unknown> | null;
}

