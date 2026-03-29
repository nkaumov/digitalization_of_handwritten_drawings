import type { ApiDomainDescriptor, ApiDomainModule, ApiDomainName } from '@/domains/contracts';

export class ApiDomainRegistry {
  private readonly modules = new Map<ApiDomainName, ApiDomainModule>();

  public register(module: ApiDomainModule): ApiDomainDescriptor {
    this.modules.set(module.name, module);
    const order = this.modules.size;
    return {
      name: module.name,
      moduleId: module.moduleId,
      order,
      module,
    };
  }

  public unregister(name: ApiDomainName): boolean {
    return this.modules.delete(name);
  }

  public names(): ApiDomainName[] {
    return [...this.modules.keys()];
  }

  public descriptors(): ApiDomainDescriptor[] {
    let index = 0;
    return [...this.modules.values()].map((module) => {
      index += 1;
      return {
        name: module.name,
        moduleId: module.moduleId,
        order: index,
        module,
      };
    });
  }
}

export function createApiDomainRegistry(): ApiDomainRegistry {
  return new ApiDomainRegistry();
}

