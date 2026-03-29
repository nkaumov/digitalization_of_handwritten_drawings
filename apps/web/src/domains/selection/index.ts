export interface selectionDomainModule {
  readonly domain: 'selection';
  init(): void;
}

export function createDomainModule(): selectionDomainModule {
  return {
    domain: 'selection',
    init() {
      // Stage 4 placeholder: domain wiring only, no feature behavior.
    },
  };
}