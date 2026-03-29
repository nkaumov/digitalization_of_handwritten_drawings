import Fastify from 'fastify';

import { registerErrorHandlers } from '@/common/errors/error-handler';
import { registerRoutes } from '@/modules';
import { env } from '@/config/env';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    disableRequestLogging: false,
  });

  registerErrorHandlers(app);
  registerRoutes(app);

  return app;
}
