import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    requestStartedAtMs?: number;
  }
}

export function registerRequestLogging(app: FastifyInstance): void {
  app.addHook('onRequest', async (request) => {
    request.requestStartedAtMs = Date.now();
  });

  app.addHook('onResponse', async (request, reply) => {
    const startedAt = request.requestStartedAtMs ?? Date.now();
    const durationMs = Date.now() - startedAt;

    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        durationMs,
      },
      'API request completed',
    );
  });
}

