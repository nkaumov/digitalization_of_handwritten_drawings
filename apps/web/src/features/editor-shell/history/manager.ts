import type {
  CreateHistoryCheckpointInput,
  EditorHistoryManager,
  HistoryCheckpoint,
  HistoryState,
} from './contracts';

class InMemoryEditorHistoryManager<TSnapshot = Record<string, unknown>>
  implements EditorHistoryManager<TSnapshot>
{
  private readonly past: HistoryCheckpoint<TSnapshot>[] = [];
  private readonly future: HistoryCheckpoint<TSnapshot>[] = [];
  private sequence = 0;

  public push(input: CreateHistoryCheckpointInput<TSnapshot>): HistoryCheckpoint<TSnapshot> {
    const checkpoint: HistoryCheckpoint<TSnapshot> = {
      id: this.nextId(),
      source: input.source,
      label: input.label,
      createdAtIso: new Date().toISOString(),
      snapshot: input.snapshot,
    };

    this.past.push(checkpoint);
    this.future.length = 0;
    return checkpoint;
  }

  public undo(): HistoryCheckpoint<TSnapshot> | null {
    if (this.past.length < 2) {
      return null;
    }

    const current = this.past.pop();
    if (!current) {
      return null;
    }

    this.future.unshift(current);
    return this.past[this.past.length - 1] ?? null;
  }

  public redo(): HistoryCheckpoint<TSnapshot> | null {
    const next = this.future.shift();
    if (!next) {
      return null;
    }

    this.past.push(next);
    return next;
  }

  public getState(): HistoryState<TSnapshot> {
    return {
      past: [...this.past],
      future: [...this.future],
    };
  }

  public clear(): void {
    this.past.length = 0;
    this.future.length = 0;
  }

  private nextId(): string {
    this.sequence += 1;
    return `history:${this.sequence}`;
  }
}

export function createEditorHistoryManager<TSnapshot = Record<string, unknown>>(): EditorHistoryManager<TSnapshot> {
  return new InMemoryEditorHistoryManager<TSnapshot>();
}
