import Fastify from 'fastify';

import { registerErrorHandlers } from '@/common/errors/error-handler';
import { registerRequestLogging } from '@/common/http/request-logging';
import { registerDatabase } from '@/db';
import { env } from '@/config/env';
import { bootstrapApiDomains, createDomainLifecycleHookManager } from '@/domains';
import { registerRoutes } from '@/modules';

export async function buildApp() {
  const developmentTransport =
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : null;

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(developmentTransport ? { transport: developmentTransport } : {}),
    },
    disableRequestLogging: true,
  });

  registerErrorHandlers(app);
  registerRequestLogging(app);
  await registerDatabase(app);

  const domainLifecycleLogger = {
    info: (message: string, meta?: Record<string, unknown>) => {
      app.log.info({ ...(meta ?? {}) }, message);
    },
    error: (message: string, meta?: Record<string, unknown>) => {
      app.log.error({ ...(meta ?? {}) }, message);
    },
  };

  const domainHookManager = createDomainLifecycleHookManager({
    logger: domainLifecycleLogger,
    defaultTriggeredBy: 'api-app-bootstrap',
  });

  await bootstrapApiDomains(app, { hookManager: domainHookManager });
  registerRoutes(app);

  return app;
}
