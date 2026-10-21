import { z } from "zod";
import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import { pagePayloadSchema } from "../pages/schema";
import { compileStructuredPage } from "../pages/definition-compiler";
import { pageSourcePolicySchema } from "../pages/owner-contract";

/** Choose an actual permitted sample through the same owner list gateway. The
 * browser receives a bounded display choice, never a raw owning record.
 */
export async function pagePreviewChoicesInTransaction(authority: FieldRuntimeAuthority, input: unknown) {
  const page = pagePayloadSchema.parse(input), compiled = await compileStructuredPage(authority, page);
  const source = authority.registry.describePageSource(compiled.plan.approvals.sourcePage), policy = pageSourcePolicySchema.parse(source.metadata.details.pageSource);
  const list = policy.queries.find(query => query.scope === "list" && query.purpose === "list");
  if (!list) return [];
  const { output } = await authority.registry.invokePageRead({ session: authority.session, transaction: authority.transaction },
    compiled.plan.approvals.sourcePage, { kind: "list" }, { query: list.query, pageSize: 20, cursor: null });
  const names = ["reference", "number", "subject", "customer_name"];
  return output.rows.map(row => ({ id: row.id, label: names.flatMap(name => {
    const value = row.values[name]; return typeof value === "string" && value ? [value] : [];
  }).slice(0, 3).join(" · ") || "Business record" }));
}

export const visualScreenIdentitySchema = z.strictObject({ definitionId: z.uuid(), revision: z.number().int().nonnegative() });
