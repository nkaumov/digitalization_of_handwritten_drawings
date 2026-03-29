import type { EditorHookArea, EditorHookName, EditorHookPhase } from './hook-names';
import type {
  DrawingLoadPayload,
  DrawingSavePayload,
  ElementCreatePayload,
  ElementDeletePayload,
  ElementUpdatePayload,
  ExportPayload,
} from './payloads';

export interface BaseEditorHookContext<TPayload> {
  drawingId?: string;
  elementId?: string;
  domain?: string;
  payload: TPayload;
  meta?: Record<string, unknown>;
  runtime?: EditorHookRuntimeContext;
}

export interface EditorHookRuntimeContext {
  chainId: string;
  callId: string;
  hookName: EditorHookName;
  hookPhase: EditorHookPhase;
  hookArea: EditorHookArea;
  operation: 'load' | 'create' | 'update' | 'delete' | 'save' | 'export';
  sequence: number;
  totalInChain: number;
  triggeredBy: string;
  startedAtIso: string;
  continueOnSafeFailure: boolean;
}

export type BeforeDrawingLoadContext = BaseEditorHookContext<DrawingLoadPayload>;
export type AfterDrawingLoadContext = BaseEditorHookContext<DrawingLoadPayload>;

export type BeforeElementCreateContext = BaseEditorHookContext<ElementCreatePayload>;
export type AfterElementCreateContext = BaseEditorHookContext<ElementCreatePayload>;

export type BeforeElementUpdateContext = BaseEditorHookContext<ElementUpdatePayload>;
export type AfterElementUpdateContext = BaseEditorHookContext<ElementUpdatePayload>;

export type BeforeElementDeleteContext = BaseEditorHookContext<ElementDeletePayload>;
export type AfterElementDeleteContext = BaseEditorHookContext<ElementDeletePayload>;

export type BeforeDrawingSaveContext = BaseEditorHookContext<DrawingSavePayload>;
export type AfterDrawingSaveContext = BaseEditorHookContext<DrawingSavePayload>;

export type BeforeExportContext = BaseEditorHookContext<ExportPayload>;
export type AfterExportContext = BaseEditorHookContext<ExportPayload>;

export interface EditorHookContextByName {
  beforeDrawingLoad: BeforeDrawingLoadContext;
  afterDrawingLoad: AfterDrawingLoadContext;
  beforeElementCreate: BeforeElementCreateContext;
  afterElementCreate: AfterElementCreateContext;
  beforeElementUpdate: BeforeElementUpdateContext;
  afterElementUpdate: AfterElementUpdateContext;
  beforeElementDelete: BeforeElementDeleteContext;
  afterElementDelete: AfterElementDeleteContext;
  beforeDrawingSave: BeforeDrawingSaveContext;
  afterDrawingSave: AfterDrawingSaveContext;
  beforeExport: BeforeExportContext;
  afterExport: AfterExportContext;
}

export type AnyEditorHookContext = EditorHookContextByName[EditorHookName];
