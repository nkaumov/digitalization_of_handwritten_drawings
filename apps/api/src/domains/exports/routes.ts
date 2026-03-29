import type { FastifyPluginAsync } from 'fastify';

import { AppError } from '@/common/errors/app-error';
import { ExportsService } from '@/domains/exports/service';

function validateExportBody(body: unknown): { drawingId: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new AppError('EXPORT_REQUEST_INVALID', 400, 'Body must be an object');
  }

  const record = body as Record<string, unknown>;
  if (typeof record.drawingId !== 'string' || record.drawingId.trim().length === 0) {
    throw new AppError('EXPORT_REQUEST_INVALID', 400, 'drawingId is required');
  }

  return {
    drawingId: record.drawingId,
  };
}

export const exportsRoutes: FastifyPluginAsync = async (app) => {
  const exportsService = new ExportsService(app);

  app.post('/api/v1/exports/pdf', async (request, reply) => {
    const body = validateExportBody(request.body);
    const result = await exportsService.exportDrawing({
      drawingId: body.drawingId,
      format: 'pdf',
    });
    reply.status(201).send(result);
  });

  app.post('/api/v1/exports/image', async (request, reply) => {
    const body = validateExportBody(request.body);
    const result = await exportsService.exportDrawing({
      drawingId: body.drawingId,
      format: 'image',
    });
    reply.status(201).send(result);
  });
};

