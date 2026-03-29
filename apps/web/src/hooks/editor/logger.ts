export interface HookLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

function formatMeta(meta?: Record<string, unknown>): string {
  if (!meta) {
    return '';
  }

  return ` ${JSON.stringify(meta)}`;
}

export function createDefaultHookLogger(): HookLogger {
  return {
    info(message, meta) {
      console.info(`[editor-hooks] ${message}${formatMeta(meta)}`);
    },
    error(message, meta) {
      console.error(`[editor-hooks] ${message}${formatMeta(meta)}`);
    },
  };
}