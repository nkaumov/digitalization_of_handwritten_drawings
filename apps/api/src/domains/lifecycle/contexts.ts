import type { FastifyInstance } from 'fastify';

import type { ApiDomainName } from '@/domains/contracts';
import type { DomainLifecycleHookName } from '@/domains/lifecycle/hook-names';

export interface DomainLifecycleRuntimeContext {
  chainId: string;
  callId: string;
  hookName: DomainLifecycleHookName;
  sequence: number;
  totalInChain: number;
  triggeredBy: string;
  startedAtIso: string;
  continueOnSafeFailure: boolean;
}

export interface DomainLifecyclePayload {
  app: FastifyInstance;
  domainName?: ApiDomainName;
  moduleId?: string;
  order?: number;
  total?: number;
  error?: unknown;
}

export interface DomainLifecycleHookContext {
  payload: DomainLifecyclePayload;
  runtime: DomainLifecycleRuntimeContext;
  meta?: Record<string, unknown>;
}

