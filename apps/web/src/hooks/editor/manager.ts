import {
  EDITOR_HOOK_NAMES,
  type EditorHookContext,
  type EditorHookHandler,
  type EditorHookManagerOptions,
  type EditorHookName,
  type HookExecutionError,
  type HookExecutionResult,
  type RegisterHookResult,
} from './types';

export class EditorHookManager {
  private readonly handlers = new Map<EditorHookName, Map<string, EditorHookHandler>>();

  private sequence = 0;

  private readonly onError?: EditorHookManagerOptions['onError'];

  public constructor(options?: EditorHookManagerOptions) {
    this.onError = options?.onError;

    for (const name of EDITOR_HOOK_NAMES) {
      this.handlers.set(name, new Map<string, EditorHookHandler>());
    }
  }

  public register(name: EditorHookName, handler: EditorHookHandler): RegisterHookResult {
    const handlerId = this.nextHandlerId(name);
    const bucket = this.getBucket(name);

    bucket.set(handlerId, handler);

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

  public async execute<TContext extends EditorHookContext>(
    name: EditorHookName,
    context: TContext,
  ): Promise<HookExecutionResult<TContext>> {
    const bucket = this.getBucket(name);
    const errors: HookExecutionError[] = [];
    let currentContext = context;

    for (const [handlerId, handler] of bucket.entries()) {
      try {
        const next = await handler(currentContext);
        if (next !== undefined) {
          currentContext = next as TContext;
        }
      } catch (error) {
        const executionError: HookExecutionError = {
          hookName: name,
          handlerId,
          error,
        };

        errors.push(executionError);
        this.onError?.(executionError);
      }
    }

    return {
      context: currentContext,
      errors,
    };
  }

  private getBucket(name: EditorHookName): Map<string, EditorHookHandler> {
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