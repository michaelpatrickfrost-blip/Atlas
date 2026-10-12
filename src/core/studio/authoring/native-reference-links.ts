import { z } from 'zod';
import { referenceSchema } from '../compiler/reference';
import { pageNodeIdSchema } from '../pages/schema';
import type { ReferenceNavigationContext } from './reference-links';

export const nativeDesignReferenceSchema = z.strictObject({
  sourcePage: referenceSchema, reference: referenceSchema,
  focus: z.discriminatedUnion('kind', [
    z.strictObject({ kind: z.literal('field'), id: pageNodeIdSchema }),
    z.strictObject({ kind: z.literal('fact'), id: pageNodeIdSchema }),
  ]).optional(),
});
export const nativeDesignReferenceCursorSchema = z.strictObject({
  after: z.uuid().transform(value => value.toLowerCase()), checksum: z.string().regex(/^[a-f0-9]{64}$/),
});
export const nativeDesignReferenceRequestSchema = nativeDesignReferenceSchema.extend({ cursor: nativeDesignReferenceCursorSchema.optional() });
export type NativeDesignReference = z.infer<typeof nativeDesignReferenceSchema>;

/** Browser-safe identity links only. Exact hashes/owner approval/current grants
 * are checked again by the server; these URLs are never an authority or query. */
export function nativeDesignReferenceLinks(input: unknown, context: ReferenceNavigationContext = {}) {
  const value = nativeDesignReferenceSchema.parse(input);
  const query = new URLSearchParams({ source: value.sourcePage.id, sourceVersion: String(value.sourcePage.version),
    sourceSchemaHash: value.sourcePage.schemaHash, sourceContractHash: value.sourcePage.contractHash,
    version: String(value.reference.version), schemaHash: value.reference.schemaHash, contractHash: value.reference.contractHash });
  if (value.focus) { query.set('focus', value.focus.kind); query.set('detail', value.focus.id); }
  if (context.business !== undefined) query.set('business', z.string().min(1).max(100).parse(context.business));
  const sourceHref = `/design-studio/capabilities/${encodeURIComponent(value.reference.id)}?${query}`;
  query.set('view', 'usage');
  return { sourceHref, whereUsedHref: `/design-studio/capabilities/${encodeURIComponent(value.reference.id)}?${query}` };
}

const searchSchema = z.strictObject({ source: referenceSchema.shape.id, sourceVersion: z.coerce.number().int().positive(),
  sourceSchemaHash: referenceSchema.shape.schemaHash, sourceContractHash: referenceSchema.shape.contractHash,
  version: z.coerce.number().int().positive(), schemaHash: referenceSchema.shape.schemaHash, contractHash: referenceSchema.shape.contractHash,
  focus: z.enum(['field', 'fact']).optional(), detail: pageNodeIdSchema.optional(),
  view: z.literal('usage').optional(), business: z.string().min(1).max(100).optional(),
  after: nativeDesignReferenceCursorSchema.shape.after.optional(), cursorChecksum: nativeDesignReferenceCursorSchema.shape.checksum.optional(),
}).refine(value => (value.focus === undefined) === (value.detail === undefined), 'Choose a complete approved detail.')
  .refine(value => (value.after === undefined) === (value.cursorChecksum === undefined), 'Choose a complete continuation.')
  .refine(value => value.after === undefined || value.view === 'usage', 'Continuation is only for usage.');

export function parseNativeDesignReferenceLocation(contractId: unknown, input: unknown) {
  const value = searchSchema.parse(input);
  return { business: value.business, usage: value.view === 'usage', request: nativeDesignReferenceRequestSchema.parse({
    sourcePage: { id: value.source, version: value.sourceVersion, schemaHash: value.sourceSchemaHash, contractHash: value.sourceContractHash },
    reference: { id: contractId, version: value.version, schemaHash: value.schemaHash, contractHash: value.contractHash },
    ...(value.focus ? { focus: { kind: value.focus, id: value.detail } } : {}),
    ...(value.after ? { cursor: { after: value.after, checksum: value.cursorChecksum } } : {}),
  }) };
}
