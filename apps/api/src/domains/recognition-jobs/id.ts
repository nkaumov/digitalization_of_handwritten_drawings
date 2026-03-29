import { AppError } from '@/common/errors/app-error';

const RECOGNITION_JOB_ID_PREFIX = 'job_';

export function formatRecognitionJobId(id: number): string {
  return `${RECOGNITION_JOB_ID_PREFIX}${id}`;
}

export function parseRecognitionJobId(rawId: string): number {
  if (!rawId.startsWith(RECOGNITION_JOB_ID_PREFIX)) {
    throw new AppError('RECOGNITION_JOB_ID_INVALID', 400, 'Job id must start with job_');
  }

  const value = Number(rawId.slice(RECOGNITION_JOB_ID_PREFIX.length));
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError('RECOGNITION_JOB_ID_INVALID', 400, 'Job id has invalid numeric part');
  }

  return value;
}

