export interface DrawingsDomainModule {
  readonly domain: 'drawings';
  register(): void;
}

export function createDrawingsDomainModule(): DrawingsDomainModule {
  return {
    domain: 'drawings',
    register() {
      // Stage 4 placeholder: module registration point only.
    },
  };
}