import { z } from "zod";
import { fieldStorageSchema } from "@/core/studio/fields/schema";
import { fieldSearchRequestSchema } from "@/core/studio/fields/search-contract";

/** Presentation metadata only. No write policy, defaults or condition inputs. */
export const ticketSearchFieldSchema = z.strictObject({ definitionId: z.uuid(), definitionRevision: z.number().int().nonnegative().max(2147483646),
  versionId: z.uuid(), generationId: z.uuid(), label: z.string().min(1).max(100), help: z.string().max(500), storage: fieldStorageSchema });
export type TicketSearchField = z.infer<typeof ticketSearchFieldSchema>;
export const ticketSearchFieldsSchema = z.array(ticketSearchFieldSchema).max(100);
export const ticketFieldSearchRequestSchema = fieldSearchRequestSchema;
export const ticketSearchReferenceRequestSchema = ticketSearchFieldSchema.pick({ definitionId: true, definitionRevision: true, versionId: true, generationId: true })
  .extend({ search: z.string().max(100) });
const nativeId = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/);
export const ticketFieldSearchResultSchema = z.strictObject({ records: z.array(z.strictObject({ id: nativeId, revision: z.number().int().positive(),
  href: z.string().regex(/^\/tickets\/[a-zA-Z0-9_-]+$/), fields: z.strictObject({ number: z.string(), subject: z.string(), status: z.string(), type: z.string(),
    priority: z.string(), created_at: z.iso.datetime(), updated_at: z.iso.datetime() }) })).max(50),
  next: z.strictObject({ after: nativeId, checksum: z.string().regex(/^[a-f0-9]{64}$/) }).nullable() });
export type TicketFieldSearchResult = z.infer<typeof ticketFieldSearchResultSchema>;
