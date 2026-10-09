"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { db } from "@/core/db/client";
import { writeAudit } from "@/core/audit/log";
import { writeActivity } from "@/core/activity/log";
import { appointmentSchema, APPOINTMENT_TYPES } from "../domain/appointments";
import { ownerRestriction } from "./visibility";

class AppointmentInputError extends Error {}

function refresh(partyId?: string | null) {
  revalidatePath("/crm/appointments");
  revalidatePath("/crm/today");
  if (partyId) {
    revalidatePath(`/customers/${partyId}`);
    revalidatePath(`/crm/accounts/${partyId}`);
  }
}
export async function saveAppointment(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.activity.manage");
  await assertModuleEnabled(session, "crm");
  const parsed = appointmentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success)
    throw new AppointmentInputError(parsed.error.issues[0].message);
  const input = parsed.data,
    organisationId = session.organisationId;
  const ownerUserId = input.ownerUserId || session.userId;
  if (ownerUserId !== session.userId && ownerRestriction(session))
    throw new AppointmentInputError(
      "You can schedule only your own appointments.",
    );
  const row = await db.$transaction(
    async (tx) => {
      await tx.membership.findFirstOrThrow({
        where: { organisationId, userId: ownerUserId, active: true },
      });
      let partyId = input.partyId || null;
      if (partyId) {
        assertCapability(session, "customers.read");
        await tx.party.findFirstOrThrow({
          where: {
            id: partyId,
            organisationId,
            identityScrubbed: false,
            archived: false,
          },
        });
      }
      if (input.prospectId) {
        assertCapability(session, "sales.prospect.read");
        await tx.prospect.findFirstOrThrow({
          where: {
            id: input.prospectId,
            organisationId,
            ...(ownerRestriction(session)
              ? { ownerUserId: session.userId }
              : {}),
          },
        });
      }
      if (input.opportunityId) {
        assertCapability(session, "sales.opportunity.read");
        const deal = await tx.opportunity.findFirstOrThrow({
          where: {
            id: input.opportunityId,
            organisationId,
            ...(ownerRestriction(session)
              ? { ownerUserId: session.userId }
              : {}),
            party: { identityScrubbed: false },
          },
        });
        if (input.prospectId || (partyId && deal.partyId !== partyId))
          throw new AppointmentInputError(
            "Choose a deal belonging to this customer.",
          );
        assertCapability(session, "customers.read");
        partyId = deal.partyId;
      }
      const data = {
        organisationId,
        ownerUserId,
        type: input.type,
        subject: input.subject,
        notes: input.notes || null,
        location: input.location || null,
        partyId,
        prospectId: input.prospectId || null,
        opportunityId: input.opportunityId || null,
        dueAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
      };
      if (!input.id) {
        const previous = await tx.salesActivity.findUnique({
          where: {
            organisationId_requestKey: {
              organisationId,
              requestKey: input.requestKey,
            },
          },
        });
        if (previous) {
          if (
            previous.ownerUserId !== ownerUserId ||
            previous.subject !== data.subject ||
            previous.dueAt?.getTime() !== data.dueAt.getTime() ||
            previous.endsAt?.getTime() !== data.endsAt.getTime() ||
            previous.partyId !== partyId ||
            previous.prospectId !== data.prospectId ||
            previous.opportunityId !== data.opportunityId ||
            previous.location !== data.location ||
            previous.notes !== data.notes ||
            previous.type !== data.type
          )
            throw new AppointmentInputError(
              "This save was already used for a different appointment. Reload and try again.",
            );
          return previous;
        }
      } else {
        await tx.salesActivity.findFirstOrThrow({
          where: {
            id: input.id,
            organisationId,
            type: { in: [...APPOINTMENT_TYPES] },
            completedAt: null,
            cancelledAt: null,
            ...(ownerRestriction(session)
              ? { ownerUserId: session.userId }
              : {}),
          },
        });
      }
      const clash = await tx.salesActivity.findFirst({
        where: {
          organisationId,
          ownerUserId,
          id: { not: input.id || undefined },
          completedAt: null,
          cancelledAt: null,
          dueAt: { lt: data.endsAt },
          endsAt: { gt: data.dueAt },
        },
        select: { subject: true },
      });
      if (clash)
        throw new AppointmentInputError(
          `This time overlaps “${clash.subject}”. Choose another time.`,
        );
      let activity;
      if (input.id) {
        const changed = await tx.salesActivity.updateMany({
          where: {
            id: input.id,
            organisationId,
            version: input.version,
            completedAt: null,
            cancelledAt: null,
          },
          data: { ...data, version: { increment: 1 } },
        });
        if (changed.count !== 1)
          throw new AppointmentInputError(
            "This appointment changed. Refresh before saving.",
          );
        activity = await tx.salesActivity.findFirstOrThrow({
          where: { id: input.id, organisationId },
        });
      } else
        activity = await tx.salesActivity.create({
          data: { ...data, requestKey: input.requestKey },
        });
      await writeAudit(
        {
          organisationId,
          actorUserId: session.userId,
          action: input.id
            ? "crm.appointment_updated"
            : "crm.appointment_created",
          entityType: "SalesActivity",
          entityId: activity.id,
          after: {
            partyId,
            ownerUserId,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            version: activity.version,
          },
        },
        tx,
      );
      if (partyId)
        await writeActivity(
          {
            organisationId,
            partyId,
            type: "crm.appointment_scheduled",
            entityType: "SalesActivity",
            entityId: activity.id,
            summary: `${input.type.replaceAll("_", " ").toLowerCase()}: ${input.subject}`,
          },
          tx,
        );
      return activity;
    },
    { isolationLevel: "Serializable" },
  );
  refresh(row.partyId);
}
export async function finishAppointment(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.activity.manage");
  await assertModuleEnabled(session, "crm");
  const id = String(form.get("id") ?? ""),
    version = Number(form.get("version")),
    cancelled = form.get("cancel") === "yes",
    outcome = String(form.get("outcome") ?? "").trim();
  if (
    !id ||
    !Number.isInteger(version) ||
    version < 1 ||
    outcome.length > 3000 ||
    (!cancelled && !outcome)
  )
    throw new AppointmentInputError(
      "Record an outcome of up to 3,000 characters.",
    );
  const row = await db.$transaction(
    async (tx) => {
      const activity = await tx.salesActivity.findFirstOrThrow({
        where: {
          id,
          organisationId: session.organisationId,
          type: { in: [...APPOINTMENT_TYPES] },
          ...(ownerRestriction(session) ? { ownerUserId: session.userId } : {}),
        },
      });
      if (activity.cancelledAt || activity.completedAt)
        throw new AppointmentInputError("This appointment is already closed.");
      const changed = await tx.salesActivity.updateMany({
        where: {
          id,
          organisationId: session.organisationId,
          version,
          cancelledAt: null,
          completedAt: null,
        },
        data: {
          ...(cancelled
            ? { cancelledAt: new Date() }
            : { completedAt: new Date() }),
          outcome: outcome || null,
          version: { increment: 1 },
        },
      });
      if (changed.count !== 1)
        throw new AppointmentInputError(
          "This appointment changed. Refresh and try again.",
        );
      await writeAudit(
        {
          organisationId: session.organisationId,
          actorUserId: session.userId,
          action: cancelled
            ? "crm.appointment_cancelled"
            : "crm.appointment_completed",
          entityType: "SalesActivity",
          entityId: id,
          after: { version: version + 1 },
        },
        tx,
      );
      if (activity.partyId)
        await writeActivity(
          {
            organisationId: session.organisationId,
            partyId: activity.partyId,
            type: cancelled
              ? "crm.appointment_cancelled"
              : "crm.appointment_completed",
            entityType: "SalesActivity",
            entityId: id,
            summary: `${activity.subject} ${cancelled ? "cancelled" : "completed"}`,
          },
          tx,
        );
      return activity;
    },
    { isolationLevel: "Serializable" },
  );
  refresh(row.partyId);
}

// Expected input conflicts are returned explicitly so production React preserves useful feedback.
export async function saveAppointmentForm(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.activity.manage");
  try {
    await saveAppointment(form);
    return {};
  } catch (error) {
    if (error instanceof AppointmentInputError) return { error: error.message };
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2034"
    )
      return {
        error: "This appointment changed while saving. Refresh and try again.",
      };
    throw error;
  }
}
export async function finishAppointmentForm(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "sales.activity.manage");
  try {
    await finishAppointment(form);
    return {};
  } catch (error) {
    if (error instanceof AppointmentInputError) return { error: error.message };
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2034"
    )
      return {
        error: "This appointment changed while saving. Refresh and try again.",
      };
    throw error;
  }
}
