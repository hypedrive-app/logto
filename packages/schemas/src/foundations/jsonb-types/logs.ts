import { type PasswordPolicy } from '@logto/core-kit';
import { type DeepPartial } from '@silverhand/essentials';
import { z } from 'zod';

export enum LogResult {
  Success = 'Success',
  Error = 'Error',
}

// UAParser.js returns partial results, so all fields are optional
// Ref: https://docs.uaparser.dev/api/main/overview.html#methods
const uaParserBrowserGuard = z
  .object({
    name: z.string(),
    version: z.string(),
    major: z.string(),
    type: z.string(),
  })
  .partial()
  .catchall(z.unknown());

const uaParserDeviceGuard = z
  .object({
    model: z.string(),
    type: z.string(),
    vendor: z.string(),
  })
  .partial()
  .catchall(z.unknown());

const uaParserEngineGuard = z
  .object({
    name: z.string(),
    version: z.string(),
  })
  .partial()
  .catchall(z.unknown());

const uaParserOsGuard = z
  .object({
    name: z.string(),
    version: z.string(),
  })
  .partial()
  .catchall(z.unknown());

const uaParserCpuGuard = z
  .object({
    architecture: z.string(),
  })
  .partial()
  .catchall(z.unknown());

export const userAgentParsedGuard = z
  .object({
    ua: z.string(),
    browser: uaParserBrowserGuard,
    device: uaParserDeviceGuard,
    engine: uaParserEngineGuard,
    os: uaParserOsGuard,
    cpu: uaParserCpuGuard,
  })
  .partial()
  .catchall(z.unknown());

export const logContextPayloadGuard = z
  .object({
    key: z.string(),
    result: z.nativeEnum(LogResult),
    error: z.record(z.string(), z.unknown()).or(z.string()).optional(),
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    userAgentParsed: userAgentParsedGuard.optional(),
    userId: z.string().optional(),
    applicationId: z.string().optional(),
    sessionId: z.string().optional(),
    params: z.record(z.string(), z.unknown()).optional(),
  })
  .catchall(z.unknown());

export type PartialPasswordPolicy = DeepPartial<PasswordPolicy>;

// Zod 4 removed `.deepPartial()`, and a shallow `.partial()` is wrong here: the nested objects in
// `passwordPolicyGuard` use `.prefault({})`, so a stored `{}` would be back-filled with the full
// default policy instead of staying empty. Mirror the guard's shape with every field deeply optional
// and no defaults so a partial stored value round-trips unchanged.
export const partialPasswordPolicyGuard = z
  .object({
    length: z.object({ min: z.number().int().min(1), max: z.number().int().min(1) }).partial(),
    characterTypes: z.object({ min: z.number().int().min(1).max(4) }).partial(),
    rejects: z
      .object({
        pwned: z.boolean(),
        repetitionAndSequence: z.boolean(),
        userInfo: z.boolean(),
        words: z.string().array(),
      })
      .partial(),
  })
  .partial() satisfies z.ZodType<PartialPasswordPolicy>;

/**
 * The basic log context type. It's more about a type hint instead of forcing the log shape.
 *
 * Note when setting up a log function, the type of log key in function arguments should be `LogKey`.
 * Here we use `string` to make it compatible with the Zod guard.
 **/
export type LogContextPayload = z.infer<typeof logContextPayloadGuard>;
