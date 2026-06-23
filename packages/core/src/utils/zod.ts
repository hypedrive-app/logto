import { languages, languageTagGuard } from '@logto/language-kit';
import { jsonGuard, jsonObjectGuard, translationGuard } from '@logto/schemas';
import type { OpenAPIV3 } from 'openapi-types';
import { z } from 'zod';

import RequestError from '#src/errors/RequestError/index.js';

export const translationSchemas: Record<string, OpenAPIV3.SchemaObject> = {
  TranslationObject: {
    type: 'object',
    properties: {
      '[translationKey]': {
        $ref: '#/components/schemas/Translation',
      },
    },
    example: {
      input: {
        username: 'Username',
        password: 'Password',
      },
      action: {
        sign_in: 'Sign In',
        continue: 'Continue',
      },
    },
  },
  Translation: {
    oneOf: [
      {
        type: 'string',
      },
      // {
      //   // This self-reference is OK, but it's not supported by Swagger UI
      //   // See https://github.com/swagger-api/swagger-ui/issues/3325
      //   $ref: '#/components/schemas/TranslationObject',
      // },
    ],
  },
};

/**
 * A few guards are referenced as named components or need bespoke OpenAPI output that the
 * generic conversion can't infer (recursive JSON, translation `$ref`, language enum). They are
 * matched by identity during conversion and replaced with the hand-authored schema below.
 */
const overrideSchema = (jsonSchema: Record<string, unknown>, replacement: OpenAPIV3.SchemaObject) => {
  for (const key of Object.keys(jsonSchema)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete, @silverhand/fp/no-delete
    delete jsonSchema[key];
  }
  Object.assign(jsonSchema, replacement);
};

const arbitraryJsonObject: OpenAPIV3.SchemaObject = {
  type: 'object',
  description: 'arbitrary',
  additionalProperties: true,
};

const arbitraryJson: OpenAPIV3.SchemaObject = {
  type: 'object',
  oneOf: [
    {
      type: 'object',
      description: 'arbitrary JSON object',
      additionalProperties: true,
    },
    {
      type: 'array',
      items: {
        oneOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'boolean' },
          {
            type: 'string',
            nullable: true,
            description: 'null value',
          },
          {
            type: 'object',
            description: 'arbitrary JSON object',
            additionalProperties: true,
          },
        ],
      },
    },
    { type: 'string' },
    { type: 'number' },
    { type: 'boolean' },
  ],
  nullable: true,
};

/**
 * Convert a Zod guard into an OpenAPI (Swagger) schema object.
 *
 * Built on Zod 4's native `z.toJSONSchema` with the `openapi-3.0` target, which is the
 * idiomatic, forward-compatible way to introspect schemas (the previous hand-rolled converter
 * relied on private Zod internals that were reworked in Zod 4). The `override` hook patches in
 * the few guards that need bespoke output. `unrepresentable: 'any'` keeps refinements/transforms
 * from throwing (they were previously rendered as an "arbitrary object").
 */
export const zodTypeToSwagger = (
  config: unknown
): OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject => {
  if (!(config instanceof z.ZodType)) {
    throw new RequestError('swagger.invalid_zod_type', config);
  }

  // eslint-disable-next-line no-restricted-syntax
  const schema = z.toJSONSchema(config, {
    target: 'openapi-3.0',
    io: 'input',
    // Render unrepresentable nodes (e.g. refinement-only schemas) as a permissive object
    // instead of throwing, matching the previous converter's fallback behavior.
    unrepresentable: 'any',
    override({ zodSchema, jsonSchema }) {
      // `zodSchema` is typed as Zod's internal `$ZodTypes`; compare by reference identity.
      const schema: unknown = zodSchema;

      if (schema === jsonObjectGuard) {
        overrideSchema(jsonSchema, arbitraryJsonObject);
        return;
      }

      if (schema === jsonGuard) {
        overrideSchema(jsonSchema, arbitraryJson);
        return;
      }

      if (schema === translationGuard) {
        overrideSchema(jsonSchema, {
          $ref: '#/components/schemas/TranslationObject',
        } as OpenAPIV3.SchemaObject);
        return;
      }

      if (schema === languageTagGuard) {
        overrideSchema(jsonSchema, { type: 'string', enum: Object.keys(languages) });
      }
    },
  });

  // Recursive guards (e.g. `jsonGuard`) make Zod hoist a shared node to a root `definitions`/
  // `$defs` bucket. The bespoke overrides above already inline those shapes, so drop the now-unused
  // root buckets to keep each schema self-contained (matching the previous converter's output).
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete, @silverhand/fp/no-delete
  delete (schema as Record<string, unknown>).definitions;
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete, @silverhand/fp/no-delete
  delete (schema as Record<string, unknown>).$defs;

  return schema as OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
};
