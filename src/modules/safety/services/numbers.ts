import { db } from "@/core/db/client";

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

export async function nextSafetyReference(tx: Tx, organisationId: string, kind: string, prefix: string) {
  const row = await tx.safetyCounter.upsert({
    where: { organisationId_kind: { organisationId, kind } },
    create: { organisationId, kind, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${prefix}-${String(row.value).padStart(4, "0")}`;
}
