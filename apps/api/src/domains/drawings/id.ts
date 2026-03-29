import { AppError } from '@/common/errors/app-error';

const DRAWING_ID_PREFIX = 'drawing_';

export function formatDrawingId(id: number): string {
  return `${DRAWING_ID_PREFIX}${id}`;
}

export function parseDrawingId(rawId: string): number {
  if (!rawId.startsWith(DRAWING_ID_PREFIX)) {
    throw new AppError('DRAWING_ID_INVALID', 400, 'Drawing id must start with drawing_');
  }

  const value = Number(rawId.slice(DRAWING_ID_PREFIX.length));
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError('DRAWING_ID_INVALID', 400, 'Drawing id has invalid numeric part');
  }

  return value;
}

