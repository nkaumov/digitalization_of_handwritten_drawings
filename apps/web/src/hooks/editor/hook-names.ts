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

export function isEditorHookName(value: string): value is EditorHookName {
  return (EDITOR_HOOK_NAMES as readonly string[]).includes(value);
}