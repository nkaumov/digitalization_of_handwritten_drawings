import type { EditorHookContextByName } from './contexts';
import type { EditorHookName } from './hook-names';
import type { HookLogger } from './logger';

export type EditorHookHandler<TName extends EditorHookName = EditorHookName> = (
  context: EditorHookContextByName[TName],
) => void | EditorHookContextByName[TName] | Promise<void | EditorHookContextByName[TName]>;

export interface HookExecutionError {
  chainId: string;
  hookName: EditorHookName;
  handlerId: string;
  error: unknown;
}

export interface HookExecutionResult<TName extends EditorHookName = EditorHookName> {
  hookName: TName;
  chainId: string;
  handlerCount: number;
  startedAtIso: string;
  finishedAtIso: string;
  durationMs: number;
  abortedByPolicy: boolean;
  context: EditorHookContextByName[TName];
  errors: HookExecutionError[];
}

export interface HookExecutionOptions {
  chainId?: string;
  triggeredBy?: string;
  continueOnSafeFailure?: boolean;
  sequence?: number;
  totalInChain?: number;
}

export interface HookExecutionCall<TName extends EditorHookName = EditorHookName> {
  name: TName;
  context: EditorHookContextByName[TName];
}

export interface HookChainExecutionOptions {
  chainId?: string;
  triggeredBy?: string;
  continueOnSafeFailure?: boolean;
}

export interface HookChainExecutionResult {
  chainId: string;
  startedAtIso: string;
  finishedAtIso: string;
  durationMs: number;
  steps: HookExecutionResult[];
  errors: HookExecutionError[];
  abortedByPolicy: boolean;
}

export interface RegisterHookResult {
  handlerId: string;
  unregister: () => boolean;
}

export type HookErrorListener = (error: HookExecutionError) => void;

export interface EditorHookManagerOptions {
  onError?: HookErrorListener;
  continueOnSafeFailure?: boolean;
  defaultTriggeredBy?: string;
  logger?: HookLogger;
}
