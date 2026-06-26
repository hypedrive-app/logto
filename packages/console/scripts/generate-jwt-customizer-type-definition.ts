import fs from 'node:fs';

import {
  accessTokenPayloadGuard,
  clientCredentialsPayloadGuard,
  jwtCustomizerApplicationContextGuard,
  jwtCustomizerGrantContextGuard,
  jwtCustomizerOrganizationContextGuard,
  jwtCustomizerUserContextGuard,
  jwtCustomizerUserInteractionContextGuard,
} from '@logto/schemas';
import prettier from 'prettier';
import { type ZodTypeAny } from 'zod';
import { createAuxiliaryTypeStore, printNode, zodToTs } from 'zod-to-ts';

import { jwtCustomizerApiContextTypeDefinition } from './custom-jwt-customizer-type-definition.js';

const filePath = 'src/consts/jwt-customizer-type-definition.ts';

const typeIdentifiers = `export enum JwtCustomizerTypeDefinitionKey {
  JwtCustomizerUserContext = 'JwtCustomizerUserContext',
  JwtCustomizerGrantContext = 'JwtCustomizerGrantContext',
  JwtCustomizerUserInteractionContext = 'JwtCustomizerUserInteractionContext',
  JwtCustomizerApplicationContext = 'JwtCustomizerApplicationContext',
  JwtCustomizerOrganizationContext = 'JwtCustomizerOrganizationContext',
  AccessTokenPayload = 'AccessTokenPayload',
  ClientCredentialsPayload = 'ClientCredentialsPayload',
  EnvironmentVariables = 'EnvironmentVariables',
  CustomJwtApiContext = 'CustomJwtApiContext',
};`;

const inferTsDefinitionFromZod = (zodSchema: ZodTypeAny, identifier: string): string => {
  /**
   * We have z.lazy() used for defining Json objects in the zod schemas (@see https://zod.dev/?id=json-type).
   * As of zod-to-ts v2 recursive `z.lazy()` schemas are resolved via an `auxiliaryTypeStore` rather
   * than a root-type-Listener string. We don't emit the auxiliary declarations themselves, so the
   * recursive Json references collapse to their referenced identifier — equivalent to the previous
   * `Record<string, unknown>` fallback for our purposes.
   * @see https://github.com/sachinraja/zod-to-ts#usage
   */
  const auxiliaryTypeStore = createAuxiliaryTypeStore();
  const { node } = zodToTs(zodSchema, { auxiliaryTypeStore });
  const typeDefinition = printNode(node);

  return `type ${identifier} = ${typeDefinition};`;
};

/**
 * EnterpriseSsoUserInfo zod guard uses `catchall(jsonGuard)` to extend the type to allow any additional properties.
 * However, the `catchall()` schema is not recognized by zod-to-ts,
 * so it will not generate the index signature for the type.
 * To fix this, we manually add the index signature to the type definition.
 *
 * Map the `enterpriseSsoUserInfo?: { ... } | undefined;` to
 * `enterpriseSsoUserInfo?: { ...; [k: string]?: unknown; } | undefined;`
 */
const addIndexSignatureToEnterpriseSsoUserInfo = (source: string) => {
  // 1. Capture in segments: prefix = "enterpriseSsoUserInfo?: {"
  //    body   = {...original properties...}
  //    suffix = "} | undefined;" (may include a semicolon/space)
  const blockReg = /(\benterpriseSsoUserInfo\?\s*:\s*{)([\S\s]*?)(}\s*\|\s*undefined\s*;?)/g;

  return source.replaceAll(blockReg, (full, prefix: string, body: string, suffix: string) => {
    // 2. Add the fallback index signature to the body
    const indent = '    ';
    const addition = `${indent}[k: string]?: unknown;\n`;

    return `${prefix}${body}${addition}${suffix}`;
  });
};

// Create the jwt-customizer-type-definition.ts file
const createJwtCustomizerTypeDefinitions = async () => {
  const jwtCustomizerUserContextTypeDefinition = inferTsDefinitionFromZod(
    jwtCustomizerUserContextGuard,
    'JwtCustomizerUserContext'
  );

  const jwtCustomizerGrantContextTypeDefinition = inferTsDefinitionFromZod(
    jwtCustomizerGrantContextGuard,
    'JwtCustomizerGrantContext'
  );

  const jwtCustomizerUserInteractionContextTypeDefinition =
    addIndexSignatureToEnterpriseSsoUserInfo(
      inferTsDefinitionFromZod(
        jwtCustomizerUserInteractionContextGuard,
        'JwtCustomizerUserInteractionContext'
      )
    );

  const jwtCustomizerApplicationContextTypeDefinition = inferTsDefinitionFromZod(
    jwtCustomizerApplicationContextGuard,
    'JwtCustomizerApplicationContext'
  );

  const jwtCustomizerOrganizationContextTypeDefinition = inferTsDefinitionFromZod(
    jwtCustomizerOrganizationContextGuard,
    'JwtCustomizerOrganizationContext'
  );

  const accessTokenPayloadTypeDefinition = inferTsDefinitionFromZod(
    accessTokenPayloadGuard,
    'AccessTokenPayload'
  );

  const clientCredentialsPayloadTypeDefinition = inferTsDefinitionFromZod(
    clientCredentialsPayloadGuard,
    'ClientCredentialsPayload'
  );

  const fileContent = `/* This file is auto-generated. Do not modify it manually. */
${typeIdentifiers}

export const jwtCustomizerUserContextTypeDefinition = \`${jwtCustomizerUserContextTypeDefinition}\`;

export const jwtCustomizerGrantContextTypeDefinition = \`${jwtCustomizerGrantContextTypeDefinition}\`;

export const jwtCustomizerUserInteractionContextTypeDefinition = \`${jwtCustomizerUserInteractionContextTypeDefinition}\`;

export const jwtCustomizerApplicationContextTypeDefinition = \`${jwtCustomizerApplicationContextTypeDefinition}\`;

export const jwtCustomizerOrganizationContextTypeDefinition = \`${jwtCustomizerOrganizationContextTypeDefinition}\`;

export const accessTokenPayloadTypeDefinition = \`${accessTokenPayloadTypeDefinition}\`;

export const clientCredentialsPayloadTypeDefinition = \`${clientCredentialsPayloadTypeDefinition}\`;

export const jwtCustomizerApiContextTypeDefinition = \`${jwtCustomizerApiContextTypeDefinition}\`;
`;

  const formattedFileContent = await prettier.format(fileContent, {
    parser: 'typescript',
    tabWidth: 2,
    singleQuote: true,
  });

  fs.writeFileSync(filePath, formattedFileContent);
};

void createJwtCustomizerTypeDefinitions();
