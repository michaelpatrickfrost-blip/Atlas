"use server";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { CUSTOMER_CAPABILITIES } from "@/core/permissions/capabilities";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
import type { Session } from "@/core/auth/session";
import { hierarchyAccountIds, nextHierarchyParent, reportsInCircle } from "@/core/customers/hierarchy";

type Placement = { parentPartyId: string | null; hierarchyRole: string; customerGroup: string | null };

async function applyPlacement(session: Session, partyId: string, placement: Placement) {
  if (!["GROUP", "CUSTOMER", "BRANCH", "DELIVERY"].includes(placement.hierarchyRole)) throw new Error("Invalid hierarchy level.");
  await db.$transaction(async (tx) => {
    const before = await tx.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId } });
    const seen = new Set([partyId]);
    let next = placement.parentPartyId;
    while (next) {
      if (seen.has(next)) throw new Error("This parent would create a circular customer hierarchy.");
      seen.add(next);
      const parent = await tx.party.findFirstOrThrow({ where: { id: next, organisationId: session.organisationId }, select: { parentPartyId: true } });
      next = parent.parentPartyId;
    }
    await tx.party.update({ where: { id: partyId, organisationId: session.organisationId }, data: placement });
    await tx.auditEntry.create({
      data: {
        organisationId: session.organisationId,
        actorUserId: session.userId,
        action: "customer.parent.updated",
        entityType: "Party",
        entityId: partyId,
        before: { parentPartyId: before.parentPartyId, hierarchyRole: before.hierarchyRole, customerGroup: before.customerGroup },
        after: placement,
      },
    });
  }, { isolationLevel: "Serializable" });
  revalidatePath("/customers");
  revalidatePath("/customers/map");
  revalidatePath(`/customers/${partyId}`);
}

export async function setCustomerParent(partyId: string, form: FormData) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.edit);
  const hierarchyRole = String(form.get("hierarchyRole") ?? "CUSTOMER");
  const customerGroup = String(form.get("customerGroup") ?? "").trim().slice(0, 100) || null;
  const parentPartyId = String(form.get("parentPartyId") ?? "") || null;
  await applyPlacement(session, partyId, { parentPartyId, hierarchyRole, customerGroup });
}

export async function placeCustomer(partyId: string, parentPartyId: string | null, hierarchyRole: string) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.edit);
  const current = await db.party.findFirstOrThrow({ where: { id: partyId, organisationId: session.organisationId }, select: { customerGroup: true } });
  await applyPlacement(session, partyId, { parentPartyId: parentPartyId || null, hierarchyRole, customerGroup: current.customerGroup });
}

export async function moveCustomer(partyId: string, direction: "up" | "down") {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.edit);
  const accounts = await db.party.findMany({
    where: { organisationId: session.organisationId },
    select: { id: true, name: true, parentPartyId: true, hierarchyRole: true, customerGroup: true },
  });
  const account = accounts.find((item) => item.id === partyId);
  if (!account) throw new Error("That account is not in this company.");
  const parentPartyId = nextHierarchyParent(accounts, partyId, direction);
  if (parentPartyId === undefined) throw new Error(direction === "up" ? "This account is already at the top of its group." : "There is no account above this one to move under.");
  await applyPlacement(session, partyId, { parentPartyId, hierarchyRole: account.hierarchyRole, customerGroup: account.customerGroup });
}

export async function setContactReportsTo(contactId: string, reportsToContactId: string | null) {
  const session = await requireSession();
  assertCapability(session, CUSTOMER_CAPABILITIES.contactsManage);
  const managerId = reportsToContactId || null;
  await db.$transaction(async (tx) => {
    const contact = await tx.contact.findFirstOrThrow({
      where: { id: contactId, party: { organisationId: session.organisationId } },
      select: { id: true, partyId: true, reportsToContactId: true },
    });
    if (managerId) {
      if (managerId === contactId) throw new Error("A person cannot report to themself.");
      const manager = await tx.contact.findFirstOrThrow({
        where: { id: managerId, status: "ACTIVE", party: { organisationId: session.organisationId } },
        select: { id: true, partyId: true },
      });
      const accounts = await tx.party.findMany({ where: { organisationId: session.organisationId }, select: { id: true, parentPartyId: true } });
      const family = new Set(hierarchyAccountIds(accounts, contact.partyId));
      if (!family.has(manager.partyId)) throw new Error("Choose a manager in this account group.");
      const people = await tx.contact.findMany({
        where: { status: "ACTIVE", party: { organisationId: session.organisationId, id: { in: [...family] } } },
        select: { id: true, reportsToContactId: true },
      });
      if (reportsInCircle(people, contactId, managerId)) throw new Error("That manager would make a reporting circle.");
    }
    await tx.contact.update({ where: { id: contactId }, data: { reportsToContactId: managerId } });
    await tx.auditEntry.create({
      data: {
        organisationId: session.organisationId,
        actorUserId: session.userId,
        action: "customer.contact.reports_to",
        entityType: "Contact",
        entityId: contactId,
        before: { reportsToContactId: contact.reportsToContactId },
        after: { reportsToContactId: managerId, partyId: contact.partyId },
      },
    });
  });
  revalidatePath("/customers");
  revalidatePath("/customers/map");
}
