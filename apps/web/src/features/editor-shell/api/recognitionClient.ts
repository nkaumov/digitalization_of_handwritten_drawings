import type { DrawingPayload, DrawingStatus, RecognitionJobStatus, StartRecognitionResponse } from '@contracts';

interface ApiErrorShape {
  error?: {
    code?: string;
    message?: string;
  };
}

export interface UploadSourceImageResponse {
  id: string;
  kind: 'source-image';
  storagePath: string;
  mimeType: string | null;
  originalName: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface StartRecognitionRequest {
  drawingId: string;
  fileId: string;
}

export interface RecognitionJobStatusResponse {
  jobId: string;
  status: RecognitionJobStatus;
  drawingStatus?: DrawingStatus;
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

export const MAX_SOURCE_IMAGE_SIZE_BYTES = 15 * 1024 * 1024;

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

function shouldRetryWithProxy(baseUrl: string, error: unknown): boolean {
  if (!baseUrl || !(error instanceof TypeError)) {
    return false;
  }

  try {
    const parsed = new URL(baseUrl);
    const isLocalApi = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
    const isApiPort = parsed.port === '3001';
    return isLocalApi && isApiPort;
  } catch {
    return false;
  }
}

async function parseError(response: Response): Promise<Error> {
  try {
    const json = (await response.json()) as ApiErrorShape;
    const code = json.error?.code ?? 'API_ERROR';
    const message = json.error?.message ?? `${response.status} ${response.statusText}`;
    return new Error(`${code}: ${message}`);
  } catch {
    return new Error(`API_ERROR: ${response.status} ${response.statusText}`);
  }
}

async function requestJsonWithRetry<T>(baseUrl: string, path: string, init: RequestInit): Promise<T> {
  try {
    const primaryResponse = await fetch(joinUrl(baseUrl, path), init);
    if (!primaryResponse.ok) {
      throw await parseError(primaryResponse);
    }
    return (await primaryResponse.json()) as T;
  } catch (error) {
    if (!shouldRetryWithProxy(baseUrl, error)) {
      throw error;
    }

    const fallbackResponse = await fetch(joinUrl('', path), init);
    if (!fallbackResponse.ok) {
      throw await parseError(fallbackResponse);
    }
    return (await fallbackResponse.json()) as T;
  }
}

export async function uploadSourceImage(apiBaseUrl: string, file: File): Promise<UploadSourceImageResponse> {
  const formData = new FormData();
  formData.append('file', file, file.name);

  return requestJsonWithRetry<UploadSourceImageResponse>(apiBaseUrl, '/api/v1/files/source-image', {
    method: 'POST',
    body: formData,
  });
}

export async function startRecognitionJob(
  apiBaseUrl: string,
  input: StartRecognitionRequest,
): Promise<StartRecognitionResponse> {
  return requestJsonWithRetry<StartRecognitionResponse>(apiBaseUrl, '/api/v1/recognition-jobs/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function getRecognitionJobStatus(
  apiBaseUrl: string,
  jobId: string,
): Promise<RecognitionJobStatusResponse> {
  return requestJsonWithRetry<RecognitionJobStatusResponse>(
    apiBaseUrl,
    `/api/v1/recognition-jobs/${jobId}/status`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  );
}

export async function getRecognitionJobResult(
  apiBaseUrl: string,
  jobId: string,
): Promise<RecognitionJobResultResponse> {
  return requestJsonWithRetry<RecognitionJobResultResponse>(
    apiBaseUrl,
    `/api/v1/recognition-jobs/${jobId}/result`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  );
}
