import { DOMAIN_LIFECYCLE_HOOK_NAMES, type DomainLifecycleHookName } from '@/domains/lifecycle/hook-names';
import type { DomainLifecycleHookContext } from '@/domains/lifecycle/contexts';
import type {
  DomainLifecycleChainExecutionResult,
  DomainLifecycleExecutionCall,
  DomainLifecycleExecutionError,
  DomainLifecycleExecutionOptions,
  DomainLifecycleExecutionResult,
  DomainLifecycleHookHandler,
  DomainLifecycleManagerOptions,
  RegisterDomainLifecycleHookResult,
} from '@/domains/lifecycle/contracts';
import {
  createDefaultDomainLifecycleLogger,
  type DomainLifecycleLogger,
} from '@/domains/lifecycle/logger';

type InternalHookHandler = (context: unknown) => unknown | Promise<unknown>;

export class DomainLifecycleHookManager {
  private readonly handlers = new Map<DomainLifecycleHookName, Map<string, InternalHookHandler>>();

  private sequence = 0;

  private readonly onError?: DomainLifecycleManagerOptions['onError'];
  private readonly continueOnSafeFailure: boolean;
  private readonly defaultTriggeredBy: string;
  private readonly logger: DomainLifecycleLogger;

  public constructor(options?: DomainLifecycleManagerOptions) {
    this.onError = options?.onError;
    this.continueOnSafeFailure = options?.continueOnSafeFailure ?? true;
    this.defaultTriggeredBy = options?.defaultTriggeredBy ?? 'api-domain-bootstrap';
    this.logger = options?.logger ?? createDefaultDomainLifecycleLogger();

    for (const name of DOMAIN_LIFECYCLE_HOOK_NAMES) {
      this.handlers.set(name, new Map<string, InternalHookHandler>());
    }
  }

  public register(
    name: DomainLifecycleHookName,
    handler: DomainLifecycleHookHandler,
  ): RegisterDomainLifecycleHookResult {
    const handlerId = this.nextHandlerId(name);
    const bucket = this.getBucket(name);

    const wrapped: InternalHookHandler = (context) => handler(context as DomainLifecycleHookContext);
    bucket.set(handlerId, wrapped);

    return {
      handlerId,
      unregister: () => this.unregister(name, handlerId),
    };
  }

  public unregister(name: DomainLifecycleHookName, handlerId: string): boolean {
    return this.getBucket(name).delete(handlerId);
  }

  public async execute(
    name: DomainLifecycleHookName,
    context: Omit<DomainLifecycleHookContext, 'runtime'>,
    options?: DomainLifecycleExecutionOptions,
  ): Promise<DomainLifecycleExecutionResult> {
    const bucket = this.getBucket(name);
    const errors: DomainLifecycleExecutionError[] = [];
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    const chainId = options?.chainId ?? this.createChainId();
    const sequence = options?.sequence ?? 1;
    const totalInChain = options?.totalInChain ?? 1;
    const continueOnSafeFailure = options?.continueOnSafeFailure ?? this.continueOnSafeFailure;
    const triggeredBy = options?.triggeredBy ?? this.defaultTriggeredBy;
    const callId = this.createCallId(name, sequence);
    let currentContext: DomainLifecycleHookContext = {
      ...context,
      runtime: {
        chainId,
        callId,
        hookName: name,
        sequence,
        totalInChain,
        triggeredBy,
        startedAtIso,
        continueOnSafeFailure,
      },
    };
    const totalHandlers = bucket.size;
    let abortedByPolicy = false;

    this.logger.info('domain lifecycle hook execution started', {
      hook: name,
      chainId,
      sequence,
      totalInChain,
      triggeredBy,
      handlerCount: totalHandlers,
    });

    for (const [handlerId, handler] of bucket.entries()) {
      try {
        this.logger.info('domain lifecycle hook handler started', { hook: name, chainId, handlerId });
        const next = await handler(currentContext);
        if (next !== undefined) {
          currentContext = {
            ...(next as DomainLifecycleHookContext),
            runtime: currentContext.runtime,
          };
        }
        this.logger.info('domain lifecycle hook handler completed', { hook: name, chainId, handlerId });
      } catch (error) {
        const executionError: DomainLifecycleExecutionError = {
          chainId,
          hookName: name,
          handlerId,
          error,
        };
        errors.push(executionError);
        this.logger.error('domain lifecycle hook handler failed', {
          hook: name,
          chainId,
          handlerId,
          error: error instanceof Error ? error.message : 'unknown-error',
        });
        this.onError?.(executionError);

        if (!continueOnSafeFailure) {
          abortedByPolicy = true;
          this.logger.error('domain lifecycle hook execution aborted by failure policy', {
            hook: name,
            chainId,
          });
          break;
        }
      }
    }

    const finishedAt = Date.now();
    const finishedAtIso = new Date(finishedAt).toISOString();
    const durationMs = finishedAt - startedAt;

    this.logger.info('domain lifecycle hook execution completed', {
      hook: name,
      chainId,
      durationMs,
      handlerCount: totalHandlers,
      errors: errors.length,
      abortedByPolicy,
      continueOnSafeFailure,
    });

    return {
      hookName: name,
      chainId,
      handlerCount: totalHandlers,
      startedAtIso,
      finishedAtIso,
      durationMs,
      abortedByPolicy,
      context: currentContext,
      errors,
    };
  }

  public async executeChain(
    calls: DomainLifecycleExecutionCall[],
    options?: Omit<DomainLifecycleExecutionOptions, 'sequence' | 'totalInChain'>,
  ): Promise<DomainLifecycleChainExecutionResult> {
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    const chainId = options?.chainId ?? this.createChainId();
    const continueOnSafeFailure = options?.continueOnSafeFailure ?? this.continueOnSafeFailure;
    const triggeredBy = options?.triggeredBy ?? this.defaultTriggeredBy;
    const steps: DomainLifecycleExecutionResult[] = [];
    const errors: DomainLifecycleExecutionError[] = [];
    let abortedByPolicy = false;

    this.logger.info('domain lifecycle hook chain started', {
      chainId,
      triggeredBy,
      stepCount: calls.length,
      continueOnSafeFailure,
    });

    for (const [index, call] of calls.entries()) {
      const step = await this.execute(call.name, call.context, {
        chainId,
        triggeredBy,
        continueOnSafeFailure,
        sequence: index + 1,
        totalInChain: calls.length,
      });
      steps.push(step);
      errors.push(...step.errors);

      if (step.abortedByPolicy) {
        abortedByPolicy = true;
        break;
      }
    }

    const finishedAt = Date.now();
    const finishedAtIso = new Date(finishedAt).toISOString();
    const durationMs = finishedAt - startedAt;

    this.logger.info('domain lifecycle hook chain completed', {
      chainId,
      durationMs,
      stepCount: calls.length,
      executedSteps: steps.length,
      errors: errors.length,
      abortedByPolicy,
      continueOnSafeFailure,
    });

    return {
      chainId,
      startedAtIso,
      finishedAtIso,
      durationMs,
      steps,
      errors,
      abortedByPolicy,
    };
  }

  private getBucket(name: DomainLifecycleHookName): Map<string, InternalHookHandler> {
    const bucket = this.handlers.get(name);
    if (!bucket) {
      throw new Error(`UNKNOWN_DOMAIN_LIFECYCLE_HOOK:${name}`);
    }

    return bucket;
  }

  private nextHandlerId(name: DomainLifecycleHookName): string {
    this.sequence += 1;
    return `${name}:${this.sequence}`;
  }

  private createChainId(): string {
    this.sequence += 1;
    return `api-domain-hook-chain:${this.sequence}`;
  }

  private createCallId(name: DomainLifecycleHookName, sequence: number): string {
    this.sequence += 1;
    return `${name}:call:${sequence}:${this.sequence}`;
  }
}

export function createDomainLifecycleHookManager(
  options?: DomainLifecycleManagerOptions,
): DomainLifecycleHookManager {
  return new DomainLifecycleHookManager(options);
}

