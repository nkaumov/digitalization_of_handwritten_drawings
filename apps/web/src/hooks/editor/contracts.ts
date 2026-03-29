import type { EditorHookContextByName } from './contexts';
import type { EditorHookName } from './hook-names';

export type EditorHookHandler<TName extends EditorHookName = EditorHookName> = (
  context: EditorHookContextByName[TName],
) => void | EditorHookContextByName[TName] | Promise<void | EditorHookContextByName[TName]>;

export interface HookExecutionError {
  hookName: EditorHookName;
  handlerId: string;
  error: unknown;
}

export interface HookExecutionResult<TName extends EditorHookName = EditorHookName> {
  context: EditorHookContextByName[TName];
  errors: HookExecutionError[];
}

export interface RegisterHookResult {
  handlerId: string;
  unregister: () => boolean;
}

export type HookErrorListener = (error: HookExecutionError) => void;

export interface EditorHookManagerOptions {
  onError?: HookErrorListener;
}