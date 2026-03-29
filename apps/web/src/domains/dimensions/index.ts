export interface dimensionsDomainModule {
  readonly domain: 'dimensions';
  init(): void;
}

export function createDomainModule(): dimensionsDomainModule {
  return {
    domain: 'dimensions',
    init() {
      // Stage 4 placeholder: domain wiring only, no feature behavior.
    },
  };
}