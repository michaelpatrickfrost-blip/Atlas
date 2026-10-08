"use server";
import { assertUserProvisioner } from "@/core/admin/access";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { createRecoveryCredential } from "@/core/auth/recovery";
import { db } from "@/core/db/client";
import { parseCsv } from "@/core/shared/csv";
import { runSetupImport } from "@/core/setup/apply-import";
import { setupTemplate } from "@/core/setup/catalogue";

export type SetupResult = { error: string; message: string; preview: Record<string, string>[] };

async function ownerOrganisation(organisationId: string) {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.manage");
  if (!organisationId || organisationId.length > 64) throw new Error("Choose a company.");
  await db.organisation.findFirstOrThrow({ where: { id: organisationId, kind: "CUSTOMER", archivedAt: null }, select: { id: true } });
  return session;
}

export async function importCompanySetup(_state: SetupResult, form: FormData): Promise<SetupResult> {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.manage");
  const organisationId = String(form.get("organisationId") ?? "");
  const entity = String(form.get("entity") ?? "");
  try {
    await ownerOrganisation(organisationId);
    if (!setupTemplate(entity)) throw new Error("Choose a setup template.");
    const file = form.get("file");
    if (!(file instanceof File) || file.size > 2_000_000) throw new Error("Choose a CSV file smaller than 2 MB.");
    const rows = parseCsv(await file.text());
    const applying = form.get("mode") === "apply";
    const result = await runSetupImport({ organisationId, actorUserId: session.userId, entity, rows, applying, fileName: file.name, customerStatusDefault: "ACTIVE" });
    if (applying) {
      revalidatePath(`/atlas/${organisationId}/setup`);
      revalidatePath(`/atlas/${organisationId}`);
      return { error: "", message: `Imported ${rows.length} ${setupTemplate(entity)?.title.toLowerCase()} records into this company.`, preview: [] };
    }
    return { error: "", message: `${rows.length} valid rows. Review the first 10 below, then import them into this company.`, preview: result.preview };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Import failed.", message: "", preview: [] };
  }
}

export async function createCompanyUser(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "atlas.users.manage");
  assertUserProvisioner(session);
  const organisationId = String(form.get("organisationId") ?? "");
  await ownerOrganisation(organisationId);
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!name || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a name and valid email.");
  const roleIds = [...new Set(form.getAll("roleId").map(String))];
  if (!roleIds.length) throw new Error("Choose at least one role so this person can sign in.");
  const credential = createRecoveryCredential();
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
  const membershipId = await db.$transaction(async (tx) => {
    if (await tx.user.findUnique({ where: { email } })) throw new Error("This email already has an Atlas account. Shared-account invitations are not yet configured.");
    const roles = await tx.role.findMany({ where: { id: { in: roleIds }, organisationId } });
    if (roles.length !== roleIds.length) throw new Error("Choose roles from this company.");
    if (roles.some(role => role.capabilities.some(cap => cap.startsWith("atlas.")))) throw new Error("Company roles cannot grant Atlas staff access.");
    const user = await tx.user.create({ data: { name, email, passwordHash } });
    const membership = await tx.membership.create({ data: { organisationId, userId: user.id, roles: { create: roleIds.map((roleId) => ({ roleId })) } } });
    await tx.passwordReset.create({ data: { membershipId: membership.id, tokenHash: credential.tokenHash, expiresAt: credential.expiresAt } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "atlas.user.created", entityType: "Membership", entityId: membership.id, after: { name, email, roleIds } } });
    return membership.id;
  });
  revalidatePath(`/atlas/${organisationId}`);
  return { membershipId, code: credential.code, expiresAt: credential.expiresAt.toISOString() };
}

export async function setCompanyUserStatus(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "atlas.users.manage");
  const organisationId = String(form.get("organisationId") ?? "");
  await ownerOrganisation(organisationId);
  const membershipId = String(form.get("membershipId") ?? "");
  const status = String(form.get("status") ?? "");
  if (membershipId === session.membershipId) throw new Error("You cannot suspend your own access.");
  if (!["ACTIVE", "SUSPENDED"].includes(status)) throw new Error("Choose active or suspended.");
  await db.$transaction(async (tx) => {
    const before = await tx.membership.findFirstOrThrow({ where: { id: membershipId, organisationId }, include: { user: { select: { platformAdmin: true } } } });
    if (before.user.platformAdmin) throw new Error("Manage Atlas employees from Atlas team.");
    await tx.membership.update({ where: { id: before.id }, data: { active: status === "ACTIVE", sessionVersion: { increment: 1 } } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: status === "ACTIVE" ? "atlas.user.resumed" : "atlas.user.suspended", entityType: "Membership", entityId: membershipId, before: { active: before.active }, after: { active: status === "ACTIVE" } } });
  });
  revalidatePath(`/atlas/${organisationId}`);
}
