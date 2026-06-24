import {
  type BindWebAuthnPayload,
  MfaFactor,
  type MfaVerificationWebAuthn,
  type User,
  type WebAuthnRegistrationOptions,
  type MfaVerifications,
  type WebAuthnVerificationPayload,
  type VerifyMfaResult,
  webAuthnAuthenticationOptionsTimeout,
} from '@logto/schemas';
import { getUserDisplayName } from '@logto/shared';
import {
  type GenerateRegistrationOptionsOpts,
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type VerifyRegistrationResponseOpts,
  type GenerateAuthenticationOptionsOpts,
  generateAuthenticationOptions,
  type VerifyAuthenticationResponseOpts,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { isoBase64URL } from '@simplewebauthn/server/helpers';

import RequestError from '#src/errors/RequestError/index.js';

type GenerateWebAuthnRegistrationOptionsParameters = {
  rpId: string;
  user: Pick<
    User,
    'id' | 'name' | 'username' | 'primaryEmail' | 'primaryPhone' | 'mfaVerifications'
  >;
};

/**
 * Derive a HUMAN-readable Relying Party name from the RP ID (a bare domain).
 *
 * `rpName` is shown by the authenticator / OS during enrolment ("Save a passkey
 * for <rpName>?"), so it should be a friendly brand name, not a raw hostname.
 * The spec only requires `rpID` (the domain) to be technically correct; `rpName`
 * is purely display. Upstream Logto sets `rpName: rpId`, which surfaces the ugly
 * domain (e.g. "auth.hypedrive.app"). Derive the registrable label instead:
 * drop a leading `auth.`/`www.`/`login.`/`id.` subdomain + the TLD, then
 * title-case — `auth.hypedrive.app` → `Hypedrive`, `login.acme.co.uk` → `Acme`.
 */
export const deriveRpName = (rpId: string): string => {
  const labels = rpId.split('.').filter(Boolean);
  // Strip a known auth-style subdomain prefix.
  if (labels.length > 2 && ['auth', 'www', 'login', 'id', 'account'].includes(labels[0] ?? '')) {
    labels.shift();
  }
  // The registrable name is the first remaining label (before the TLD).
  const brand = labels[0] ?? rpId;
  return brand.charAt(0).toUpperCase() + brand.slice(1);
};

export const generateWebAuthnRegistrationOptions = async ({
  rpId,
  user,
}: GenerateWebAuthnRegistrationOptionsParameters): Promise<WebAuthnRegistrationOptions> => {
  const { username, name, primaryEmail, primaryPhone, id, mfaVerifications } = user;

  const options: GenerateRegistrationOptionsOpts = {
    rpName: deriveRpName(rpId),
    rpID: rpId,
    userID: Uint8Array.from(Buffer.from(id)),
    userName: getUserDisplayName({ username, primaryEmail, primaryPhone }) ?? 'Unnamed User',
    userDisplayName:
      getUserDisplayName({ name, username, primaryEmail, primaryPhone }) ?? 'Unnamed User',
    timeout: webAuthnAuthenticationOptionsTimeout,
    attestationType: 'none',
    excludeCredentials: mfaVerifications
      .filter(
        (verification): verification is MfaVerificationWebAuthn =>
          verification.type === MfaFactor.WebAuthn
      )
      .map(({ credentialId, transports }) => ({
        id: credentialId,
        type: 'public-key',
        transports,
      })),
    // Generate discoverable credentials so they can be used for passkey sign-in.
    authenticatorSelection: {
      residentKey: 'required',
      requireResidentKey: true,
      userVerification: 'required',
    },
    // Values for COSEALG.ES256, COSEALG.RS256, Node.js don't have those enums
    supportedAlgorithmIDs: [-7, -257],
  };

  return generateRegistrationOptions(options);
};

export const verifyWebAuthnRegistration = async (
  payload: Omit<BindWebAuthnPayload, 'type'>,
  challenge: string,
  origins: string[]
) => {
  const options: VerifyRegistrationResponseOpts = {
    response: {
      ...payload,
      type: 'public-key',
    },
    expectedChallenge: challenge,
    expectedOrigin: origins,
    // Enforce verification to align with passkey sign-in requirements.
    requireUserVerification: true,
  };

  try {
    return await verifyRegistrationResponse(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new RequestError('session.mfa.webauthn_verification_failed', {
      message,
    });
  }
};

export const generateWebAuthnAuthenticationOptions = async ({
  rpId,
  mfaVerifications,
  allowDiscoverable = false,
}: {
  rpId: string;
  mfaVerifications: MfaVerifications;
  /** Allow generating options without allowCredentials (discoverable passkeys) */
  allowDiscoverable?: boolean;
}) => {
  const webAuthnVerifications = mfaVerifications.filter(
    (verification): verification is MfaVerificationWebAuthn =>
      verification.type === MfaFactor.WebAuthn
  );

  if (webAuthnVerifications.length === 0 && !allowDiscoverable) {
    throw new RequestError('session.mfa.webauthn_verification_not_found');
  }

  const options: GenerateAuthenticationOptionsOpts = {
    timeout: webAuthnAuthenticationOptionsTimeout,
    allowCredentials: webAuthnVerifications.map(({ credentialId, transports }) => ({
      id: credentialId,
      type: 'public-key',
      transports,
    })),
    userVerification: 'required',
    rpID: rpId,
  };
  return generateAuthenticationOptions(options);
};

type VerifyWebAuthnAuthenticationParameters = {
  payload: Omit<WebAuthnVerificationPayload, 'type'>;
  challenge: string;
  rpId: string;
  origin: string;
  mfaVerifications: MfaVerifications;
};

export const verifyWebAuthnAuthentication = async ({
  payload,
  challenge,
  rpId,
  origin,
  mfaVerifications,
}: VerifyWebAuthnAuthenticationParameters): Promise<{
  result: false | VerifyMfaResult;
  newCounter?: number;
}> => {
  const webAuthnVerifications = mfaVerifications.filter(
    (verification): verification is MfaVerificationWebAuthn =>
      verification.type === MfaFactor.WebAuthn
  );
  const verification = webAuthnVerifications.find(
    ({ credentialId }) => credentialId === payload.id
  );

  if (!verification) {
    return { result: false };
  }

  const { publicKey, credentialId, counter, transports, id } = verification;

  const options: VerifyAuthenticationResponseOpts = {
    response: {
      ...payload,
      type: 'public-key',
    },
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpId,
    // V13: `authenticator` renamed to `credential`, fields renamed to match WebAuthnCredential.
    credential: {
      publicKey: isoBase64URL.toBuffer(publicKey),
      id: credentialId,
      counter,
      transports,
    },
    requireUserVerification: true,
  };

  try {
    const { verified, authenticationInfo } = await verifyAuthenticationResponse(options);
    if (!verified) {
      return { result: false };
    }
    return {
      result: {
        type: MfaFactor.WebAuthn,
        id,
      },
      newCounter: authenticationInfo.newCounter,
    };
  } catch {
    return { result: false };
  }
};
