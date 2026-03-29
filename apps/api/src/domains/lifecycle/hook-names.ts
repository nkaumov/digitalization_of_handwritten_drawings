export const DOMAIN_LIFECYCLE_HOOK_NAMES = [
  'beforeDomainBootstrap',
  'afterDomainBootstrap',
  'beforeDomainRegister',
  'afterDomainRegister',
  'onDomainRegisterError',
] as const;

export type DomainLifecycleHookName = (typeof DOMAIN_LIFECYCLE_HOOK_NAMES)[number];

export function isDomainLifecycleHookName(value: string): value is DomainLifecycleHookName {
  return (DOMAIN_LIFECYCLE_HOOK_NAMES as readonly string[]).includes(value);
}

