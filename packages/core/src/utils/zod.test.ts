import { languages, languageTagGuard } from '@logto/language-kit';
import {
  ApplicationType,
  jsonObjectGuard,
  translationGuard,
  customContentGuard,
} from '@logto/schemas';
import {
  string,
  boolean,
  number,
  object,
  nativeEnum,
  unknown,
  literal,
  union,
  preprocess,
} from 'zod';

import RequestError from '#src/errors/RequestError/index.js';

import { zodTypeToSwagger } from './zod.js';

/**
 * Note: `zodTypeToSwagger` is built on Zod 4's native `z.toJSONSchema` (target `openapi-3.0`).
 * Compared to the previous hand-rolled converter, the output is more standards-correct:
 * - string formats also emit a `pattern` (e.g. `email`, `uuid`), and `url` maps to the
 *   OpenAPI-standard `uri` format;
 * - literals use `enum: [value]` instead of a non-standard `format` string;
 * - unions use `anyOf` instead of `oneOf`;
 * - only non-Zod input throws (representable-as-`any` nodes no longer error).
 */
describe('zodTypeToSwagger', () => {
  it('arbitrary object guard', () => {
    expect(zodTypeToSwagger(jsonObjectGuard)).toEqual({
      type: 'object',
      description: 'arbitrary',
      additionalProperties: true,
    });
  });

  it('translation object guard', () => {
    expect(zodTypeToSwagger(translationGuard)).toEqual({
      $ref: '#/components/schemas/TranslationObject',
    });
  });

  it('language tag guard', () => {
    expect(zodTypeToSwagger(languageTagGuard)).toEqual({
      type: 'string',
      enum: Object.keys(languages),
    });
  });

  describe('string type', () => {
    const notStartingWithDigitRegex = /^\D/;

    it('min check', () => {
      expect(zodTypeToSwagger(string().min(1))).toEqual({
        type: 'string',
        minLength: 1,
      });
    });

    it('max check', () => {
      expect(zodTypeToSwagger(string().max(6))).toEqual({
        type: 'string',
        maxLength: 6,
      });
    });

    it('regex check', () => {
      expect(zodTypeToSwagger(string().regex(notStartingWithDigitRegex))).toEqual({
        type: 'string',
        pattern: notStartingWithDigitRegex.source,
      });
    });

    it('format checks', () => {
      expect(zodTypeToSwagger(string().email())).toMatchObject({
        type: 'string',
        format: 'email',
      });
      // `url` maps to the OpenAPI-standard `uri` format.
      expect(zodTypeToSwagger(string().url())).toMatchObject({
        type: 'string',
        format: 'uri',
      });
      expect(zodTypeToSwagger(string().uuid())).toMatchObject({
        type: 'string',
        format: 'uuid',
      });
    });

    it('length constraints combine with formats', () => {
      expect(zodTypeToSwagger(string().min(1).max(128).email())).toMatchObject({
        type: 'string',
        minLength: 1,
        maxLength: 128,
        format: 'email',
      });
    });
  });

  it('boolean type', () => {
    expect(zodTypeToSwagger(boolean())).toEqual({ type: 'boolean' });
  });

  it('number type', () => {
    expect(zodTypeToSwagger(number())).toEqual({ type: 'number' });
  });

  it('array type', () => {
    expect(zodTypeToSwagger(string().array())).toEqual({
      type: 'array',
      items: {
        type: 'string',
      },
    });
  });

  it('object type', () => {
    expect(zodTypeToSwagger(object({ x: string(), y: number().optional() }))).toEqual({
      type: 'object',
      properties: {
        x: {
          type: 'string',
        },
        y: {
          type: 'number',
        },
      },
      required: ['x'],
    });
  });

  it('optional type', () => {
    expect(zodTypeToSwagger(string().optional())).toEqual({ type: 'string' });
  });

  it('preprocess type', () => {
    expect(zodTypeToSwagger(preprocess(String, string()))).toEqual({ type: 'string' });
  });

  it('refinement type unwraps to the base schema', () => {
    expect(zodTypeToSwagger(string().refine(() => true))).toEqual({ type: 'string' });
  });

  it('nullable type', () => {
    expect(zodTypeToSwagger(string().nullable())).toEqual({ type: 'string', nullable: true });
  });

  describe('literal type', () => {
    it('boolean', () => {
      expect(zodTypeToSwagger(literal(true))).toEqual({
        type: 'boolean',
        enum: [true],
      });
      expect(zodTypeToSwagger(literal(false))).toEqual({
        type: 'boolean',
        enum: [false],
      });
    });

    it('number', () => {
      expect(zodTypeToSwagger(literal(-1.25))).toEqual({
        type: 'number',
        enum: [-1.25],
      });
      expect(zodTypeToSwagger(literal(999))).toEqual({
        type: 'number',
        enum: [999],
      });
    });

    it('string', () => {
      expect(zodTypeToSwagger(literal(''))).toEqual({
        type: 'string',
        enum: [''],
      });
      expect(zodTypeToSwagger(literal('nonempty'))).toEqual({
        type: 'string',
        enum: ['nonempty'],
      });
    });
  });

  it('unknown type', () => {
    expect(zodTypeToSwagger(unknown())).toEqual({});
  });

  it('union type', () => {
    expect(zodTypeToSwagger(number().or(boolean()))).toEqual({
      anyOf: [{ type: 'number' }, { type: 'boolean' }],
    });
    expect(zodTypeToSwagger(union([literal('Logto'), literal(true)]))).toEqual({
      anyOf: [
        { type: 'string', enum: ['Logto'] },
        { type: 'boolean', enum: [true] },
      ],
    });
  });

  it('native enum type', () => {
    expect(zodTypeToSwagger(nativeEnum(ApplicationType))).toEqual({
      type: 'string',
      enum: Object.values(ApplicationType),
    });
  });

  it('unexpected (non-Zod) type', () => {
    expect(() => zodTypeToSwagger('test')).toMatchError(
      new RequestError('swagger.invalid_zod_type', 'test')
    );
  });

  it('record type', () => {
    expect(zodTypeToSwagger(customContentGuard)).toEqual({
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
    });
  });
});
