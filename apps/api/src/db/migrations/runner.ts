import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import mysql, { type RowDataPacket } from 'mysql2/promise';

import { buildDbPoolOptions } from '@/db/client';

interface MigrationRow extends RowDataPacket {
  filename: string;
}

const MIGRATIONS_TABLE = 'schema_migrations';
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'migrations');

function isStatusMode(): boolean {
  return process.argv.includes('--status');
}

async function ensureMigrationsTable(connection: mysql.Connection): Promise<void> {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
}

async function loadMigrationFiles(): Promise<string[]> {
  const files = await readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return files
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

async function loadAppliedMigrations(connection: mysql.Connection): Promise<Set<string>> {
  const [rows] = await connection.query<MigrationRow[]>(
    `SELECT filename FROM ${MIGRATIONS_TABLE} ORDER BY filename ASC`,
  );
  return new Set(rows.map((row) => row.filename));
}

async function applyMigration(connection: mysql.Connection, filename: string): Promise<void> {
  const sqlPath = path.join(MIGRATIONS_DIR, filename);
  const sql = await readFile(sqlPath, 'utf8');
  await connection.query(sql);
  await connection.query(`INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES (?)`, [filename]);
}

async function main(): Promise<void> {
  const connection = await mysql.createConnection({
    ...buildDbPoolOptions({
      multipleStatements: true,
    }),
  });

  try {
    await ensureMigrationsTable(connection);

    const files = await loadMigrationFiles();
    const applied = await loadAppliedMigrations(connection);
    const pending = files.filter((file) => !applied.has(file));

    if (isStatusMode()) {
      console.info(
        JSON.stringify(
          {
            migrationsDir: MIGRATIONS_DIR,
            total: files.length,
            applied: files.length - pending.length,
            pending,
          },
          null,
          2,
        ),
      );
      return;
    }

    if (pending.length === 0) {
      console.info('No pending migrations');
      return;
    }

    for (const filename of pending) {
      console.info(`Applying migration: ${filename}`);
      await applyMigration(connection, filename);
    }

    console.info(`Applied migrations: ${pending.length}`);
  } finally {
    await connection.end();
  }
}

void main();

