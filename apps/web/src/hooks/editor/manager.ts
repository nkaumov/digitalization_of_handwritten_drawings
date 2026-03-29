import type { EditorHookContextByName } from './contexts';
import { EDITOR_HOOK_NAMES, getEditorHookPoint, type EditorHookName } from './hook-names';
import type {
  EditorHookHandler,
  HookChainExecutionOptions,
  HookChainExecutionResult,
  HookExecutionCall,
  HookExecutionOptions,
  EditorHookManagerOptions,
  HookExecutionError,
  HookExecutionResult,
  RegisterHookResult,
} from './contracts';
import { createDefaultHookLogger, type HookLogger } from './logger';

type InternalHookHandler = (context: unknown) => unknown | Promise<unknown>;

export class EditorHookManager {
  private readonly handlers = new Map<EditorHookName, Map<string, InternalHookHandler>>();

  private sequence = 0;

  private readonly onError?: EditorHookManagerOptions['onError'];
  private readonly continueOnSafeFailure: boolean;
  private readonly defaultTriggeredBy: string;
  private readonly logger: HookLogger;

  public constructor(options?: EditorHookManagerOptions) {
    this.onError = options?.onError;
    this.continueOnSafeFailure = options?.continueOnSafeFailure ?? true;
    this.defaultTriggeredBy = options?.defaultTriggeredBy ?? 'editor-core';
    this.logger = options?.logger ?? createDefaultHookLogger();

    for (const name of EDITOR_HOOK_NAMES) {
      this.handlers.set(name, new Map<string, InternalHookHandler>());
    }
  }

  public register<TName extends EditorHookName>(
    name: TName,
    handler: EditorHookHandler<TName>,
  ): RegisterHookResult {
    const handlerId = this.nextHandlerId(name);
    const bucket = this.getBucket(name);

    const wrapped: InternalHookHandler = (context) =>
      handler(context as EditorHookContextByName[TName]);

    bucket.set(handlerId, wrapped);

    return {
      handlerId,
      unregister: () => this.unregister(name, handlerId),
    };
  }

  public unregister(name: EditorHookName, handlerId: string): boolean {
    const bucket = this.getBucket(name);
    return bucket.delete(handlerId);
  }

  public clear(name?: EditorHookName): void {
    if (name) {
      this.getBucket(name).clear();
      return;
    }

    for (const bucket of this.handlers.values()) {
      bucket.clear();
    }
  }

  public count(name: EditorHookName): number {
    return this.getBucket(name).size;
  }

  public async execute<TName extends EditorHookName>(
    name: TName,
    context: EditorHookContextByName[TName],
    options?: HookExecutionOptions,
  ): Promise<HookExecutionResult<TName>> {
    const bucket = this.getBucket(name);
    const errors: HookExecutionError[] = [];
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    const chainId = options?.chainId ?? this.createChainId();
    const sequence = options?.sequence ?? 1;
    const totalInChain = options?.totalInChain ?? 1;
    const continueOnSafeFailure = options?.continueOnSafeFailure ?? this.continueOnSafeFailure;
    const triggeredBy = options?.triggeredBy ?? this.defaultTriggeredBy;
    const hookPoint = getEditorHookPoint(name);
    const callId = this.createCallId(name, sequence);

    let currentContext = {
      ...context,
      runtime: {
        ...context.runtime,
        chainId,
        callId,
        hookName: name,
        hookPhase: hookPoint.phase,
        hookArea: hookPoint.area,
        operation: hookPoint.operation,
        sequence,
        totalInChain,
        triggeredBy,
        startedAtIso,
        continueOnSafeFailure,
      },
    };
    const totalHandlers = bucket.size;
    let abortedByPolicy = false;

    this.logger.info('hook execution started', {
      hook: name,
      chainId,
      sequence,
      totalInChain,
      triggeredBy,
      handlerCount: totalHandlers,
      continueOnSafeFailure,
    });

    for (const [handlerId, handler] of bucket.entries()) {
      try {
        this.logger.info('hook handler started', { hook: name, chainId, handlerId });
        const next = await handler(currentContext);
        if (next !== undefined) {
          currentContext = {
            ...(next as EditorHookContextByName[TName]),
            runtime: currentContext.runtime,
          };
        }
        this.logger.info('hook handler completed', { hook: name, chainId, handlerId });
      } catch (error) {
        const executionError: HookExecutionError = {
          chainId,
          hookName: name,
          handlerId,
          error,
        };

        errors.push(executionError);
        this.logger.error('hook handler failed', {
          hook: name,
          chainId,
          handlerId,
          error: error instanceof Error ? error.message : 'unknown-error',
        });
        this.onError?.(executionError);

        if (!continueOnSafeFailure) {
          abortedByPolicy = true;
          this.logger.error('hook execution aborted by failure policy', { hook: name, chainId });
          break;
        }
      }
    }

    const finishedAt = Date.now();
    const finishedAtIso = new Date(finishedAt).toISOString();
    const durationMs = finishedAt - startedAt;

    this.logger.info('hook execution completed', {
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
    calls: HookExecutionCall[],
    options?: HookChainExecutionOptions,
  ): Promise<HookChainExecutionResult> {
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    const chainId = options?.chainId ?? this.createChainId();
    const continueOnSafeFailure = options?.continueOnSafeFailure ?? this.continueOnSafeFailure;
    const triggeredBy = options?.triggeredBy ?? this.defaultTriggeredBy;
    const steps: HookExecutionResult[] = [];
    const errors: HookExecutionError[] = [];
    let abortedByPolicy = false;

    this.logger.info('hook chain execution started', {
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

    this.logger.info('hook chain execution completed', {
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

  private getBucket(name: EditorHookName): Map<string, InternalHookHandler> {
    const bucket = this.handlers.get(name);
    if (!bucket) {
      throw new Error(`UNKNOWN_HOOK_NAME:${name}`);
    }

    return bucket;
  }

  private nextHandlerId(name: EditorHookName): string {
    this.sequence += 1;
    return `${name}:${this.sequence}`;
  }

  private createChainId(): string {
    this.sequence += 1;
    return `hook-chain:${this.sequence}`;
  }

  private createCallId(name: EditorHookName, sequence: number): string {
    this.sequence += 1;
    return `${name}:call:${sequence}:${this.sequence}`;
  }
}

export function createEditorHookManager(options?: EditorHookManagerOptions): EditorHookManager {
  return new EditorHookManager(options);
}
