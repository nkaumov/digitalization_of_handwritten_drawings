import type {
  CreateDrawingRequest,
  CreateDrawingResponse,
  DrawingPayload,
  DrawingStatus,
  GetDrawingResponse,
  SaveDrawingRequest,
  SaveDrawingResponse,
} from '@contracts';

export interface DrawingsListItem {
  id: string;
  title: string;
  sourceType: 'blank' | 'photo';
  locale: string;
  status: DrawingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DrawingsListResponse {
  items: DrawingsListItem[];
}

export interface UpdateDrawingRequest {
  title?: string;
  locale?: string;
  status?: DrawingStatus;
}

export interface UpdateDrawingResponse {
  id: string;
  status: DrawingStatus;
}

export interface DrawingRecord {
  id: number;
  title: string;
  sourceType: 'blank' | 'photo';
  locale: string;
  status: DrawingStatus;
  recognizedPayload: DrawingPayload | null;
  editedPayload: DrawingPayload | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateDrawingDto = CreateDrawingRequest;
export type CreateDrawingResult = CreateDrawingResponse;
export type GetDrawingResult = GetDrawingResponse;
export type SaveDrawingDto = SaveDrawingRequest;
export type SaveDrawingResult = SaveDrawingResponse;

