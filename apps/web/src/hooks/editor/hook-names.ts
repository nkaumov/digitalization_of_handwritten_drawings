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
export type EditorHookPhase = 'before' | 'after';
export type EditorHookArea = 'drawing' | 'element' | 'export';

export interface EditorHookPointDescriptor {
  name: EditorHookName;
  phase: EditorHookPhase;
  area: EditorHookArea;
  operation: 'load' | 'create' | 'update' | 'delete' | 'save' | 'export';
}

export const EDITOR_HOOK_POINTS: Record<EditorHookName, EditorHookPointDescriptor> = {
  beforeDrawingLoad: {
    name: 'beforeDrawingLoad',
    phase: 'before',
    area: 'drawing',
    operation: 'load',
  },
  afterDrawingLoad: {
    name: 'afterDrawingLoad',
    phase: 'after',
    area: 'drawing',
    operation: 'load',
  },
  beforeElementCreate: {
    name: 'beforeElementCreate',
    phase: 'before',
    area: 'element',
    operation: 'create',
  },
  afterElementCreate: {
    name: 'afterElementCreate',
    phase: 'after',
    area: 'element',
    operation: 'create',
  },
  beforeElementUpdate: {
    name: 'beforeElementUpdate',
    phase: 'before',
    area: 'element',
    operation: 'update',
  },
  afterElementUpdate: {
    name: 'afterElementUpdate',
    phase: 'after',
    area: 'element',
    operation: 'update',
  },
  beforeElementDelete: {
    name: 'beforeElementDelete',
    phase: 'before',
    area: 'element',
    operation: 'delete',
  },
  afterElementDelete: {
    name: 'afterElementDelete',
    phase: 'after',
    area: 'element',
    operation: 'delete',
  },
  beforeDrawingSave: {
    name: 'beforeDrawingSave',
    phase: 'before',
    area: 'drawing',
    operation: 'save',
  },
  afterDrawingSave: {
    name: 'afterDrawingSave',
    phase: 'after',
    area: 'drawing',
    operation: 'save',
  },
  beforeExport: {
    name: 'beforeExport',
    phase: 'before',
    area: 'export',
    operation: 'export',
  },
  afterExport: {
    name: 'afterExport',
    phase: 'after',
    area: 'export',
    operation: 'export',
  },
};

export function isEditorHookName(value: string): value is EditorHookName {
  return (EDITOR_HOOK_NAMES as readonly string[]).includes(value);
}

export function getEditorHookPoint(name: EditorHookName): EditorHookPointDescriptor {
  return EDITOR_HOOK_POINTS[name];
}
