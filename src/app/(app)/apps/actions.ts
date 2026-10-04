"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CORE_CAPABILITIES, STANDARD_ROLES } from "@/core/permissions/capabilities";
import { setModuleEnabled } from "@/core/modules/runtime";
import { getModule } from "@/core/modules/registry";
import { db } from "@/core/db/client";
import { writeAudit } from "@/core/audit/log";

export async function toggleModuleAction(moduleId: string, enabled: boolean) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.modulesManage);

  await setModuleEnabled(session.organisationId, moduleId, enabled);
  if (enabled) {
    const entry = getModule(moduleId);
    const moduleCaps = new Set(entry?.capabilities ?? []);
    const roles = moduleCaps.size ? await db.role.findMany({ where: { organisationId: session.organisationId } }) : [];
    for (const role of roles) {
      const template = STANDARD_ROLES.find((item) => item.key === role.key);
      const grant = role.key === "admin" ? [...moduleCaps] : (template?.capabilities.filter((capability) => moduleCaps.has(capability)) ?? []);
      if (!grant.length) continue;
      const capabilities = [...new Set([...role.capabilities, ...grant])];
      if (capabilities.length !== role.capabilities.length) await db.role.update({ where: { id: role.id }, data: { capabilities } });
    }
  }

  await writeAudit({
    organisationId: session.organisationId,
    actorUserId: session.userId,
    action: enabled ? "module.enabled" : "module.disabled",
    entityType: "Module",
    entityId: moduleId,
  });

  revalidatePath("/", "layout");
}
