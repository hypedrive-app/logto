import { type TFuncKey } from 'i18next';

import { type SubscriptionQuota } from '@/cloud/types/router';

export enum CustomUsageKey {
  /**
   * Unlike other usage keys,
   * `rbacEnabled` add-on is not a part of the standard Logto SKU quota key,
   * instead it is calculated based on the `userRolesLimit` and `machineToMachineRolesLimit`
   * two quotas.
   * So we need to manually define it here, and calculate the status based on the two quotas.
   */
  RbacEnabled = 'rbacEnabled',
}

export type UsageKey =
  | keyof Pick<
      SubscriptionQuota,
      | 'mauLimit'
      | 'organizationsLimit'
      | 'mfaEnabled'
      | 'enterpriseSsoLimit'
      | 'resourcesLimit'
      | 'machineToMachineLimit'
      | 'tenantMembersLimit'
      | 'tokenLimit'
      | 'hooksLimit'
      | 'securityFeaturesEnabled'
      | 'thirdPartyApplicationsLimit'
      | 'samlApplicationsLimit'
      | 'customDomainsLimit'
    >
  | CustomUsageKey.RbacEnabled;

// We decide not to show `hooksLimit` usage in console for now.
export const usageKeys: UsageKey[] = [
  'mauLimit',
  'organizationsLimit',
  'mfaEnabled',
  'enterpriseSsoLimit',
  CustomUsageKey.RbacEnabled,
  'resourcesLimit',
  'machineToMachineLimit',
  'samlApplicationsLimit',
  'thirdPartyApplicationsLimit',
  'customDomainsLimit',
  'tenantMembersLimit',
  'tokenLimit',
  'securityFeaturesEnabled',
];

export const featureEnablementUsageKeys: UsageKey[] = [
  'mfaEnabled',
  CustomUsageKey.RbacEnabled,
  'securityFeaturesEnabled',
  'organizationsLimit',
];

export const titleKeyMap: Record<
  UsageKey,
  TFuncKey<'translation', 'admin_console.subscription.usage'>
> = {
  mauLimit: 'mau.title',
  organizationsLimit: 'organizations.title',
  mfaEnabled: 'mfa.title',
  enterpriseSsoLimit: 'enterprise_sso.title',
  resourcesLimit: 'api_resources.title',
  machineToMachineLimit: 'machine_to_machine.title',
  tenantMembersLimit: 'tenant_members.title',
  tokenLimit: 'tokens.title',
  hooksLimit: 'hooks.title',
  securityFeaturesEnabled: 'security_features.title',
  thirdPartyApplicationsLimit: 'third_party_applications.title',
  samlApplicationsLimit: 'saml_applications.title',
  rbacEnabled: 'rbacEnabled.title',
  customDomainsLimit: 'custom_domains.title',
};
