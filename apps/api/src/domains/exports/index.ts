import type { ApiDomainModule } from '@/domains/contracts';
import { exportsRoutes } from '@/domains/exports/routes';

export * from './contracts';
export * from './id';
export * from './service';

export function createExportsDomainModule(): ApiDomainModule {
  return {
    name: 'exports',
    moduleId: 'api.domains.exports',
    register(context) {
      context.app.register(exportsRoutes);
    },
  };
}

