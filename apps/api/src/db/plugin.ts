import type { FastifyInstance } from 'fastify';

import { createDbPool, verifyDbConnection } from '@/db/client';

export async function registerDatabase(app: FastifyInstance): Promise<void> {
  const pool = createDbPool();
  await verifyDbConnection(pool);

  app.decorate('db', pool);

  app.addHook('onClose', async (instance) => {
    await instance.db.end();
  });
}

