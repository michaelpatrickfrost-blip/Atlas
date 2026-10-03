import { db } from "@/core/db/client";

export function listPipelines(organisationId: string) {
  return db.pipeline.findMany({
    where: { organisationId },
    include: { stages: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getDefaultPipeline(organisationId: string) {
  const pipeline = await db.pipeline.findFirst({
    where: { organisationId, isDefault: true },
    include: { stages: { orderBy: { order: "asc" } } },
  });
  if (pipeline) return pipeline;
  return db.pipeline.findFirst({
    where: { organisationId },
    include: { stages: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

export function listLossReasons(organisationId: string) {
  return db.lossReason.findMany({ where: { organisationId }, orderBy: { label: "asc" } });
}
