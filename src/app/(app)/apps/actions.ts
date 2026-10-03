"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES } from "@/core/permissions/capabilities";
import { setModuleEnabled } from "@/core/modules/runtime";
import { writeAudit } from "@/core/audit/log";

export async function toggleModuleAction(moduleId: string, enabled: boolean) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.modulesManage);

  await setModuleEnabled(session.organisationId, moduleId, enabled);

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: enabled ? "module.enabled" : "module.disabled",
    entityType: "Module",
    entityId: moduleId,
  });

  revalidatePath("/apps");
  revalidatePath("/home");
}
