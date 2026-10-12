import type { PrismaClient } from "@/generated/prisma/client";
import { studioRuntimeFeaturesForCompiledDefinition, type StudioRuntimeFeature } from "../runtime-features";

/** Metadata only, including immutable retained versions: history readers also
 * need their payload schemas. No native records, extension values or receipts are
 * projected. Suspended synthetic Test tenants follow existing release policy. */
export async function scanStudioRuntimeFeatureCompatibility(client: PrismaClient, supported: readonly StudioRuntimeFeature[]): Promise<string[]> {
  const issues: string[] = [];
  let cursor: string | undefined;
  while (true) {
    const rows = await client.studioDefinitionVersion.findMany({
      select: { id: true, definitionId: true, payload: true, compiledPlan: true,
        definition: { select: { kind: true, organisation: { select: { isTest: true, status: true } } } } },
      orderBy: { id: "asc" }, take: 200, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    if (!rows.length) break;
    for (const row of rows) {
      const company = row.definition.organisation;
      if (company.isTest && company.status === "SUSPENDED") continue;
      for (const feature of studioRuntimeFeaturesForCompiledDefinition(row.definition.kind, row.payload, row.compiledPlan))
        if (!supported.includes(feature)) issues.push(`${row.definitionId}@${row.id}: unsupported Studio metadata feature ${feature}`);
    }
    cursor = rows[rows.length - 1].id;
  }
  return issues;
}
