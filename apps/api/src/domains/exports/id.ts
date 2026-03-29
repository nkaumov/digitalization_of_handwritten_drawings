import { AppError } from '@/common/errors/app-error';

const EXPORT_ID_PREFIX = 'export_';

export function formatExportId(id: number): string {
  return `${EXPORT_ID_PREFIX}${id}`;
}

export function parseExportId(rawId: string): number {
  if (!rawId.startsWith(EXPORT_ID_PREFIX)) {
    throw new AppError('EXPORT_ID_INVALID', 400, 'Export id must start with export_');
  }

  const value = Number(rawId.slice(EXPORT_ID_PREFIX.length));
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError('EXPORT_ID_INVALID', 400, 'Export id has invalid numeric part');
  }

  return value;
}

