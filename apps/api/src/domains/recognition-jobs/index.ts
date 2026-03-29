import type { ApiDomainModule } from '@/domains/contracts';

export function createRecognitionJobsDomainModule(): ApiDomainModule {
  return {
    name: 'recognition-jobs',
    moduleId: 'api.domains.recognition-jobs',
    register(_context) {
      // Stage 4 placeholder: module registration point only.
    },
  };
}
