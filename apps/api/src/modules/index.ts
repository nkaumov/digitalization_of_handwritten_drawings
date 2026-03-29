import type { FastifyInstance } from 'fastify';

import { healthRoutes } from '@/modules/health/health.routes';

export function registerRoutes(app: FastifyInstance) {
  app.register(healthRoutes);
}
