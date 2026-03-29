export interface viewportDomainModule {
  readonly domain: 'viewport';
  init(): void;
}

export function createDomainModule(): viewportDomainModule {
  return {
    domain: 'viewport',
    init() {
      // Stage 4 placeholder: domain wiring only, no feature behavior.
    },
  };
}