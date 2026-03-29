export const EDITOR_HOOK_NAMES = [
  'beforeDrawingLoad',
  'afterDrawingLoad',
  'beforeElementCreate',
  'afterElementCreate',
  'beforeElementUpdate',
  'afterElementUpdate',
  'beforeElementDelete',
  'afterElementDelete',
  'beforeDrawingSave',
  'afterDrawingSave',
  'beforeExport',
  'afterExport',
] as const;

export type EditorHookName = (typeof EDITOR_HOOK_NAMES)[number];

export interface EditorHookContext {
  drawingId?: string;
  elementId?: string;
  domain?: string;
  payload?: unknown;
  meta?: Record<string, unknown>;
}

export type EditorHookHandler<TContext extends EditorHookContext = EditorHookContext> = (
  context: TContext,
) => void | TContext | Promise<void | TContext>;

export interface HookExecutionError {
  hookName: EditorHookName;
  handlerId: string;
  error: unknown;
}

export interface HookExecutionResult<TContext extends EditorHookContext = EditorHookContext> {
  context: TContext;
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

export function isEditorHookName(value: string): value is EditorHookName {
  return (EDITOR_HOOK_NAMES as readonly string[]).includes(value);
}