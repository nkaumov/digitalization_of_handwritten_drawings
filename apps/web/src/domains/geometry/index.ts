export interface geometryDomainModule {
  readonly domain: 'geometry';
  init(): void;
}

export function createDomainModule(): geometryDomainModule {
  return {
    domain: 'geometry',
    init() {
      // Stage 4 placeholder: domain wiring only, no feature behavior.
    },
  };
}