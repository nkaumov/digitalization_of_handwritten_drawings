import { existsSync } from 'node:fs';
import path from 'node:path';

import { config as loadDotenv } from 'dotenv';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;

type LogLevel = (typeof LOG_LEVELS)[number];

type NodeEnv = 'development' | 'test' | 'production';

export interface EnvConfig {
  NODE_ENV: NodeEnv;
  API_HOST: string;
  API_PORT: number;
  LOG_LEVEL: LogLevel;
  DB_HOST: string;
  DB_PORT: number;
  DB_USER: string;
  DB_PASSWORD: string;
  DB_NAME: string;
  STORAGE_UPLOADS_DIR: string;
  STORAGE_EXPORTS_DIR: string;
}

function preloadEnvFiles(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
  ];

  for (const envPath of candidates) {
    if (existsSync(envPath)) {
      loadDotenv({
        path: envPath,
        override: false,
      });
    }
  }
}

function isLogLevel(value: string): value is LogLevel {
  return (LOG_LEVELS as readonly string[]).includes(value);
}

function parsePort(raw: string | undefined, fallback: number): number {
  const value = raw ? Number(raw) : fallback;
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error('API_PORT must be an integer from 1 to 65535');
  }

  return value;
}

function parseNodeEnv(raw: string | undefined): NodeEnv {
  const value = raw ?? 'development';
  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }

  throw new Error("NODE_ENV must be one of: 'development', 'test', 'production'");
}

function parseLogLevel(raw: string | undefined, nodeEnv: NodeEnv): LogLevel {
  const fallback: LogLevel = nodeEnv === 'development' ? 'debug' : 'info';
  const value = raw ?? fallback;

  if (!isLogLevel(value)) {
    throw new Error("LOG_LEVEL must be one of: 'fatal', 'error', 'warn', 'info', 'debug', 'trace'");
  }

  return value;
}

function loadEnv(): EnvConfig {
  preloadEnvFiles();

  const nodeEnv = parseNodeEnv(process.env.NODE_ENV);

  return {
    NODE_ENV: nodeEnv,
    API_HOST: process.env.API_HOST ?? '127.0.0.1',
    API_PORT: parsePort(process.env.API_PORT, 3001),
    LOG_LEVEL: parseLogLevel(process.env.LOG_LEVEL, nodeEnv),
    DB_HOST: process.env.DB_HOST ?? process.env.MYSQL_HOST ?? '127.0.0.1',
    DB_PORT: parsePort(process.env.DB_PORT ?? process.env.MYSQL_PORT, 3306),
    DB_USER: process.env.DB_USER ?? process.env.MYSQL_USER ?? 'root',
    DB_PASSWORD: process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? '',
    DB_NAME:
      process.env.DB_NAME ?? process.env.MYSQL_DATABASE ?? 'digitalization_of_handwritten_drawings',
    STORAGE_UPLOADS_DIR: process.env.STORAGE_UPLOADS_DIR ?? 'storage/uploads',
    STORAGE_EXPORTS_DIR: process.env.STORAGE_EXPORTS_DIR ?? 'storage/exports',
  };
}

export const env = loadEnv();

