export type HistoryCheckpointSource =
  | 'viewport'
  | 'grid'
  | 'geometry'
  | 'selection'
  | 'dimensions'
  | 'tools'
  | 'import'
  | 'save'
  | 'export'
  | 'system';

export interface HistoryCheckpoint<TSnapshot = Record<string, unknown>> {
  id: string;
  source: HistoryCheckpointSource;
  label: string;
  createdAtIso: string;
  snapshot: TSnapshot;
}

export interface HistoryState<TSnapshot = Record<string, unknown>> {
  past: HistoryCheckpoint<TSnapshot>[];
  future: HistoryCheckpoint<TSnapshot>[];
}

export interface CreateHistoryCheckpointInput<TSnapshot = Record<string, unknown>> {
  source: HistoryCheckpointSource;
  label: string;
  snapshot: TSnapshot;
}

export interface EditorHistoryManager<TSnapshot = Record<string, unknown>> {
  push(input: CreateHistoryCheckpointInput<TSnapshot>): HistoryCheckpoint<TSnapshot>;
  undo(): HistoryCheckpoint<TSnapshot> | null;
  redo(): HistoryCheckpoint<TSnapshot> | null;
  getState(): HistoryState<TSnapshot>;
  clear(): void;
}
