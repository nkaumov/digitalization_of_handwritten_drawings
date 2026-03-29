export interface FilesDomainModule {
  readonly domain: 'files';
  register(): void;
}

export function createFilesDomainModule(): FilesDomainModule {
  return {
    domain: 'files',
    register() {
      // Stage 4 placeholder: module registration point only.
    },
  };
}