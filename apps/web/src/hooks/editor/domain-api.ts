import type { EditorHookManager } from './manager';
import type { EditorHookContextByName } from './contexts';
import type { EditorHookName } from './hook-names';
import type { EditorHookHandler, HookExecutionResult, RegisterHookResult } from './contracts';

export interface EditorDomainHookApi {
  register<TName extends EditorHookName>(name: TName, handler: EditorHookHandler<TName>): RegisterHookResult;
  execute<TName extends EditorHookName>(
    name: TName,
    context: EditorHookContextByName[TName],
  ): Promise<HookExecutionResult<TName>>;
}

export function createEditorDomainHookApi(
  manager: EditorHookManager,
  domain: string,
): EditorDomainHookApi {
  return {
    register(name, handler) {
      return manager.register(name, handler);
    },

    execute(name, context) {
      return manager.execute(name, {
        ...context,
        domain: context.domain ?? domain,
      });
    },
  };
}