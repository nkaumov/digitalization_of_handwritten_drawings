import type { FastifyPluginAsync } from 'fastify';

import { DrawingsService } from '@/domains/drawings/service';
import {
  validateCreateDrawingRequest,
  validateSaveDrawingRequest,
  validateUpdateDrawingRequest,
} from '@/domains/drawings/validation';

export const drawingsRoutes: FastifyPluginAsync = async (app) => {
  const drawingsService = new DrawingsService(app);

  app.get('/api/v1/drawings', async (_request, reply) => {
    const result = await drawingsService.listDrawings();
    reply.status(200).send(result);
  });

  app.post('/api/v1/drawings', async (request, reply) => {
    const input = validateCreateDrawingRequest(request.body);
    const result = await drawingsService.createDrawing(input);
    reply.status(201).send(result);
  });

  app.get('/api/v1/drawings/:id', async (request, reply) => {
    const params = request.params as { id?: unknown };
    const result = await drawingsService.getDrawingByExternalId(String(params.id ?? ''));
    reply.status(200).send(result);
  });

  app.patch('/api/v1/drawings/:id', async (request, reply) => {
    const params = request.params as { id?: unknown };
    const patch = validateUpdateDrawingRequest(request.body);
    const result = await drawingsService.updateDrawingByExternalId(String(params.id ?? ''), patch);
    reply.status(200).send(result);
  });

  app.put('/api/v1/drawings/:id/payload', async (request, reply) => {
    const params = request.params as { id?: unknown };
    const input = validateSaveDrawingRequest(request.body);
    const result = await drawingsService.saveDrawingByExternalId(String(params.id ?? ''), input);
    reply.status(200).send(result);
  });

  app.delete('/api/v1/drawings/:id', async (request, reply) => {
    const params = request.params as { id?: unknown };
    await drawingsService.deleteDrawingByExternalId(String(params.id ?? ''));
    reply.status(204).send();
  });
};

