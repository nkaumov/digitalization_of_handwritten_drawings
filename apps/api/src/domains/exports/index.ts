import type { ApiDomainModule } from '@/domains/contracts';

export function createExportsDomainModule(): ApiDomainModule {
  return {
    name: 'exports',
    moduleId: 'api.domains.exports',
    register(_context) {
      // Stage 4 placeholder: module registration point only.
    },
  };
}
