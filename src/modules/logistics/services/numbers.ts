import { db } from "@/core/db/client";
import { DOMAIN_EVENTS, emit } from "@/core/events/bus";
import { writeActivity } from "@/core/activity/log";
import { writeAudit } from "@/core/audit/log";

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0];

const defaultCutOffs = { DPD: "16:00", DHL: "15:30", OWN_FLEET: "14:00" };

export async function policyFor(organisationId: string) {
  const existing = await db.logisticsPolicy.findUnique({ where: { organisationId } });
  if (existing) return existing;
  // Desktop reads cannot create rows. The data service creates the policy on the first command.
  if (process.env.ATLAS_RUNTIME === "desktop") {
    return {
      organisationId, mode: "STANDARD", reservationPolicy: "ON_CONFIRMATION", reserveDaysBefore: 0, releaseMethod: "MANUAL",
      packVerification: "BARCODE", overPickPolicy: "PROHIBITED", removalStrategy: "FEFO", otifOnTimeRule: "ON_OR_BEFORE_PROMISE",
      otifFullPercent: 100, fulfilmentModel: "ATLAS", dispatchConfirmsDelivery: false, cutOffs: defaultCutOffs,
    };
  }
  return db.logisticsPolicy.upsert({ where: { organisationId }, create: { organisationId, cutOffs: defaultCutOffs }, update: {} });
}

export async function nextReference(tx: Tx, organisationId: string, kind: string, prefix: string) {
  const row = await tx.logisticsCounter.upsert({
    where: { organisationId_kind: { organisationId, kind } },
    create: { organisationId, kind, value: 1 },
    update: { value: { increment: 1 } },
  });
  return `${prefix}-${String(row.value).padStart(5, "0")}`;
}

export async function stock() {
  const { getModule } = await import("@/core/modules/registry");
  const provider = getModule("stock")?.stockProvider;
  if (!provider) throw new Error("Inventory is not available for this workspace.");
  return provider;
}

export async function milestone(input: { organisationId: string; actorUserId?: string; action: string; entityType: string; entityId: string; summary: string; partyId?: string; event?: keyof typeof DOMAIN_EVENTS; eventKey?: string; payload?: unknown }) {
  await writeAudit({ organisationId: input.organisationId, actorUserId: input.actorUserId, action: input.action, entityType: input.entityType, entityId: input.entityId, after: input.payload });
  await writeActivity({ organisationId: input.organisationId, type: input.action, summary: input.summary, entityType: input.entityType, entityId: input.entityId, partyId: input.partyId });
  if (input.event && input.eventKey) {
    await db.domainOutbox.create({ data: { organisationId: input.organisationId, eventKey: input.eventKey, eventName: DOMAIN_EVENTS[input.event], payload: JSON.parse(JSON.stringify(input.payload ?? {})) } }).catch((error: { code?: string }) => {
      if (error.code !== "P2002") throw error;
    });
    await emit(DOMAIN_EVENTS[input.event], input.payload);
  }
}

export function sameOperation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && String(error.code) === "P2002";
}
