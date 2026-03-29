import mysql, { type Pool, type PoolOptions } from 'mysql2/promise';

import { env } from '@/config/env';

export type ApiDbPool = Pool;

export function buildDbPoolOptions(overrides?: Partial<PoolOptions>): PoolOptions {
  return {
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ...overrides,
  };
}

export function createDbPool(overrides?: Partial<PoolOptions>): ApiDbPool {
  return mysql.createPool(buildDbPoolOptions(overrides));
}

export async function verifyDbConnection(pool: ApiDbPool): Promise<void> {
  const connection = await pool.getConnection();

  try {
    await connection.query('SELECT 1');
  } finally {
    connection.release();
  }
}

