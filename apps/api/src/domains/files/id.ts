import { AppError } from '@/common/errors/app-error';

const FILE_ID_PREFIX = 'file_';

export function formatFileId(id: number): string {
  return `${FILE_ID_PREFIX}${id}`;
}

export function parseFileId(rawId: string): number {
  if (!rawId.startsWith(FILE_ID_PREFIX)) {
    throw new AppError('FILE_ID_INVALID', 400, 'File id must start with file_');
  }

  const value = Number(rawId.slice(FILE_ID_PREFIX.length));
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError('FILE_ID_INVALID', 400, 'File id has invalid numeric part');
  }

  return value;
}

