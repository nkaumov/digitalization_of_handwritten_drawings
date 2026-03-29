import type { DrawingPayload } from './payloads';
import type { RecognitionJobStatus } from './status';
import type { RecognitionDebugPayload } from './debug';

export interface AiRecognitionRequest {
  jobId: string;
  drawingId: string;
  imagePath: string;
  options: {
    detectMultipleContours: boolean;
    allowedSegmentKinds: ['line'];
    targetUnit: 'mm';
  };
}

export interface AiRecognitionResponse {
  jobId: string;
  status: Extract<RecognitionJobStatus, 'completed' | 'failed'>;
  resultPayload?: DrawingPayload;
  debugPayload?: RecognitionDebugPayload;
}
