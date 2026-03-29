import type { FastifyPluginAsync } from 'fastify';

import { sendHealth } from '@/common/http/health-response';

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async (_request, reply) => sendHealth(reply));
  app.get('/api/v1/health', async (_request, reply) => sendHealth(reply));
};
