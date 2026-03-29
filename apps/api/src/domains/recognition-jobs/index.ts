import type { ApiDomainModule } from '@/domains/contracts';
import { recognitionJobsRoutes } from '@/domains/recognition-jobs/routes';

export * from './contracts';
export * from './id';
export * from './service';

export function createRecognitionJobsDomainModule(): ApiDomainModule {
  return {
    name: 'recognition-jobs',
    moduleId: 'api.domains.recognition-jobs',
    register(context) {
      context.app.register(recognitionJobsRoutes);
    },
  };
}

