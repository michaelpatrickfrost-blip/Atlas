"use server";
import { assertUserProvisioner } from "@/core/admin/access";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireSession, createSessionCookie, type Session } from "@/core/auth/session";
import { redirect } from "next/navigation";
import { assertCapability } from "@/core/permissions/check";
import { ATLAS_CAPABILITIES, isStaffRole } from "@/core/admin/access";
import { db } from "@/core/db/client";
import { validNewPassword, createRecoveryCredential } from "@/core/auth/recovery";
import { capabilityOverrides, effectiveRoleCapabilities } from "@/core/permissions/access-levels";
import { companyProfileSchema, readCompanyProfile } from "@/core/setup/company-profile";
import { accessGroups } from "../settings/access-groups";
import { assertPrintableAccent } from "@/core/documents/company-brand";

const value = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const refresh = () => revalidatePath("/", "layout");

export async function openCompanyWorkspace(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.companies);
  const organisationId = value(form, "organisationId");
  await db.$transaction(async tx => {
    await tx.organisation.findFirstOrThrow({ where: { id: organisationId, kind: "CUSTOMER", status: "ACTIVE", archivedAt: null } });
    await tx.membership.upsert({ where: { organisationId_userId: { organisationId, userId: session.userId } }, create: { organisationId, userId: session.userId }, update: { active: true } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "atlas.workspace.opened", entityType: "Organisation", entityId: organisationId, after: { fromOrganisationId: session.organisationId } } });
  });
  await createSessionCookie({ userId: session.userId, organisationId });
  refresh();
  redirect("/home");
}
async function confirmPassword(session: Session, form: FormData) {
  const user = await db.user.findUniqueOrThrow({ where: { id: session.userId }, select: { passwordHash: true } });
  if (!await bcrypt.compare(String(form.get("currentPassword") ?? ""), user.passwordHash)) throw new Error("Confirm your own password to continue.");
}
function identity(form: FormData) {
  const name = value(form, "name"), email = value(form, "email").toLowerCase();
  if (!name || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a name and valid email.");
  return { name, email };
}

export async function saveAtlasUserProfile(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.users);
  const organisationId = value(form, "organisationId"), id = value(form, "membershipId"), data = identity(form);
  if (id === session.membershipId) throw new Error("Use your own profile to change your details.");
  await db.$transaction(async tx => {
    const member = await tx.membership.findFirstOrThrow({ where: { id, organisationId, organisation: { kind: "CUSTOMER", archivedAt: null } }, include: { user: { include: { platformAdmin: true, _count: { select: { memberships: true } } } } } });
    if (member.user.platformAdmin) throw new Error("Manage Atlas employees from Atlas team.");
    if (member.user._count.memberships !== 1) throw new Error("This is a shared identity. The account owner must change their profile.");
    await tx.user.update({ where: { id: member.userId }, data: { ...data, authVersion: { increment: 1 } } });
    await tx.passwordReset.updateMany({ where: { membershipId: id, usedAt: null }, data: { usedAt: new Date() } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "atlas.user.profile.updated", entityType: "Membership", entityId: id, before: { name: member.user.name, email: member.user.email }, after: data } });
  }, { isolationLevel: "Serializable" });
  refresh();
}

export async function saveAtlasUserAccess(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.users);
  const organisationId = value(form, "organisationId"), id = value(form, "membershipId");
  const roleIds = [...new Set(form.getAll("roleId").map(String))], selected = new Set(form.getAll("capability").map(String));
  const known = new Set(accessGroups().flatMap(group => group.capabilities));
  if ([...selected].some(cap => cap.startsWith("atlas.") || !known.has(cap))) throw new Error("Choose valid company permissions. Company roles cannot grant Atlas staff access.");
  if (id === session.membershipId) throw new Error("Another administrator must change your access.");
  await db.$transaction(async tx => {
    const before = await tx.membership.findFirstOrThrow({ where: { id, organisationId, organisation: { kind: "CUSTOMER", archivedAt: null } }, include: { user: { select: { platformAdmin: true } }, roles: true } });
    if (before.user.platformAdmin) throw new Error("Manage Atlas employees from Atlas team.");
    const roles = await tx.role.findMany({ where: { organisationId, id: { in: roleIds } } });
    if (roles.length !== roleIds.length || roles.some(role => role.capabilities.some(cap => cap.startsWith("atlas.")))) throw new Error("Choose roles from this company with company permissions only.");
    const overrides = capabilityOverrides(effectiveRoleCapabilities(roles), selected);
    await tx.roleOnMembership.deleteMany({ where: { membershipId: id } });
    await tx.roleOnMembership.createMany({ data: roleIds.map(roleId => ({ membershipId: id, roleId })) });
    await tx.membership.update({ where: { id, organisationId }, data: { ...overrides, sessionVersion: { increment: 1 } } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "atlas.user.access.updated", entityType: "Membership", entityId: id, before: { roleIds: before.roles.map(role => role.roleId), grantedCapabilities: before.grantedCapabilities, deniedCapabilities: before.deniedCapabilities }, after: { roleIds, ...overrides } } });
  }, { isolationLevel: "Serializable" });
  refresh();
}

export async function revokeAtlasUserSessions(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.users);
  const organisationId = value(form, "organisationId"), id = value(form, "membershipId");
  if (id === session.membershipId) throw new Error("Use your profile to revoke your own sessions.");
  await db.$transaction(async tx => {
    const member = await tx.membership.findFirstOrThrow({ where: { id, organisationId, organisation: { kind: "CUSTOMER" } }, include: { user: { select: { platformAdmin: true } } } });
    if (member.user.platformAdmin) throw new Error("Manage Atlas employees from Atlas team.");
    await tx.membership.update({ where: { id, organisationId }, data: { sessionVersion: { increment: 1 } } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "atlas.user.sessions.revoked", entityType: "Membership", entityId: id } });
  });
  refresh();
}

export async function issueAtlasUserRecovery(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.users);
  await confirmPassword(session, form);
  const organisationId = value(form, "organisationId"), id = value(form, "membershipId");
  const credential = createRecoveryCredential();
  if (id === session.membershipId) throw new Error("Change your password from your own profile.");
  await db.$transaction(async tx => {
    const member = await tx.membership.findFirstOrThrow({ where: { id, organisationId, active: true, organisation: { kind: "CUSTOMER", status: "ACTIVE", archivedAt: null } }, include: { user: { include: { platformAdmin: true, _count: { select: { memberships: true } } } } } });
    if (member.user.platformAdmin || member.user._count.memberships !== 1) throw new Error("Use Atlas team for staff accounts. Shared accounts require the owner's self-service password change.");
    if (await tx.passwordReset.count({ where: { membershipId: id, createdAt: { gt: new Date(Date.now() - 60_000) } } })) throw new Error("Wait one minute before issuing another code.");
    await tx.passwordReset.updateMany({ where: { membershipId: id, usedAt: null }, data: { usedAt: new Date() } });
    await tx.passwordReset.create({ data: { membershipId: id, tokenHash: credential.tokenHash, expiresAt: credential.expiresAt } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "atlas.user.recovery.issued", entityType: "Membership", entityId: id, after: { expiresAt: credential.expiresAt.toISOString() } } });
  }, { isolationLevel: "Serializable" });
  return { code: credential.code, expiresAt: credential.expiresAt.toISOString() };
}

export async function createAtlasStaff(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.staff);
  assertUserProvisioner(session);
  const data = { name: value(form, "name"), email: value(form, "email").toLowerCase() }, role = value(form, "staffRole");
  if (!data.name || data.name.length > 100 || data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { error: "Enter a name and valid email." };
  if (!isStaffRole(role)) return { error: "Choose an Atlas staff role." };
  const password = String(form.get("newPassword") ?? "");
  const passwordHash = validNewPassword(password) ? await bcrypt.hash(password, 12) : null;
  const outcome = await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(71423501)::text`;
    const existing = await tx.user.findUnique({ where: { email: data.email }, include: { platformAdmin: true } });
    if (existing?.platformAdmin) return { error: "This person is already listed in Atlas team. Find them in the staff list to manage their access." };
    if (existing && form.get("existingAccount") !== "on") return { error: "This email already exists. Tick the existing-account confirmation to grant this person Atlas staff access." };
    if (!existing && !passwordHash) return { error: "Enter a password with 12–128 characters, up to 72 UTF-8 bytes, for the new employee." };
    const company = await tx.organisation.upsert({ where: { slug: "atlas-internal-staff" }, create: { slug: "atlas-internal-staff", name: "Atlas team", kind: "INTERNAL", status: "ACTIVE", subscriptionStatus: "ACTIVE", planName: "Internal" }, update: {} });
    if (company.kind !== "INTERNAL" || company.status !== "ACTIVE") return { error: "Atlas staff workspace is unavailable." };
    const user = existing ?? await tx.user.create({ data: { ...data, passwordHash: passwordHash! } });
    await tx.membership.upsert({ where: { organisationId_userId: { organisationId: company.id, userId: user.id } }, create: { organisationId: company.id, userId: user.id }, update: { active: true, sessionVersion: { increment: 1 } } });
    await tx.platformAdministrator.create({ data: { userId: user.id, role } });
    await tx.passwordReset.updateMany({ where: { membership: { userId: user.id }, usedAt: null }, data: { usedAt: new Date() } });
    await tx.auditEntry.create({ data: { organisationId: company.id, actorUserId: session.userId, action: "atlas.staff.created", entityType: "User", entityId: user.id, after: { role, existingAccount: !!existing } } });
    if (existing && existing.id !== session.userId) await tx.user.update({ where: { id: user.id }, data: { authVersion: { increment: 1 } } });
    return { existingAccount: !!existing };
  }, { isolationLevel: "Serializable" });
  if ("error" in outcome) return { error: outcome.error! };
  refresh();
  return outcome.existingAccount ? { message: "Atlas access granted. This person keeps their existing password." } : { message: "Atlas employee created. They can sign in now with the email and password you set." };
}

export async function updateAtlasStaff(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.staff);
  await confirmPassword(session, form);
  const userId = value(form, "userId"), role = value(form, "staffRole"), active = value(form, "status") === "ACTIVE";
  if (!isStaffRole(role) || !["ACTIVE", "SUSPENDED"].includes(value(form, "status"))) throw new Error("Choose a staff role and status.");
  if (userId === session.userId) throw new Error("Another Atlas Owner must change your own staff access.");
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(71423501)::text`;
    const before = await tx.platformAdministrator.findUniqueOrThrow({ where: { userId } });
    if (before.active && before.role === "OWNER" && (!active || role !== "OWNER") && await tx.platformAdministrator.count({ where: { active: true, role: "OWNER" } }) <= 1) throw new Error("Keep at least one active Atlas Owner.");
    await tx.platformAdministrator.update({ where: { userId }, data: { role, active } });
    await tx.user.update({ where: { id: userId }, data: { authVersion: { increment: 1 } } });
    await tx.passwordReset.updateMany({ where: { membership: { userId }, usedAt: null }, data: { usedAt: new Date() } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "atlas.staff.access.updated", entityType: "User", entityId: userId, before: { role: before.role, active: before.active }, after: { role, active } } });
  }, { isolationLevel: "Serializable" });
  refresh();
}

export async function saveAtlasStaffProfile(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.staff);
  await confirmPassword(session, form);
  const userId = value(form, "userId"), data = identity(form);
  if (userId === session.userId) throw new Error("Use My work to edit your own profile.");
  await db.$transaction(async tx => {
    await tx.platformAdministrator.findUniqueOrThrow({ where: { userId } });
    await tx.user.update({ where: { id: userId }, data: { ...data, authVersion: { increment: 1 } } });
    await tx.passwordReset.updateMany({ where: { membership: { userId }, usedAt: null }, data: { usedAt: new Date() } });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "atlas.staff.profile.updated", entityType: "User", entityId: userId } });
  }, { isolationLevel: "Serializable" });
  refresh();
}

export async function issueAtlasStaffRecovery(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.staff);
  await confirmPassword(session, form);
  const userId = value(form, "userId");
  if (userId === session.userId) throw new Error("Change your own password from My work.");
  const credential = createRecoveryCredential();
  await db.$transaction(async tx => {
    await tx.platformAdministrator.findFirstOrThrow({ where: { userId, active: true } });
    const company = await tx.organisation.upsert({ where: { slug: "atlas-internal-staff" }, create: { slug: "atlas-internal-staff", name: "Atlas team", kind: "INTERNAL", subscriptionStatus: "ACTIVE", planName: "Internal" }, update: {} });
    if (company.kind !== "INTERNAL" || company.status !== "ACTIVE") throw new Error("Atlas staff workspace is unavailable.");
    const membership = await tx.membership.upsert({ where: { organisationId_userId: { organisationId: company.id, userId } }, create: { organisationId: company.id, userId }, update: { active: true } });
    if (await tx.passwordReset.count({ where: { membershipId: membership.id, createdAt: { gt: new Date(Date.now() - 60_000) } } })) throw new Error("Wait one minute before issuing another code.");
    await tx.passwordReset.updateMany({ where: { membership: { userId }, usedAt: null }, data: { usedAt: new Date() } });
    await tx.passwordReset.create({ data: { membershipId: membership.id, purpose: "PLATFORM", tokenHash: credential.tokenHash, expiresAt: credential.expiresAt } });
    await tx.auditEntry.create({ data: { organisationId: company.id, actorUserId: session.userId, action: "atlas.staff.recovery.issued", entityType: "User", entityId: userId, after: { expiresAt: credential.expiresAt.toISOString() } } });
  }, { isolationLevel: "Serializable" });
  return { code: credential.code, expiresAt: credential.expiresAt.toISOString() };
}

export async function archiveAtlasCompany(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.archive);
  await confirmPassword(session, form);
  const organisationId = value(form, "organisationId"), reason = value(form, "reason"), restore = value(form, "mode") === "restore";
  if (organisationId === session.organisationId) throw new Error("You cannot archive your current workspace.");
  if (!restore && (!reason || reason.length > 1000)) throw new Error("Record an archive reason (up to 1,000 characters).");
  await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM organisations WHERE id=${organisationId} FOR UPDATE`;
    const before = await tx.organisation.findFirstOrThrow({ where: { id: organisationId, kind: "CUSTOMER" } });
    if (value(form, "confirmName") !== before.name) throw new Error("Type the company name exactly to confirm.");
    if (restore ? !before.archivedAt : !!before.archivedAt) throw new Error(restore ? "This company is not archived." : "This company is already archived.");
    const data = restore ? { status: "SUSPENDED", archivedAt: null, archiveReason: null } : { status: "ARCHIVED", archivedAt: new Date(), archiveReason: reason };
    await tx.organisation.update({ where: { id: organisationId }, data });
    await tx.membership.updateMany({ where: { organisationId }, data: { sessionVersion: { increment: 1 } } });
    await tx.passwordReset.updateMany({ where: { membership: { organisationId }, usedAt: null }, data: { usedAt: new Date() } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: restore ? "atlas.company.restored" : "atlas.company.archived", entityType: "Organisation", entityId: organisationId, before: { status: before.status }, after: { status: data.status, reason: restore ? null : reason } } });
  });
  refresh();
}

export async function saveAtlasCompanyProfile(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.companies);
  const organisationId = value(form, "organisationId");
  await db.$transaction(async tx => {
    const before = await tx.organisation.findFirstOrThrow({ where: { id: organisationId, kind: "CUSTOMER", archivedAt: null } });
    const previous = readCompanyProfile(before.companyProfile);
    const profile = companyProfileSchema.parse({ ...previous, ...Object.fromEntries(["legalName", "registrationNumber", "vatNumber", "addressLine1", "city", "postcode", "country", "timezone", "defaultCurrency", "locale"].map(key => [key, value(form, key)])), fiscalYearStartMonth: Number(value(form, "fiscalYearStartMonth")) });
    await tx.organisation.update({ where: { id: organisationId }, data: { companyProfile: profile } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "atlas.company.profile.updated", entityType: "Organisation", entityId: organisationId } });
  }, { isolationLevel: "Serializable" });
  refresh();
}

export async function saveAtlasCompanyBrand(form: FormData) {
  const session = await requireSession();
  assertCapability(session, ATLAS_CAPABILITIES.companies);
  const organisationId = value(form, "organisationId"), accentColour = assertPrintableAccent(value(form, "accentColour"));
  const keys = ["legalName", "tradingName", "registrationNumber", "vatNumber", "website", "phone", "email", "addressLine1", "city", "postcode", "country", "tagline", "terms", "paymentDetails", "documentFooter"];
  const patch = Object.fromEntries(keys.filter(key => form.has(key)).map(key => [key, value(form, key)]));
  const file = form.get("logo"), remove = form.get("remove") === "on";
  let uploaded: string | undefined;
  if (!remove && file instanceof File && file.size) {
    if (file.size > 350_000) throw new Error("Logo must be 350 KB or smaller.");
    const bytes = Buffer.from(await file.arrayBuffer());
    const mime = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? "png" : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 ? "jpeg" : bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP" ? "webp" : ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString()) ? "gif" : null;
    if (!mime) throw new Error("Use a PNG, JPG, WEBP or GIF logo.");
    uploaded = `data:image/${mime};base64,${bytes.toString("base64")}`;
  }
  await db.$transaction(async tx => {
    const before = await tx.organisation.findFirstOrThrow({ where: { id: organisationId, kind: "CUSTOMER", archivedAt: null } });
    const profile = companyProfileSchema.parse({ ...readCompanyProfile(before.companyProfile), ...patch, accentColour });
    await tx.organisation.update({ where: { id: organisationId }, data: { companyProfile: profile, logoDataUrl: remove ? null : uploaded ?? before.logoDataUrl } });
    await tx.auditEntry.create({ data: { organisationId, actorUserId: session.userId, action: "atlas.company.brand.updated", entityType: "Organisation", entityId: organisationId, after: { accentColour, logoChanged: remove || !!uploaded } } });
  }, { isolationLevel: "Serializable" });
  refresh();
}
