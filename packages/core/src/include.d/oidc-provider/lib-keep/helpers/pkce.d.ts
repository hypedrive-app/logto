declare module 'oidc-provider/lib/helpers/pkce.js' {
  function checkPKCE(
    codeVerifier: string | undefined,
    codeChallenge: string | undefined,
    codeChallengeMethod: string | undefined
  ): void;

  export default checkPKCE;
}
