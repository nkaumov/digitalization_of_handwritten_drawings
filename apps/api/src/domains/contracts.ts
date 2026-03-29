import type { FastifyInstance } from 'fastify';

export const API_DOMAIN_NAMES = ['drawings', 'recognition-jobs', 'files', 'exports'] as const;

export type ApiDomainName = (typeof API_DOMAIN_NAMES)[number];

export interface ApiDomainRegisterContext {
  app: FastifyInstance;
  chainId: string;
  triggeredBy: string;
  order: number;
  total: number;
}

export interface ApiDomainModule {
  readonly name: ApiDomainName;
  readonly moduleId: string;
  register(context: ApiDomainRegisterContext): void;
}

export interface ApiDomainDescriptor {
  name: ApiDomainName;
  moduleId: string;
  order: number;
  module: ApiDomainModule;
}

