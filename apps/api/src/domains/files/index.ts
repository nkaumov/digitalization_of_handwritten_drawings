import type { ApiDomainModule } from '@/domains/contracts';

export function createFilesDomainModule(): ApiDomainModule {
  return {
    name: 'files',
    moduleId: 'api.domains.files',
    register(_context) {
      // Stage 4 placeholder: module registration point only.
    },
  };
}
