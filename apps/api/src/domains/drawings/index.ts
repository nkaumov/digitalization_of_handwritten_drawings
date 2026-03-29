import type { ApiDomainModule } from '@/domains/contracts';

export function createDrawingsDomainModule(): ApiDomainModule {
  return {
    name: 'drawings',
    moduleId: 'api.domains.drawings',
    register(_context) {
      // Stage 4 placeholder: module registration point only.
    },
  };
}
