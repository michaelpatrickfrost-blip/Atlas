import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import { sessionAuthorityStamp, type Session } from "@/core/auth/session";
import { ATLAS_CAPABILITIES } from "@/core/admin/access";
import { assertCapability } from "@/core/permissions/check";
import { writeAudit } from "@/core/audit/log";
import { nativeFieldMutationSessionInTransaction } from "@/core/studio/fields/runtime-authority";
import { parseTemplateSave } from "./authoring-input";

const sqlFailure = z.object({ code: z.string().optional(), driverAdapterError: z.object({ cause: z.object({ originalCode: z.string().optional() }).optional() }).optional() });
function conflict(): never { throw new Error("CONFLICT: another person changed this template or your access. Your changes are kept; reload the saved template before trying again."); }

/** Original Templates authoring engine, shared by native and Studio adapters.
 * The caller supplies an authenticated server Session, never a tenant/grant DTO.
 * Existing selected-business transactions call the counterpart below directly;
 * no renderer, generated snapshot, publication store or native domain is replaced.
 */
export async function saveTemplateForSession(authenticated: Session, form: FormData): Promise<{ id: string; version: number }> {
  if (!sessionAuthorityStamp(authenticated)) throw new Error("FORBIDDEN: current authenticated company access is required.");
  assertCapability(authenticated, "core.contract.manage");
  try {
    return await db.$transaction(tx => saveTemplateInTransaction(authenticated, tx, form), { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const metadata = sqlFailure.safeParse(error.meta), state = metadata.success ? metadata.data.code ?? metadata.data.driverAdapterError?.cause?.originalCode : undefined;
      if (error.code === "P2034" || (error.code === "P2010" && state !== undefined && ["40001", "40P01"].includes(state))) conflict();
    }
    throw error;
  }
}

/** Internal existing-Serializable-transaction entry. Genuine identity, current
 * stamps/membership/roles/modules are refreshed under their original shared locks.
 * Real Atlas staff retain native Templates' existing module-availability exception;
 * customer enablement and entitlement are checked in this SAME snapshot. Studio
 * authoring guards remain the adapter's responsibility and grant no native access.
 */
export async function saveTemplateInTransaction(authenticated: Session, transaction: Prisma.TransactionClient, form: FormData): Promise<{ id: string; version: number }> {
  const { session } = await nativeFieldMutationSessionInTransaction(authenticated, transaction);
  assertCapability(session, "core.contract.manage");
  if (!session.capabilities.has(ATLAS_CAPABILITIES.staff) && !await transaction.moduleState.findFirst({ where: {
    organisationId: session.organisationId, moduleId: "templates", enabled: true, entitled: true }, select: { id: true } }))
    throw new Error("Templates is not enabled for this company.");
  const input = parseTemplateSave(form);
  let result: { id: string; version: number };
  if (input.id) {
    const changed = await transaction.documentTemplate.updateMany({ where: { id: input.id, organisationId: session.organisationId,
      version: input.version!, status: { not: "ARCHIVED" } }, data: { ...input.data, version: { increment: 1 } } });
    if (changed.count !== 1) conflict();
    result = { id: input.id, version: input.version! + 1 };
  } else result = await transaction.documentTemplate.create({ data: { ...input.data, organisationId: session.organisationId,
    createdBy: session.userId }, select: { id: true, version: true } });
  await writeAudit({ organisationId: session.organisationId, actorUserId: session.userId, action: "template.saved",
    entityType: "DocumentTemplate", entityId: result.id, after: { name: input.data.name, status: input.data.status } }, transaction);
  return result;
}
