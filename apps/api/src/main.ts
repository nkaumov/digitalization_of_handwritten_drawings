import type { AddressInfo } from 'node:net';

import { buildApp } from '@/app';
import { env } from '@/config/env';

async function start() {
  const app = buildApp();

  try {
    await app.listen({
      host: env.API_HOST,
      port: env.API_PORT,
    });

    const address = app.server.address() as AddressInfo | null;

    app.log.info(
      {
        host: env.API_HOST,
        port: env.API_PORT,
        address: address?.address,
      },
      'API server started',
    );
  } catch (error) {
    app.log.error({ err: error }, 'Failed to start API server');
    process.exit(1);
  }
}

void start();
