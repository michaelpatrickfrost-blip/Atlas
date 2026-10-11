import {validQuantity,addQuantity} from "@/core/shared/quantity";
import { db } from "@/core/db/client";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { stockProvider } from "./provider";

export class HandoffError extends Error {}
export type CollectionInput = {
  batchId: string;
  version: number;
  quantity: number;
  serials?: string[];
  locationId: string;
  requestKey: string;
  note: string;
};
export function readCollection(form: FormData): CollectionInput {
  const value = {
    batchId: String(form.get("batchId") ?? ""),
    version: Number(form.get("version")),
    quantity: Number(form.get("quantity")),
    serials:String(form.get("serials")??"").split(/[\s,;]+/).filter(Boolean),
    locationId: String(form.get("locationId") ?? ""),
    requestKey: String(form.get("requestKey") ?? ""),
    note: String(form.get("note") ?? "").trim(),
  };
  if (
    !value.batchId ||
    !value.locationId ||
    !value.requestKey ||
    [value.batchId, value.locationId, value.requestKey].some(
      (id) => !/^[a-zA-Z0-9:_-]{1,100}$/.test(id),
    )
  )
    throw new HandoffError("Choose the batch and destination again.");
  if (!Number.isSafeInteger(value.version) || value.version < 1)
    throw new HandoffError("Refresh the batch before collecting it.");
  if (
    !validQuantity(value.quantity) ||
    value.quantity <= 0 ||
    value.quantity > 1000000
  )
    throw new HandoffError(
      "Enter the actual collected quantity, with up to six decimal places.",
    );
  if (value.note.length < 3 || value.note.length > 1000)
    throw new HandoffError(
      "Record a short collection or yard-booking reference.",
    );
  return value;
}

export async function collectProductionBatch(
  session: Session,
  input: CollectionInput,
) {
  assertCapability(session, "stock.manage");
  await assertModuleEnabled(session, "stock");
  const submitted = new FormData();
  for (const [key, value] of Object.entries(input))
    submitted.set(key, String(value));
  input = readCollection(submitted);
  let destination:
    | { productId: string; warehouseId: string; requestKey: string }
    | undefined;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      destination = await db.$transaction(
        async (tx) => {
          const prior = await tx.stockProductionCollection.findUnique({
            where: {
              organisationId_requestKey: {
                organisationId: session.organisationId,
                requestKey: input.requestKey,
              },
            },
          });
          if (prior) {
            if (
              prior.batchId !== input.batchId ||
              Number(prior.quantity) !== input.quantity ||
              prior.locationId !== input.locationId ||
              prior.note !== input.note || JSON.stringify([...(prior.serials??[])].sort()) !== JSON.stringify([...(input.serials??[])].sort())
            )
              throw new HandoffError(
                "This collection reference was already used for different details.",
              );
            return;
          }
          const batch = await tx.stockProductionBatch.findFirst({
            where: {
              id: input.batchId,
              organisationId: session.organisationId,
            },
            include: { location: true,product:{select:{trackingMode:true}} },
          });
          if (!batch)
            throw new HandoffError(
              "This batch is unavailable in your workspace.",
            );
          if (batch.version !== input.version)
            throw new HandoffError(
              "Someone else changed this batch. Refresh it and check the remaining quantity.",
            );
          const remaining = addQuantity(Number(batch.quantity),-Number(batch.collectedQuantity));
          if (input.quantity > remaining)
            throw new HandoffError(
              `Only ${remaining.toLocaleString("en-GB")} units remain to collect.`,
            );
          if (
            !batch.location.active ||
            !batch.location.capabilities.includes("PRODUCTION_STAGING")
          )
            throw new HandoffError(
              "The source production holding area needs an Inventory administrator to review it.",
            );
          const held = await tx.qualityHold.count({
            where: {
              organisationId: session.organisationId,
              productId: batch.productId,
              status: "ACTIVE",
              AND: [
                {
                  OR: [
                    { warehouseId: null },
                    { warehouseId: batch.warehouseId },
                  ],
                },
                { OR: [{ lotCode: null }, { lotCode: batch.lotCode }] },
              ],
            },
          });
          if (held)
            throw new HandoffError(
              "Quality has an active hold on this batch. Ask Quality to review and release it before collection.",
            );
          const target = await tx.stockLocation.findFirst({
            where: {
              id: input.locationId,
              organisationId: session.organisationId,
              active: true,
              capabilities: { hasSome: ["STORAGE", "PICK_FACE", "BULK"] },
            },
            include: { warehouse: true },
          });
          if (
            !target ||
            target.capabilities.some((cap) =>
              [
                "PRODUCTION_STAGING",
                "QUARANTINE",
                "SCRAP",
                "SHIPPING",
              ].includes(cap),
            )
          )
            throw new HandoffError(
              "Choose an active storage location in the destination yard or warehouse.",
            );
          if (target.id === batch.locationId)
            throw new HandoffError(
              "Choose the yard or warehouse location where the batch has arrived.",
            );
          const changed = await tx.stockProductionBatch.updateMany({
            where: {
              id: batch.id,
              organisationId: session.organisationId,
              version: input.version,
              collectedQuantity: batch.collectedQuantity,
            },
            data: {
              collectedQuantity: { increment: input.quantity },
              version: { increment: 1 },
              fullyCollected: input.quantity === remaining,
            },
          });
          if (changed.count !== 1)
            throw new HandoffError(
              "Someone else collected this batch. Refresh and check the remaining quantity.",
            );
          await stockProvider.executeMovement(
            session,
            {
              productId: batch.productId,
              warehouseId: batch.warehouseId,
              locationId: batch.locationId,
              lotCode: batch.lotCode,
              status: "BLOCKED",
              serials:input.serials??[],
              quantity: input.quantity,
              toWarehouseId: target.warehouseId,
              toLocationId: target.id,
              toStatus: "AVAILABLE",
              reason: "Production batch collected · " + input.note,
              reference: batch.lotCode,
              requestKey: input.requestKey,
              manufacturingOrderId: batch.manufacturingOrderId,
              workOrderId: batch.workOrderId,
            },
            tx,
          );
          const collection = await tx.stockProductionCollection.create({
            data: {
              organisationId: session.organisationId,
              batchId: batch.id,
              warehouseId: target.warehouseId,
              locationId: target.id,
              quantity: input.quantity,
              serials:input.serials??[],
              actorUserId: session.userId,
              requestKey: input.requestKey,
              note: input.note,
            },
          });
          await tx.auditEntry.create({
            data: {
              organisationId: session.organisationId,
              actorUserId: session.userId,
              action: "stock.production_batch.collected",
              entityType: "StockProductionCollection",
              entityId: collection.id,
              after: {
                batchId: batch.id,
                quantity: input.quantity,
                warehouseId: target.warehouseId,
                locationId: target.id,
                remaining: remaining - input.quantity,
              },
            },
          });
          return {
            productId: batch.productId,
            warehouseId: target.warehouseId,
            requestKey: `balance:${input.requestKey}`,
          };
        },
        { isolationLevel: "Serializable" },
      );
      break;
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String(error.code)
          : "";
      if (attempt < 2 && ["P2034", "P2002"].includes(code)) continue;
      throw error;
    }
  }
  if (destination) {
    const { stockReplenished } = await import("@/core/stock/replenishment");
    await stockReplenished(session, destination);
  }
}

export async function readProductionHandoffs(
  session: Session,
  query: { q?: string; state?: string; page?: string },
) {
  assertCapability(session, "stock.read");
  await assertModuleEnabled(session, "stock");
  const search = (query.q ?? "").trim().slice(0, 100),
    page = Math.min(100000, Math.max(0, Math.trunc(Number(query.page) || 0))),
    all = query.state === "all";
  const pending: Prisma.StockProductionBatchWhereInput = {
    organisationId: session.organisationId,
    fullyCollected: false,
  };
  const where: Prisma.StockProductionBatchWhereInput = {
    ...(all ? { organisationId: session.organisationId } : pending),
    ...(search
      ? {
          OR: [
            { lotCode: { contains: search, mode: "insensitive" } },
            { product: { name: { contains: search, mode: "insensitive" } } },
            { product: { code: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [rows, count, pendingCount, locations] = await Promise.all([
    db.stockProductionBatch.findMany({
      where,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: {
        product: { select: { code: true, name: true, unitOfMeasure: true,trackingMode:true } },
        warehouse: { select: { name: true, kind: true } },
        location: { select: { name: true } },
        collections: {
          orderBy: { createdAt: "desc" },
          include: {
            warehouse: { select: { name: true, kind: true } },
            location: { select: { name: true } },
          },
          take: 20,
        },
      },
      skip: page * 50,
      take: 50,
    }),
    db.stockProductionBatch.count({ where }),
    db.stockProductionBatch.count({ where: pending }),
    session.capabilities.has("stock.manage")
      ? db.stockLocation.findMany({
          where: {
            organisationId: session.organisationId,
            active: true,
            capabilities: { hasSome: ["STORAGE", "PICK_FACE", "BULK"] },
            NOT: {
              capabilities: {
                hasSome: [
                  "PRODUCTION_STAGING",
                  "QUARANTINE",
                  "SCRAP",
                  "SHIPPING",
                ],
              },
            },
          },
          include: {
            warehouse: { select: { name: true, kind: true, code: true } },
          },
          orderBy: [
            { warehouse: { name: "asc" } },
            { sequence: "asc" },
            { id: "asc" },
          ],
          take: 1001,
        })
      : [],
  ]);
  if (locations.length > 1000)
    throw new HandoffError(
      "Narrow the storage-location setup below 1,000 active destinations before booking a handoff.",
    );
  const actorIds=[...new Set(rows.flatMap(batch=>[batch.createdByUserId,...batch.collections.map(item=>item.actorUserId)]))];
  const actors=actorIds.length?await db.user.findMany({where:{id:{in:actorIds},memberships:{some:{organisationId:session.organisationId}}},select:{id:true,name:true}}):[];
  const actorNames=Object.fromEntries(actors.map(actor=>[actor.id,actor.name]));
  return { rows, count, pendingCount, locations, page, search, all, actorNames };
}
