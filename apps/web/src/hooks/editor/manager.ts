import type { EditorHookContextByName } from './contexts';
import { EDITOR_HOOK_NAMES, type EditorHookName } from './hook-names';
import type {
  EditorHookHandler,
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
  private readonly logger: HookLogger;

  public constructor(options?: EditorHookManagerOptions) {
    this.onError = options?.onError;
    this.continueOnSafeFailure = options?.continueOnSafeFailure ?? true;
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
  ): Promise<HookExecutionResult<TName>> {
    const bucket = this.getBucket(name);
    const errors: HookExecutionError[] = [];
    let currentContext = context;
    const totalHandlers = bucket.size;

    this.logger.info('hook execution started', {
      hook: name,
      handlerCount: totalHandlers,
    });

    for (const [handlerId, handler] of bucket.entries()) {
      try {
        this.logger.info('hook handler started', { hook: name, handlerId });
        const next = await handler(currentContext);
        if (next !== undefined) {
          currentContext = next as EditorHookContextByName[TName];
        }
        this.logger.info('hook handler completed', { hook: name, handlerId });
      } catch (error) {
        const executionError: HookExecutionError = {
          hookName: name,
          handlerId,
          error,
        };

        errors.push(executionError);
        this.logger.error('hook handler failed', {
          hook: name,
          handlerId,
          error: error instanceof Error ? error.message : 'unknown-error',
        });
        this.onError?.(executionError);

        if (!this.continueOnSafeFailure) {
          this.logger.error('hook execution aborted by failure policy', { hook: name });
          break;
        }
      }
    }

    this.logger.info('hook execution completed', {
      hook: name,
      handlerCount: totalHandlers,
      errors: errors.length,
      continueOnSafeFailure: this.continueOnSafeFailure,
    });

    return {
      context: currentContext,
      errors,
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
}

export function createEditorHookManager(options?: EditorHookManagerOptions): EditorHookManager {
  return new EditorHookManager(options);
}
