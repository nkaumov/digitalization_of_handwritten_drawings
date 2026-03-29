export interface UploadSourceImageResponse {
  id: string;
  kind: 'source-image';
  storagePath: string;
  mimeType: string | null;
  originalName: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

export interface StoredFileRecord {
  id: number;
  kind: 'source-image' | 'debug-artifact' | 'export-artifact' | 'other';
  storagePath: string;
  mimeType: string | null;
  originalName: string | null;
  sizeBytes: number | null;
  createdAt: string;
}

