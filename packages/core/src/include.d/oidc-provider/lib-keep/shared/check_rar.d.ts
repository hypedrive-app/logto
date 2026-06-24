declare module 'oidc-provider/lib/shared/check_rar.js' {
  import type { KoaContextWithOIDC } from 'oidc-provider';

  function checkRar(ctx: KoaContextWithOIDC, next: () => Promise<void>): Promise<void>;

  export default checkRar;
}
