import type {
  CreateDrawingRequest,
  CreateDrawingResponse,
  DrawingPayload,
  GetDrawingResponse,
  SaveDrawingResponse,
} from '@contracts';

export interface DrawingsListItem {
  id: string;
  title: string;
  sourceType: 'blank' | 'photo';
  locale: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DrawingsListResponse {
  items: DrawingsListItem[];
}

export interface UpdateDrawingPatch {
  title?: string;
  locale?: string;
}

export interface UpdateDrawingResponse {
  id: string;
  status: string;
}

interface ApiErrorShape {
  error?: {
    code?: string;
    message?: string;
  };
}

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

async function requestJson<T>(baseUrl: string, path: string, init: RequestInit): Promise<T> {
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

export async function fetchDrawingsList(apiBaseUrl: string): Promise<DrawingsListResponse> {
  return requestJson<DrawingsListResponse>(apiBaseUrl, '/api/v1/drawings', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
}

export async function createDrawingInBackend(
  apiBaseUrl: string,
  input: CreateDrawingRequest,
): Promise<CreateDrawingResponse> {
  return requestJson<CreateDrawingResponse>(apiBaseUrl, '/api/v1/drawings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function fetchDrawingById(apiBaseUrl: string, drawingId: string): Promise<GetDrawingResponse> {
  return requestJson<GetDrawingResponse>(apiBaseUrl, `/api/v1/drawings/${drawingId}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
}

export async function updateDrawingMeta(
  apiBaseUrl: string,
  drawingId: string,
  patch: UpdateDrawingPatch,
): Promise<UpdateDrawingResponse> {
  return requestJson<UpdateDrawingResponse>(apiBaseUrl, `/api/v1/drawings/${drawingId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(patch),
  });
}

export async function saveDrawingToBackend(
  apiBaseUrl: string,
  drawingId: string,
  payload: DrawingPayload,
): Promise<SaveDrawingResponse> {
  return requestJson<SaveDrawingResponse>(apiBaseUrl, `/api/v1/drawings/${drawingId}/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ payload }),
  });
}

export function normalizeBackendDrawingId(value: string): string {
  return value.trim().replace(/^drawing-(\d+)$/, 'drawing_$1');
}

export function isBackendDrawingId(value: string): boolean {
  return /^drawing_\d+$/.test(normalizeBackendDrawingId(value));
}
