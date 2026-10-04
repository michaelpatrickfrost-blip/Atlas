import { db } from "@/core/db/client";
import { getModule } from "@/core/modules/registry";
import { writeAudit } from "@/core/audit/log";

/** Assign handling equipment only when Safety, if enabled, says it is available
 *  and the operator holds the required competence. */
export async function assignHandlingEquipment(actor: { organisationId: string; userId: string }, taskId: string, equipmentRef: string, competenceKey: string | null) {
  const task = await db.warehouseTask.findFirst({ where: { id: taskId, organisationId: actor.organisationId } });
  if (!task) throw new Error("That warehouse task is not in this company.");
  const provider = getModule("safety")?.safetyProvider;
  if (provider) {
    const equipment = await provider.assetStatus(actor.organisationId, equipmentRef);
    if (!equipment.available) throw new Error(equipment.reason ?? `${equipmentRef} is unavailable.`);
    const authorisation = await provider.authoriseOperator(actor.organisationId, actor.userId, competenceKey);
    if (!authorisation.authorised) throw new Error(authorisation.reason ?? "This person is not authorised for the equipment.");
  }
  await db.logisticsNote.create({
    data: { organisationId: actor.organisationId, entityType: "WAREHOUSE_TASK", entityId: task.id, audience: "OPERATIONS", body: `Equipment ${equipmentRef} assigned${competenceKey ? ` · competence ${competenceKey}` : ""}.`, authorUserId: actor.userId },
  });
  await writeAudit({ organisationId: actor.organisationId, actorUserId: actor.userId, action: "logistics.equipment.assigned", entityType: "WarehouseTask", entityId: task.id, after: { equipmentRef, competenceKey } });
}
