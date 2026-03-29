import type { FastifyPluginAsync } from 'fastify';

import { AppError } from '@/common/errors/app-error';
import { RecognitionJobsService } from '@/domains/recognition-jobs/service';

function validateStartRecognitionBody(body: unknown): { drawingId: string; fileId: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new AppError('RECOGNITION_START_INVALID', 400, 'Body must be an object');
  }

  const record = body as Record<string, unknown>;
  if (typeof record.drawingId !== 'string' || record.drawingId.trim().length === 0) {
    throw new AppError('RECOGNITION_START_INVALID', 400, 'drawingId is required');
  }
  if (typeof record.fileId !== 'string' || record.fileId.trim().length === 0) {
    throw new AppError('RECOGNITION_START_INVALID', 400, 'fileId is required');
  }

  return {
    drawingId: record.drawingId,
    fileId: record.fileId,
  };
}

export const recognitionJobsRoutes: FastifyPluginAsync = async (app) => {
  const service = new RecognitionJobsService(app);

  app.post('/api/v1/recognition-jobs/start', async (request, reply) => {
    const input = validateStartRecognitionBody(request.body);
    const result = await service.startRecognition(input);
    reply.status(202).send(result);
  });

  app.get('/api/v1/recognition-jobs/:jobId/status', async (request, reply) => {
    const params = request.params as { jobId?: unknown };
    const result = await service.getStatus(String(params.jobId ?? ''));
    reply.status(200).send(result);
  });

  app.get('/api/v1/recognition-jobs/:jobId/result', async (request, reply) => {
    const params = request.params as { jobId?: unknown };
    const result = await service.getResult(String(params.jobId ?? ''));
    reply.status(200).send(result);
  });
};

