import type { FastifyReply } from 'fastify';

interface HealthResponse {
  ok: true;
  service: 'api';
  version: 'v1';
  timestamp: string;
}

export function sendHealth(reply: FastifyReply) {
  const payload: HealthResponse = {
    ok: true,
    service: 'api',
    version: 'v1',
    timestamp: new Date().toISOString(),
  };

  return reply.status(200).send(payload);
}
