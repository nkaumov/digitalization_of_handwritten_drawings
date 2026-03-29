import type { DomainLifecycleHookContext } from '@/domains/lifecycle/contexts';
import type { DomainLifecycleHookName } from '@/domains/lifecycle/hook-names';
import type { DomainLifecycleLogger } from '@/domains/lifecycle/logger';

export type DomainLifecycleHookHandler = (
  context: DomainLifecycleHookContext,
) => void | DomainLifecycleHookContext | Promise<void | DomainLifecycleHookContext>;

export interface DomainLifecycleExecutionError {
  chainId: string;
  hookName: DomainLifecycleHookName;
  handlerId: string;
  error: unknown;
}

export interface DomainLifecycleExecutionResult {
  hookName: DomainLifecycleHookName;
  chainId: string;
  handlerCount: number;
  startedAtIso: string;
  finishedAtIso: string;
  durationMs: number;
  abortedByPolicy: boolean;
  context: DomainLifecycleHookContext;
  errors: DomainLifecycleExecutionError[];
}

export interface DomainLifecycleExecutionOptions {
  chainId?: string;
  triggeredBy?: string;
  continueOnSafeFailure?: boolean;
  sequence?: number;
  totalInChain?: number;
}

export interface DomainLifecycleExecutionCall {
  name: DomainLifecycleHookName;
  context: Omit<DomainLifecycleHookContext, 'runtime'>;
}

export interface DomainLifecycleChainExecutionResult {
  chainId: string;
  startedAtIso: string;
  finishedAtIso: string;
  durationMs: number;
  steps: DomainLifecycleExecutionResult[];
  errors: DomainLifecycleExecutionError[];
  abortedByPolicy: boolean;
}

export interface RegisterDomainLifecycleHookResult {
  handlerId: string;
  unregister: () => boolean;
}

export type DomainLifecycleErrorListener = (error: DomainLifecycleExecutionError) => void;

export interface DomainLifecycleManagerOptions {
  onError?: DomainLifecycleErrorListener;
  continueOnSafeFailure?: boolean;
  defaultTriggeredBy?: string;
  logger?: DomainLifecycleLogger;
}

