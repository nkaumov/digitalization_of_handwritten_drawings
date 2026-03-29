export interface importDomainModule {
  readonly domain: 'import';
  init(): void;
}

export function createDomainModule(): importDomainModule {
  return {
    domain: 'import',
    init() {
      // Stage 4 placeholder: domain wiring only, no feature behavior.
    },
  };
}