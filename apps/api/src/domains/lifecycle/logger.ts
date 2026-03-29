export interface DomainLifecycleLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

function formatMeta(meta?: Record<string, unknown>): string {
  if (!meta) {
    return '';
  }

  return ` ${JSON.stringify(meta)}`;
}

export function createDefaultDomainLifecycleLogger(): DomainLifecycleLogger {
  return {
    info(message, meta) {
      console.info(`[api-domain-lifecycle] ${message}${formatMeta(meta)}`);
    },
    error(message, meta) {
      console.error(`[api-domain-lifecycle] ${message}${formatMeta(meta)}`);
    },
  };
}

