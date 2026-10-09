import type { PrismaClient } from "@/generated/prisma/client";
import type { CapabilityRegistry } from "./registry";
/** Bounded metadata-only scan. Retired Test companies retain history, not release dependencies. */
export async function scanActiveStudioDependencies(client: PrismaClient, registry: CapabilityRegistry): Promise<string[]> {
  const issues: string[] = [];
  let cursor: string | undefined;
  while (true) {
    const rows = await client.studioDependency.findMany({
      where: { version: { activeFor: { some: { retiredAt: null } } } },
      select: {
        id: true, definitionId: true, contractId: true, contractVersion: true,
        schemaHash: true, contractHash: true,
        version: { select: { definition: { select: { organisation: { select: { isTest: true, status: true } } } } } },
      },
      orderBy: { id: "asc" }, take: 200,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    if (!rows.length) break;
    for (const row of rows) {
      const company = row.version.definition.organisation;
      // Acceptance cleanup suspends Test companies and keeps immutable metadata.
      // Real companies (including suspended ones), active Tests and unknown statuses
      // remain checked. Resuming a Test makes its dependencies required again.
      if (company.isTest && company.status === "SUSPENDED") continue;
      const failures = registry.checkCompatibility([{ id: row.contractId, version: row.contractVersion, schemaHash: row.schemaHash, contractHash: row.contractHash }]);
      issues.push(...failures.map(error => `${row.definitionId}: ${error}`));
      if (!failures.length) {
        const m = registry.describe(row.contractId,row.contractVersion);
        if (m.lifecycle === "deprecated" && Date.parse(m.supportedUntil!) <= Date.now()) issues.push(`${row.definitionId}: expired contract ${row.contractId}`);
      }
    }
    cursor = rows[rows.length-1].id;
  }
  return issues;
}
