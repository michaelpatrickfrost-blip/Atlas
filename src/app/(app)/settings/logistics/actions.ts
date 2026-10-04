"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { policyFor } from "@/modules/logistics/services/numbers";

export async function saveDispatchDelivery(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.modulesManage);
  const dispatchConfirmsDelivery = form.get("dispatchConfirmsDelivery") === "on";
  await policyFor(session.organisationId);
  await db.$transaction(async (tx) => {
    const before = await tx.logisticsPolicy.findUnique({ where: { organisationId: session.organisationId }, select: { dispatchConfirmsDelivery: true } });
    await tx.logisticsPolicy.update({ where: { organisationId: session.organisationId }, data: { dispatchConfirmsDelivery } });
    await tx.auditEntry.create({
      data: {
        organisationId: session.organisationId,
        actorUserId: session.userId,
        action: "company.logistics.dispatch_delivery.updated",
        entityType: "Organisation",
        entityId: session.organisationId,
        before: { dispatchConfirmsDelivery: before?.dispatchConfirmsDelivery ?? false },
        after: { dispatchConfirmsDelivery },
      },
    });
  });
  revalidatePath("/settings/logistics");
  revalidatePath("/logistics", "layout");
}
