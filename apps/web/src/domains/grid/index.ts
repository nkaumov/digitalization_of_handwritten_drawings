export interface gridDomainModule {
  readonly domain: 'grid';
  init(): void;
}

export function createDomainModule(): gridDomainModule {
  return {
    domain: 'grid',
    init() {
      // Stage 4 placeholder: domain wiring only, no feature behavior.
    },
  };
}