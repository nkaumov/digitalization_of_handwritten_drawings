import type { FastifyInstance } from 'fastify';

import { createDrawingsDomainModule } from '@/domains/drawings';
import { createExportsDomainModule } from '@/domains/exports';
import { createFilesDomainModule } from '@/domains/files';
import { createRecognitionJobsDomainModule } from '@/domains/recognition-jobs';
import type { ApiDomainDescriptor } from '@/domains/contracts';
import { createApiDomainRegistry } from '@/domains/registry';
import {
  createDomainLifecycleHookManager,
  type DomainLifecycleHookManager,
} from '@/domains/lifecycle/manager';

export interface ApiDomainBootstrapOptions {
  hookManager?: DomainLifecycleHookManager;
  chainId?: string;
  triggeredBy?: string;
}

export interface ApiDomainBootstrapResult {
  chainId: string;
  completedDomains: string[];
  failedDomains: string[];
}

function buildDefaultDescriptors(): ApiDomainDescriptor[] {
  const registry = createApiDomainRegistry();
  registry.register(createDrawingsDomainModule());
  registry.register(createRecognitionJobsDomainModule());
  registry.register(createFilesDomainModule());
  registry.register(createExportsDomainModule());
  return registry.descriptors();
}

export async function bootstrapApiDomains(
  app: FastifyInstance,
  options?: ApiDomainBootstrapOptions,
): Promise<ApiDomainBootstrapResult> {
  const descriptors = buildDefaultDescriptors();
  const hookManager = options?.hookManager ?? createDomainLifecycleHookManager();
  const triggeredBy = options?.triggeredBy ?? 'api-app-bootstrap';
  const chainId = options?.chainId ?? `api-domain-bootstrap:${Date.now()}`;
  const completedDomains: string[] = [];
  const failedDomains: string[] = [];
  const total = descriptors.length;

  await hookManager.execute('beforeDomainBootstrap', {
    payload: {
      app,
      total,
    },
  }, {
    chainId,
    triggeredBy,
  });

  for (const descriptor of descriptors) {
    await hookManager.execute('beforeDomainRegister', {
      payload: {
        app,
        domainName: descriptor.name,
        moduleId: descriptor.moduleId,
        order: descriptor.order,
        total,
      },
    }, {
      chainId,
      triggeredBy,
    });

    try {
      descriptor.module.register({
        app,
        chainId,
        triggeredBy,
        order: descriptor.order,
        total,
      });
      completedDomains.push(descriptor.name);

      await hookManager.execute('afterDomainRegister', {
        payload: {
          app,
          domainName: descriptor.name,
          moduleId: descriptor.moduleId,
          order: descriptor.order,
          total,
        },
      }, {
        chainId,
        triggeredBy,
      });
    } catch (error) {
      failedDomains.push(descriptor.name);
      await hookManager.execute('onDomainRegisterError', {
        payload: {
          app,
          domainName: descriptor.name,
          moduleId: descriptor.moduleId,
          order: descriptor.order,
          total,
          error,
        },
      }, {
        chainId,
        triggeredBy,
      });
    }
  }

  await hookManager.execute('afterDomainBootstrap', {
    payload: {
      app,
      total,
    },
    meta: {
      completedDomains,
      failedDomains,
    },
  }, {
    chainId,
    triggeredBy,
  });

  return {
    chainId,
    completedDomains,
    failedDomains,
  };
}

