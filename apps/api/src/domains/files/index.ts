import type { ApiDomainModule } from '@/domains/contracts';
import { filesRoutes } from '@/domains/files/routes';

export * from './contracts';
export * from './id';
export * from './service';

export function createFilesDomainModule(): ApiDomainModule {
  return {
    name: 'files',
    moduleId: 'api.domains.files',
    register(context) {
      context.app.register(filesRoutes);
    },
  };
}

