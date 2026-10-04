import { db } from "@/core/db/client";

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

export async function nextOrderNumber(tx: Tx, organisationId: string) {
  const row = await tx.manufacturingCounter.upsert({
    where: { organisationId_kind: { organisationId, kind: "MO" } },
    create: { organisationId, kind: "MO", value: 1 },
    update: { value: { increment: 1 } },
  });
  return `MO-${String(row.value).padStart(4, "0")}`;
}
