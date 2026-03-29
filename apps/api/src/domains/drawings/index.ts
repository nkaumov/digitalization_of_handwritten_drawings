import type { ApiDomainModule } from '@/domains/contracts';
import { drawingsRoutes } from '@/domains/drawings/routes';

export * from './contracts';
export * from './service';
export * from './validation';
export * from './id';

export function createDrawingsDomainModule(): ApiDomainModule {
  return {
    name: 'drawings',
    moduleId: 'api.domains.drawings',
    register(context) {
      context.app.register(drawingsRoutes);
    },
  };
}

