export interface RecognitionJobsDomainModule {
  readonly domain: 'recognition-jobs';
  register(): void;
}

export function createRecognitionJobsDomainModule(): RecognitionJobsDomainModule {
  return {
    domain: 'recognition-jobs',
    register() {
      // Stage 4 placeholder: module registration point only.
    },
  };
}