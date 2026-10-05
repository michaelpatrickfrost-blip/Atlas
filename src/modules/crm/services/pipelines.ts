import { db } from "@/core/db/client";

export function listPipelines(organisationId: string) {
  return db.pipeline.findMany({
    where: { organisationId },
    include: { stages: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "asc" },
  });
}

const STANDARD_STAGES = [
  { key: "qualified", name: "Qualified", order: 0, defaultProbability: 10, typicalDurationDays: 5 },
  { key: "discovery", name: "Discovery", order: 1, defaultProbability: 25, typicalDurationDays: 7 },
  { key: "proposal", name: "Proposal", order: 2, defaultProbability: 50, typicalDurationDays: 7 },
  { key: "negotiation", name: "Negotiation", order: 3, defaultProbability: 75, typicalDurationDays: 10 },
  { key: "commit", name: "Commit", order: 4, defaultProbability: 90, typicalDurationDays: 5 },
];
const STANDARD_LOSS_REASONS = [["price", "Price"], ["competitor", "Competitor"], ["no_decision", "No decision"], ["timing", "Timing"], ["product_fit", "Product fit"]];

/** The company's default pipeline. A company that has none yet gets the standard one, so CRM never
 * dead-ends on "no pipeline": prospects can always be converted and deals always have stages. */
export async function getDefaultPipeline(organisationId: string) {
  const include = { stages: { orderBy: { order: "asc" as const } } };
  const existing = (await db.pipeline.findFirst({ where: { organisationId, isDefault: true }, include })) ?? (await db.pipeline.findFirst({ where: { organisationId }, include, orderBy: { createdAt: "asc" } }));
  if (existing?.stages.length) return existing;
  const pipeline = existing ?? (await db.pipeline.upsert({ where: { organisationId_key: { organisationId, key: "new_business" } }, create: { organisationId, key: "new_business", name: "New Business", isDefault: true }, update: {} }));
  for (const stage of STANDARD_STAGES) await db.pipelineStage.upsert({ where: { pipelineId_key: { pipelineId: pipeline.id, key: stage.key } }, create: { pipelineId: pipeline.id, ...stage }, update: {} });
  for (const [key, label] of STANDARD_LOSS_REASONS) await db.lossReason.upsert({ where: { organisationId_key: { organisationId, key } }, create: { organisationId, key, label }, update: {} });
  return db.pipeline.findFirstOrThrow({ where: { id: pipeline.id }, include });
}

export function listLossReasons(organisationId: string) {
  return db.lossReason.findMany({ where: { organisationId }, orderBy: { label: "asc" } });
}
