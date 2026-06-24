import type { CustomClientMetadata } from '@logto/schemas';

declare module 'oidc-provider' {
  export interface AllClientMetadata extends CustomClientMetadata {
    appLevelAccessControlEnabled?: boolean;
  }

  export interface Configuration {
    allowWildcardRedirectUris?: boolean;
  }

  // Runtime fields present on AuthorizationCode that are absent from the public typings.
  export interface AuthorizationCode {
    /** Rich Authorization Requests (RAR) data attached during the authorization request. */
    rar?: unknown;
    /** DPoP key binding JWK thumbprint. */
    dpopJkt?: string;
    /** The resource indicator the code was issued for. */
    resource?: string;
    /** PKCE code challenge. */
    codeChallenge?: string;
    /** PKCE code challenge method. */
    codeChallengeMethod?: string;
    /** Whether the code has already been consumed. */
    consumed?: boolean;
  }

  // Runtime fields on Client absent from the public typings.
  export interface ClientMetadata {
    dpopBoundAccessTokens?: boolean;
  }
}
