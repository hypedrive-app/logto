import { z } from 'zod';
import { jsonGuard, jsonObjectGuard, translationGuard } from '@logto/schemas';
import { languageTagGuard } from '@logto/language-kit';
import { zodTypeToSwagger } from './src/utils/zod.js';

const cases: Array<[string, unknown]> = [
  ['string.email', z.string().email()],
  ['string.min.max', z.string().min(2).max(8)],
  ['string.regex', z.string().regex(/^a.c$/)],
  ['optional-obj', z.object({ a: z.string().optional(), b: z.number() })],
  ['record', z.record(z.string(), z.unknown())],
  ['enum', z.enum(['x', 'y'])],
  ['default', z.string().default('d')],
  ['jsonObjectGuard', jsonObjectGuard],
  ['jsonGuard', jsonGuard],
  ['translationGuard', translationGuard],
  ['languageTagGuard', languageTagGuard],
];
for (const [name, guard] of cases) {
  try { console.log(name, '=>', JSON.stringify(zodTypeToSwagger(guard))); }
  catch (e) { console.log(name, '=> ERROR', (e as Error).message); }
}
