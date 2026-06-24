const api_resource_details = {
  page_title: 'API resource details',
  back_to_api_resources: 'Back to API resources',
  general_tab: 'General',
  permissions_tab: 'Permissions',
  settings: 'Settings',
  settings_description:
    'API resources, a.k.a. Resource Indicators, indicate the target services or resources to be requested, usually, a URI format variable representing the resource‘s identity.',
  management_api_settings_description:
    'The Hypedrive Management API is a comprehensive collection of APIs that empower administrators to manage a wide range of identity-related tasks, enforce security policies, and comply with regulations and standards.',
  management_api_notice:
    'This API represents Hypedrive entity and cannot be modified or deleted. Create a machine-to-machine app to call Hypedrive Management API. <a>Learn more</a>',
  token_expiration_time_in_seconds: 'Token expiration time (in seconds)',
  token_expiration_time_in_seconds_placeholder: 'Enter your token expiration time',
  default_acr: 'Default step-up requirement',
  default_acr_tip:
    'The minimum authentication strength (ACR) required before any scope of this API may be granted in an access token. Overridden by per-scope settings; overrides the app-level default.',
  default_acr_none: 'None (inherit app default)',
  default_acr_mfa: 'MFA required',
  default_acr_phr: 'Phishing-resistant MFA required (WebAuthn / passkey only)',
  delete_description:
    'This action cannot be undone. It will permanently delete the API resource. Please enter the api resource name <span>{{name}}</span> to confirm.',
  enter_your_api_resource_name: 'Enter your API resource name',
  api_resource_deleted: 'The API resource {{name}} has been successfully deleted',
  permission: {
    create_button: 'Create permission',
    create_title: 'Create permission',
    create_subtitle: 'Define the permissions (scopes) needed by this API.',
    confirm_create: 'Create permission',
    edit_title: 'Edit API permission',
    edit_subtitle: 'Define the permissions (scopes) needed by the {{resourceName}} API.',
    name: 'Permission name',
    name_placeholder: 'read:resource',
    forbidden_space_in_name: 'The permission name must not contain any spaces.',
    description: 'Description',
    description_placeholder: 'Able to read the resources',
    permission_created: 'The permission {{name}} has been successfully created',
    delete_description:
      'If this permission is deleted, the user who had this permission will lose the access granted by it.',
    deleted: 'The permission "{{name}}" was successfully deleted.',
    required_acr: 'Step-up requirement',
    required_acr_tip:
      'The minimum authentication strength (ACR) a user session must reach before this specific permission can be issued in an access token. When set, overrides the API-level default.',
    required_acr_none: 'None (inherit API default)',
    required_acr_mfa: 'MFA required',
    required_acr_phr: 'Phishing-resistant MFA required (WebAuthn / passkey only)',
  },
};

export default Object.freeze(api_resource_details);
