"use server";
import { withFormFeedback } from "@/core/shared/form-feedback";
import { assertBusinessUserProvisioner } from "@/core/admin/access";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import {
  CORE_CAPABILITIES,
  CUSTOMER_CAPABILITIES,
} from "@/core/permissions/capabilities";
import { MODULE_CATALOGUE } from "@/core/modules/registry";
import { memberAccessRevision } from "@/core/permissions/access-revision";
import {
  capabilityOverrides,
  effectiveRoleCapabilities,
} from "@/core/permissions/access-levels";
import { createRecoveryCredential } from "@/core/auth/recovery";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
const knownCapabilities = () =>
  new Set([
    ...Object.values(CORE_CAPABILITIES),
    ...Object.values(CUSTOMER_CAPABILITIES),
    ...MODULE_CATALOGUE.flatMap((m) => m.capabilities),
  ]);
const refresh = () => revalidatePath("/", "layout");
export async function saveUserAccess(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.usersManage);
  assertCapability(session, CORE_CAPABILITIES.rolesManage);
  return withFormFeedback(async () => {
    const id = String(form.get("membershipId")),
      roleIds = [...new Set(form.getAll("roleId").map(String))],
      selected = new Set(form.getAll("capability").map(String));
    if (id === session.membershipId)
      throw new Error("Another administrator must change your access.");
    if ([...selected].some((cap) => !knownCapabilities().has(cap)))
      throw new Error("Unknown permission.");
    await db.$transaction(
      async (tx) => {
        const member = await tx.membership.findFirstOrThrow({
          where: { id, organisationId: session.organisationId },
          include: { roles: { include: { role: true } } },
        });
        const catalogue = await tx.role.findMany({
          where: { organisationId: session.organisationId },
        });
        if (
          String(form.get("accessRevision") ?? "") !==
          memberAccessRevision(member, catalogue)
        )
          throw new Error(
            "This user or an access profile changed. Reload before saving.",
          );
        const roles = catalogue.filter((role) => roleIds.includes(role.id));
        if (roles.length !== roleIds.length) throw new Error("Invalid role.");
        const overrides = capabilityOverrides(
          effectiveRoleCapabilities(roles),
          selected,
        );
        await tx.roleOnMembership.deleteMany({ where: { membershipId: id } });
        await tx.roleOnMembership.createMany({
          data: roleIds.map((roleId) => ({ membershipId: id, roleId })),
        });
        await tx.membership.update({
          where: { id, organisationId: session.organisationId },
          data: { ...overrides, sessionVersion: { increment: 1 } },
        });
        await tx.auditEntry.create({
          data: {
            organisationId: session.organisationId,
            actorUserId: session.userId,
            action: "membership.access.updated",
            entityType: "Membership",
            entityId: id,
            before: {
              roleIds: member.roles.map((r) => r.roleId),
              granted: member.grantedCapabilities,
              denied: member.deniedCapabilities,
            },
            after: { roleIds, ...overrides },
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
    refresh();
  });
}
export async function setUserStatus(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.usersManage);
  return withFormFeedback(async () => {
    const id = String(form.get("membershipId"));
    if (id === session.membershipId)
      throw new Error("You cannot suspend your own access.");
    const status = String(form.get("status"));
    if (!["ACTIVE", "SUSPENDED"].includes(status))
      throw new Error("Invalid status.");
    await db.$transaction(async (tx) => {
      const before = await tx.membership.findFirstOrThrow({
        where: { id, organisationId: session.organisationId },
      });
      await tx.membership.update({
        where: { id, organisationId: session.organisationId },
        data: { active: status === "ACTIVE", sessionVersion: { increment: 1 } },
      });
      await tx.auditEntry.create({
        data: {
          organisationId: session.organisationId,
          actorUserId: session.userId,
          action:
            status === "ACTIVE" ? "membership.resumed" : "membership.suspended",
          entityType: "Membership",
          entityId: id,
          before: { active: before.active },
          after: { active: status === "ACTIVE" },
        },
      });
    });
    refresh();
  });
}
export async function revokeUserSessions(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.usersManage);
  return withFormFeedback(async () => {
    const id = String(form.get("membershipId"));
    if (id === session.membershipId)
      throw new Error("Use your profile to sign out your own sessions.");
    await db.$transaction(async (tx) => {
      await tx.membership.findFirstOrThrow({
        where: { id, organisationId: session.organisationId },
      });
      await tx.membership.update({
        where: { id, organisationId: session.organisationId },
        data: { sessionVersion: { increment: 1 } },
      });
      await tx.auditEntry.create({
        data: {
          organisationId: session.organisationId,
          actorUserId: session.userId,
          action: "membership.sessions.revoked",
          entityType: "Membership",
          entityId: id,
        },
      });
    });
    refresh();
  });
}
export async function issuePasswordRecovery(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.usersManage);
  return withFormFeedback(async () => {
    const me = await db.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { passwordHash: true },
    });
    if (
      !(await bcrypt.compare(
        String(form.get("currentPassword") ?? ""),
        me.passwordHash,
      ))
    )
      throw new Error("Confirm your own password to issue recovery.");
    const id = String(form.get("membershipId"));
    if (id === session.membershipId)
      throw new Error("Change your password from your own profile.");
    const credential = createRecoveryCredential();
    await db.$transaction(
      async (tx) => {
        const member = await tx.membership.findFirstOrThrow({
          where: { id, organisationId: session.organisationId, active: true },
          include: {
            user: {
              include: {
                platformAdmin: true,
                _count: { select: { memberships: true } },
              },
            },
          },
        });
        if (member.user.platformAdmin || member.user._count.memberships !== 1)
          throw new Error(
            "Company administrators cannot reset platform or shared accounts. The account owner must change their password.",
          );
        const recent = await tx.passwordReset.count({
          where: {
            membershipId: id,
            createdAt: { gt: new Date(Date.now() - 60_000) },
          },
        });
        if (recent)
          throw new Error("Wait one minute before issuing another code.");
        await tx.passwordReset.updateMany({
          where: { membershipId: id, usedAt: null },
          data: { usedAt: new Date() },
        });
        await tx.passwordReset.create({
          data: {
            membershipId: id,
            tokenHash: credential.tokenHash,
            expiresAt: credential.expiresAt,
          },
        });
        await tx.auditEntry.create({
          data: {
            organisationId: session.organisationId,
            actorUserId: session.userId,
            action: "account.recovery.issued",
            entityType: "Membership",
            entityId: id,
            after: { expiresAt: credential.expiresAt.toISOString() },
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
    return {
      code: credential.code,
      expiresAt: credential.expiresAt.toISOString(),
    };
  });
}
export async function createManagedUser(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.usersManage);
  return withFormFeedback(async () => {
    assertBusinessUserProvisioner(session);
    const name = String(form.get("name") ?? "").trim(),
      email = String(form.get("email") ?? "")
        .trim()
        .toLowerCase();
    if (
      !name ||
      name.length > 100 ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      throw new Error("Enter a name and valid email.");
    const roleIds = [...new Set(form.getAll("roleId").map(String))];
    const credential = createRecoveryCredential(),
      passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
    const id = await db.$transaction(async (tx) => {
      if (
        (await tx.organisation.count({
          where: {
            id: session.organisationId,
            kind: "CUSTOMER",
            archivedAt: null,
          },
        })) !== 1
      )
        throw new Error(
          "Create business users from a selected customer company in Atlas Admin.",
        );
      if (await tx.user.findUnique({ where: { email } }))
        throw new Error(
          "This email already has an Atlas account. Shared-account invitations are not yet configured.",
        );
      const roles = await tx.role.findMany({
        where: { id: { in: roleIds }, organisationId: session.organisationId },
      });
      if (roles.length !== roleIds.length) throw new Error("Invalid role.");
      const user = await tx.user.create({
        data: { name, email, passwordHash },
      });
      const membership = await tx.membership.create({
        data: {
          organisationId: session.organisationId,
          userId: user.id,
          roles: { create: roleIds.map((roleId) => ({ roleId })) },
        },
      });
      await tx.passwordReset.create({
        data: {
          membershipId: membership.id,
          tokenHash: credential.tokenHash,
          expiresAt: credential.expiresAt,
        },
      });
      await tx.auditEntry.create({
        data: {
          organisationId: session.organisationId,
          actorUserId: session.userId,
          action: "account.created",
          entityType: "Membership",
          entityId: membership.id,
          after: { name, email, roleIds },
        },
      });
      return membership.id;
    });
    refresh();
    return {
      membershipId: id,
      code: credential.code,
      expiresAt: credential.expiresAt.toISOString(),
    };
  });
}
export async function linkEmployeeProfile(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.usersManage);
  assertCapability(session, "people.employee.manage");
  return withFormFeedback(async () => {
    const id = String(form.get("membershipId")),
      employeeId = String(form.get("employeeId") ?? "");
    await db.$transaction(
      async (tx) => {
        const member = await tx.membership.findFirstOrThrow({
          where: { id, organisationId: session.organisationId },
        });
        if (employeeId) {
          const employee = await tx.employee.findFirstOrThrow({
            where: { id: employeeId, organisationId: session.organisationId },
          });
          if (employee.userId && employee.userId !== member.userId)
            throw new Error("This employee is linked to another user.");
        }
        await tx.employee.updateMany({
          where: {
            organisationId: session.organisationId,
            userId: member.userId,
          },
          data: { userId: null },
        });
        if (employeeId)
          await tx.employee.update({
            where: { id: employeeId, organisationId: session.organisationId },
            data: { userId: member.userId },
          });
        await tx.auditEntry.create({
          data: {
            organisationId: session.organisationId,
            actorUserId: session.userId,
            action: "membership.employee_link.updated",
            entityType: "Membership",
            entityId: id,
            after: { employeeId: employeeId || null },
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
    refresh();
  });
}
export async function createRole(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.rolesManage);
  return withFormFeedback(async () => {
    const name = String(form.get("name") ?? "").trim(),
      source = String(form.get("sourceRoleId") ?? "");
    if (!name || name.length > 80)
      throw new Error("Enter a role name (up to 80 characters).");
    await db.$transaction(
      async (tx) => {
        if (
          await tx.role.findFirst({
            where: {
              organisationId: session.organisationId,
              name: { equals: name, mode: "insensitive" },
            },
          })
        )
          throw new Error("A profile with this name already exists.");
        const capabilities = source
          ? (
              await tx.role.findFirstOrThrow({
                where: { id: source, organisationId: session.organisationId },
              })
            ).capabilities
          : [];
        const role = await tx.role.create({
          data: {
            name,
            key: "custom_" + randomBytes(8).toString("hex"),
            organisationId: session.organisationId,
            capabilities,
          },
        });
        await tx.auditEntry.create({
          data: {
            organisationId: session.organisationId,
            actorUserId: session.userId,
            action: "role.created",
            entityType: "Role",
            entityId: role.id,
            after: { name, capabilities },
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
    refresh();
  });
}

export async function saveManagementGroup(form: FormData) {
  const session = await requireSession();
  assertCapability(session, CORE_CAPABILITIES.usersManage);
  return withFormFeedback(async () => {
    const id = String(form.get("groupId") ?? ""),
      name = String(form.get("name") ?? "").trim(),
      description = String(form.get("description") ?? "").trim(),
      departments = [...new Set(form.getAll("department").map(String))],
      managerIds = [...new Set(form.getAll("managerId").map(String))];
    if (
      !name ||
      name.length > 100 ||
      description.length > 1000 ||
      departments.length > 100 ||
      departments.some((d) => !d.trim() || d.length > 100)
    )
      throw new Error("Enter a group name and valid departments.");
    await db.$transaction(
      async (tx) => {
        const existing = id
          ? await tx.workTeam.findFirstOrThrow({
              where: { id, organisationId: session.organisationId },
              include: { members: { where: { isManager: true } } },
            })
          : null;
        const managers = await tx.membership.findMany({
          where: {
            id: { in: managerIds },
            organisationId: session.organisationId,
            active: true,
          },
        });
        if (managers.length !== managerIds.length)
          throw new Error("Managers must be active users in this company.");
        const validDepartments = await tx.employee.findMany({
          where: {
            organisationId: session.organisationId,
            department: { in: departments },
          },
          select: { department: true },
          distinct: ["department"],
        });
        if (
          departments.some(
            (d) =>
              !validDepartments.some((v) => v.department === d) &&
              !existing?.departments.includes(d),
          )
        )
          throw new Error("Select departments from this company.");
        const data = { name, description: description || null, departments };
        const group = existing
          ? await tx.workTeam.update({
              where: { id, organisationId: session.organisationId },
              data,
            })
          : await tx.workTeam.create({
              data: {
                ...data,
                organisationId: session.organisationId,
                code: "GROUP-" + randomBytes(5).toString("hex").toUpperCase(),
              },
            });
        await tx.workTeamMember.updateMany({
          where: { teamId: group.id, isManager: true },
          data: { isManager: false },
        });
        for (const membershipId of managerIds)
          await tx.workTeamMember.upsert({
            where: { teamId_membershipId: { teamId: group.id, membershipId } },
            create: { teamId: group.id, membershipId, isManager: true },
            update: { isManager: true },
          });
        await tx.auditEntry.create({
          data: {
            organisationId: session.organisationId,
            actorUserId: session.userId,
            action: "management.group.updated",
            entityType: "WorkTeam",
            entityId: group.id,
            before: existing
              ? {
                  name: existing.name,
                  departments: existing.departments,
                  managerIds: existing.members.map((m) => m.membershipId),
                }
              : undefined,
            after: { ...data, managerIds },
          },
        });
      },
      { isolationLevel: "Serializable" },
    );
    refresh();
  });
}
