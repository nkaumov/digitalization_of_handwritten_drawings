import type { FastifyInstance } from 'fastify';

import { AppError, type ApiErrorShape } from '@/common/errors/app-error';

function buildErrorBody(
  requestId: string,
  code: string,
  message: string,
  details?: unknown,
): ApiErrorShape {
  const baseError = {
    code,
    message,
    requestId,
    timestamp: new Date().toISOString(),
  };

  return {
    error: {
      ...baseError,
      ...(details !== undefined ? { details } : {}),
    },
  };
}

export function registerErrorHandlers(app: FastifyInstance) {
  app.setNotFoundHandler((request, reply) => {
    reply.status(404).send(
      buildErrorBody(request.id, 'NOT_FOUND', `Route ${request.method} ${request.url} not found`),
    );
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply
        .status(error.statusCode)
        .send(buildErrorBody(request.id, error.code, error.message, error.details));
      return;
    }

    const statusCode =
      typeof (error as { statusCode?: unknown }).statusCode === 'number'
        ? (error as { statusCode: number }).statusCode
        : 500;

    const message = statusCode >= 500 ? 'Internal Server Error' : error.message;

    request.log.error({ err: error }, 'Unhandled API error');

    reply.status(statusCode).send(buildErrorBody(request.id, 'INTERNAL_ERROR', message));
  });
}
