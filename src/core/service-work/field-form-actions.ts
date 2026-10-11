"use server";
import { z } from "zod";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { withFieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { ticketFieldFormManifestInTransaction, ticketFieldFormRequestSchema } from "./field-forms";
import type { TicketFieldReferenceChoice } from "./field-form-contract";

const searchRequest = z.strictObject({ form: ticketFieldFormRequestSchema, definitionId: z.uuid(), search: z.string().max(100) });
const resultSchema = z.object({ records: z.array(z.object({ id: z.string().min(1).max(100),
  fields: z.object({ number: z.string().max(100), subject: z.string().max(250) }) })).max(50) });

/** One owner-approved reference picker. Client cannot select tenant, entity,
 * query, capabilities or arbitrary data models. Choices never grant write rights. */
export async function searchTicketFieldReferences(input: unknown): Promise<TicketFieldReferenceChoice[]> {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  const request = searchRequest.parse(input);
  return withFieldRuntimeAuthority(session, async authority => {
    const manifest = await ticketFieldFormManifestInTransaction(authority, request.form);
    const field = manifest?.fields.find(field => field.definitionId === request.definitionId.toLowerCase());
    if (!field || field.storage.type !== "reference" || field.storage.entity.id !== "tickets.ticket")
      throw new Error("FIELD_UNAVAILABLE: this reference selector is unavailable.");
    // Actual registered list query keeps its native/private access policy and
    // pagination bound. Save independently reauthorises the chosen record.
    const query = authority.registry.describe("tickets.ticket.list", 1);
    const result = resultSchema.parse(await authority.registry.invoke(authority.session, query, { search: request.search.trim(), limit: 25 }));
    return result.records.map(record => ({ id: record.id, label: `${record.fields.number} · ${record.fields.subject}` }));
  });
}
