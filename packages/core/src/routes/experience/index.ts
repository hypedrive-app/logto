/**
 * @overview This file implements the routes for the user interaction experience (RFC 0004).
 *
 * Note the experience APIs also known as interaction APIs v2,
 * are the new version of the interaction APIs with design improvements.
 *
 * @see {@link https://github.com/logto-io/rfcs | Logto RFCs} for more information about RFC 0004.
 *
 * @remarks
 * The experience APIs can be used by developers to build custom user interaction experiences.
 */

import {
  identificationApiPayloadGuard,
  InteractionEvent,
  type LogtoAcrValue,
  LogtoAcrValues,
} from '@logto/schemas';
import type Router from 'koa-router';
import { type Provider } from 'oidc-provider';
import { z } from 'zod';

import RequestError from '#src/errors/RequestError/index.js';
import koaGuard from '#src/middleware/koa-guard.js';
import koaInteractionDetails from '#src/middleware/koa-interaction-details.js';
import assertThat from '#src/utils/assert-that.js';

import { type AnonymousRouter, type RouterInitArgs } from '../types.js';

import experienceAnonymousRoutes from './anonymous-routes/index.js';
import ExperienceInteraction from './classes/experience-interaction.js';
import { experienceRoutes } from './const.js';
import koaExperienceAuditLog from './middleware/koa-experience-audit-log.js';
import { koaExperienceInteractionHooks } from './middleware/koa-experience-interaction-hooks.js';
import koaExperienceInteraction from './middleware/koa-experience-interaction.js';
import profileRoutes from './profile-routes.js';
import {
  sanitizedInteractionStorageGuard,
  type ExperienceInteractionRouterContext,
} from './types.js';
import backupCodeVerificationRoutes from './verification-routes/backup-code-verification.js';
import enterpriseSsoVerificationRoutes from './verification-routes/enterprise-sso-verification.js';
import newPasswordIdentityVerificationRoutes from './verification-routes/new-password-identity-verification.js';
import oneTimeTokenRoutes from './verification-routes/one-time-token.js';
import passwordVerificationRoutes from './verification-routes/password-verification.js';
import socialVerificationRoutes from './verification-routes/social-verification.js';
import totpVerificationRoutes from './verification-routes/totp-verification.js';
import verificationCodeRoutes from './verification-routes/verification-code.js';
import webAuthnVerificationRoute from './verification-routes/web-authn-verification.js';

type RouterContext<T> = T extends Router<unknown, infer Context> ? Context : never;

const knownAcrValues = new Set<string>(Object.values(LogtoAcrValues));

/**
 * Resolve the step-up ACR for an interaction from the stored OIDC `acr_values` param.
 *
 * `acr_values` is space-separated per the OIDC spec; we return the highest-priority value that this
 * AS actually supports (mirroring the resolution in `oidc/init.ts` `interactions.url`). Returns
 * `undefined` when no supported ACR is present, so the caller falls through to the normal sign-in flow.
 */
const isLogtoAcrValue = (value: string): value is LogtoAcrValue => knownAcrValues.has(value);

const resolveStepUpAcr = (
  interactionDetails: Awaited<ReturnType<Provider['interactionDetails']>>
): LogtoAcrValue | undefined => {
  const rawAcrValues = interactionDetails.params.acr_values;

  if (typeof rawAcrValues !== 'string' || !rawAcrValues) {
    return undefined;
  }

  return rawAcrValues.split(' ').find((value) => isLogtoAcrValue(value));
};

export default function experienceApiRoutes<T extends AnonymousRouter>(
  ...[anonymousRouter, tenant]: RouterInitArgs<T>
) {
  const { provider, libraries } = tenant;

  const experienceRouter =
    // @ts-expect-error for good koa types
    // eslint-disable-next-line no-restricted-syntax
    (anonymousRouter as Router<unknown, ExperienceInteractionRouterContext<RouterContext<T>>>).use(
      koaInteractionDetails(provider),
      koaExperienceInteractionHooks(libraries),
      koaExperienceInteraction(tenant),
      koaExperienceAuditLog()
    );

  experienceRouter.put(
    experienceRoutes.prefix,
    koaGuard({
      body: z.object({
        interactionEvent: z.nativeEnum(InteractionEvent),
        captchaToken: z.string().optional(),
      }),
      // 422 is returned if the captcha verification fails
      status: [204, 422],
    }),
    async (ctx, next) => {
      const { interactionEvent, captchaToken } = ctx.guard.body;
      const { createLog, interactionDetails } = ctx;

      const experienceInteraction = new ExperienceInteraction(ctx, tenant, interactionEvent);

      /**
       * Step-up detection: when the OIDC authorization request carried `acr_values` (or the client's
       * `defaultAcrValues`) and the session already has an authenticated account, bootstrap this
       * interaction as a step-up flow so the experience app can skip the identifier/password step.
       *
       * Note: we resolve the ACR from the stored OIDC `acr_values` here rather than the `step_up_acr`
       * extra param. `step_up_acr` is injected by `interactions.url` into the *redirect URL* for the
       * front-end to read, but it is NOT persisted into the interaction's stored `params` — those
       * retain the original `acr_values`. Reading `step_up_acr` here would therefore never match.
       */
      if (interactionEvent === InteractionEvent.SignIn) {
        const sessionAccountId = interactionDetails.session?.accountId;
        const resolvedAcr = resolveStepUpAcr(interactionDetails);

        if (resolvedAcr && sessionAccountId) {
          experienceInteraction.initStepUp(sessionAccountId, resolvedAcr);
        }
      }

      // Log AFTER step-up detection so the audit entry reflects the actual event
      // (StepUp rather than SignIn when the interaction was promoted).
      createLog(`Interaction.${experienceInteraction.interactionEvent}.Create`);

      // Verify the captcha if provided, this is optional,
      // whether the captcha is required is determined and guarded when submitting the interaction.
      if (captchaToken) {
        await experienceInteraction.verifyCaptcha(captchaToken);
      }

      // Save new experience interaction instance.
      // This will overwrite any existing interaction data in the storage.
      await experienceInteraction.save();

      ctx.experienceInteraction = experienceInteraction;

      ctx.status = 204;

      return next();
    }
  );

  experienceRouter.put(
    `${experienceRoutes.prefix}/interaction-event`,
    koaGuard({
      body: z.object({
        interactionEvent: z.nativeEnum(InteractionEvent),
      }),
      status: [204, 400, 403],
    }),
    async (ctx, next) => {
      const { interactionEvent } = ctx.guard.body;
      const { createLog, experienceInteraction } = ctx;

      const eventLog = createLog(`Interaction.${experienceInteraction.interactionEvent}.Update`);
      eventLog.append({
        interactionEvent,
      });

      await experienceInteraction.setInteractionEvent(interactionEvent);

      await experienceInteraction.save();

      ctx.status = 204;

      return next();
    }
  );

  experienceRouter.post(
    experienceRoutes.identification,
    koaGuard({
      body: identificationApiPayloadGuard,
      status: [201, 204, 400, 401, 403, 404, 409, 422],
    }),
    async (ctx, next) => {
      const { verificationId, linkSocialIdentity } = ctx.guard.body;
      const { experienceInteraction, createLog } = ctx;

      const log = createLog(
        `Interaction.${experienceInteraction.interactionEvent}.Identifier.Submit`
      );

      log.append({
        payload: {
          verificationId,
          linkSocialIdentity,
        },
      });

      if (experienceInteraction.interactionEvent === InteractionEvent.Register) {
        await experienceInteraction.createUser(verificationId, log);
      } else {
        assertThat(
          verificationId,
          new RequestError({
            code: 'guard.invalid_input',
            status: 400,
            details: 'verificationId is missing',
          })
        );
        await experienceInteraction.identifyUser(verificationId, linkSocialIdentity, log);
      }

      await experienceInteraction.save();

      // Return 201 if a new user is created
      ctx.status = experienceInteraction.interactionEvent === InteractionEvent.Register ? 201 : 204;

      return next();
    }
  );

  experienceRouter.post(
    `${experienceRoutes.prefix}/submit`,
    koaGuard({
      status: [200, 400, 403, 404, 422],
      response: z
        .object({
          redirectTo: z.string(),
        })
        .optional(),
    }),
    async (ctx, next) => {
      const { createLog, experienceInteraction } = ctx;

      const log = createLog(`Interaction.${experienceInteraction.interactionEvent}.Submit`);

      await ctx.experienceInteraction.submit(log);

      log.append({
        interaction: ctx.experienceInteraction.toJson(),
        userId: ctx.experienceInteraction.identifiedUserId,
      });

      ctx.status = 200;
      return next();
    }
  );

  experienceRouter.get(
    `${experienceRoutes.interaction}`,
    koaGuard({
      status: [200],
      response: sanitizedInteractionStorageGuard,
    }),
    async (ctx, next) => {
      const { experienceInteraction } = ctx;

      ctx.body = experienceInteraction.toSanitizedJson();
      ctx.status = 200;
      return next();
    }
  );

  passwordVerificationRoutes(experienceRouter, tenant);
  verificationCodeRoutes(experienceRouter, tenant);
  socialVerificationRoutes(experienceRouter, tenant);
  enterpriseSsoVerificationRoutes(experienceRouter, tenant);
  totpVerificationRoutes(experienceRouter, tenant);
  webAuthnVerificationRoute(experienceRouter, tenant);
  backupCodeVerificationRoutes(experienceRouter, tenant);
  newPasswordIdentityVerificationRoutes(experienceRouter, tenant);
  oneTimeTokenRoutes(experienceRouter, tenant);

  profileRoutes(experienceRouter, tenant);
  experienceAnonymousRoutes(experienceRouter, tenant);
}
