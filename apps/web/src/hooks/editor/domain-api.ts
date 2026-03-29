import type { EditorHookManager } from './manager';
import type { EditorHookContextByName } from './contexts';
import type { EditorHookName } from './hook-names';
import type {
  EditorHookHandler,
  HookChainExecutionOptions,
  HookChainExecutionResult,
  HookExecutionCall,
  HookExecutionOptions,
  HookExecutionResult,
  RegisterHookResult,
} from './contracts';

export interface EditorDomainHookApi {
  register<TName extends EditorHookName>(name: TName, handler: EditorHookHandler<TName>): RegisterHookResult;
  execute<TName extends EditorHookName>(
    name: TName,
    context: EditorHookContextByName[TName],
    options?: Omit<HookExecutionOptions, 'triggeredBy'>,
  ): Promise<HookExecutionResult<TName>>;
  executeChain(
    calls: HookExecutionCall[],
    options?: Omit<HookChainExecutionOptions, 'triggeredBy'>,
  ): Promise<HookChainExecutionResult>;
}

export function createEditorDomainHookApi(
  manager: EditorHookManager,
  domain: string,
): EditorDomainHookApi {
  return {
    register(name, handler) {
      return manager.register(name, handler);
    },

    execute(name, context, options) {
      return manager.execute(name, {
        ...context,
        domain: context.domain ?? domain,
      }, {
        ...options,
        triggeredBy: domain,
      });
    },

    executeChain(calls, options) {
      return manager.executeChain(
        calls.map((call) => ({
          ...call,
          context: {
            ...call.context,
            domain: call.context.domain ?? domain,
          },
        })),
        {
          ...options,
          triggeredBy: domain,
        },
      );
    },
  };
}
