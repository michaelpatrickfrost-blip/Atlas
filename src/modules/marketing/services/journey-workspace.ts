"use server";
import { ZodError } from "zod";
import { requireSession, type Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import type { Prisma } from "@/generated/prisma/client";
import { writeAudit } from "@/core/audit/log";
import { revalidatePath } from "next/cache";
import { requireMarketing } from "./queries";
import {
  journeyStageSchema,
  journeyTouchSchema,
  journeyPathSchema,
} from "../domain/planning";

class JourneyInputError extends Error {}
const text = (form: FormData, name: string, max = 1000) => {
  const value = String(form.get(name) ?? "").trim();
  if (value.length > max) throw new JourneyInputError(`${name} is too long.`);
  return value;
};
async function mapForEdit(
  tx: Prisma.TransactionClient,
  session: Session,
  form: FormData,
) {
  const id = text(form, "journeyId", 100),
    expected = text(form, "expected", 100);
  if (!expected || !Number.isFinite(Date.parse(expected)))
    throw new JourneyInputError("Refresh the journey before saving.");
  const map = await tx.marketingProgram.findFirstOrThrow({
    where: { id, organisationId: session.organisationId, kind: "JOURNEY_MAP" },
  });
  const changed = await tx.marketingProgram.updateMany({
    where: {
      id,
      organisationId: session.organisationId,
      kind: "JOURNEY_MAP",
      updatedAt: new Date(expected),
    },
    data: { updatedAt: new Date() },
  });
  if (changed.count !== 1)
    throw new JourneyInputError(
      "This journey changed. Refresh before saving your changes.",
    );
  return map;
}
async function audit(
  tx: Prisma.TransactionClient,
  session: Session,
  mapId: string,
  action: string,
  entityId: string,
) {
  await writeAudit(
    {
      organisationId: session.organisationId,
      actorUserId: session.userId,
      action: `marketing.journey.${action}`,
      entityType: "MarketingProgram",
      entityId,
      after: { journeyId: mapId },
    },
    tx,
  );
}
function refresh() {
  revalidatePath("/marketing/journey");
}
export async function editJourneyStage(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "marketing.program.manage");
  await requireMarketing(session);
  await db.$transaction(
    async (tx) => {
      const map = await mapForEdit(tx, session, form),
        id = text(form, "id", 100);
      const row = await tx.marketingProgram.findFirstOrThrow({
        where: {
          id,
          organisationId: session.organisationId,
          kind: "JOURNEY_STAGE",
        },
      });
      const current = journeyStageSchema.parse(row.definition);
      if (current.journeyId !== map.id)
        throw new JourneyInputError("This stage belongs to another journey.");
      const name = text(form, "name", 250);
      if (!name) throw new JourneyInputError("Name this stage.");
      const definition = journeyStageSchema.parse({
        ...current,
        customerIntent: text(form, "customerIntent", 500),
        emotion: text(form, "emotion"),
        painPoint: text(form, "painPoint"),
        opportunity: text(form, "opportunity"),
        successMeasure: text(form, "successMeasure", 500),
      });
      await tx.marketingProgram.update({
        where: { id, organisationId: session.organisationId },
        data: { name, definition },
      });
      await audit(tx, session, map.id, "stage_updated", id);
    },
    { isolationLevel: "Serializable" },
  );
  refresh();
}
export async function moveJourneyStage(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "marketing.program.manage");
  await requireMarketing(session);
  await db.$transaction(
    async (tx) => {
      const map = await mapForEdit(tx, session, form),
        id = text(form, "id", 100),
        direction = text(form, "direction");
      if (!["left", "right"].includes(direction))
        throw new JourneyInputError("Choose a valid direction.");
      const all = await tx.marketingProgram.findMany({
        where: {
          organisationId: session.organisationId,
          kind: "JOURNEY_STAGE",
          definition: { path: ["journeyId"], equals: map.id },
        },
        orderBy: { createdAt: "asc" },
      });
      const stages = all
        .map((row) => ({ row, data: journeyStageSchema.parse(row.definition) }))
        .sort((a, b) => a.data.order - b.data.order);
      const index = stages.findIndex((stage) => stage.row.id === id),
        next = index + (direction === "left" ? -1 : 1);
      if (index < 0 || next < 0 || next >= stages.length)
        throw new JourneyInputError("This stage cannot move further.");
      [stages[index], stages[next]] = [stages[next], stages[index]];
      for (const [order, stage] of stages.entries())
        await tx.marketingProgram.update({
          where: { id: stage.row.id, organisationId: session.organisationId },
          data: { definition: { ...stage.data, order } },
        });
      await audit(tx, session, map.id, "stage_moved", id);
    },
    { isolationLevel: "Serializable" },
  );
  refresh();
}
export async function editJourneyTouch(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "marketing.program.manage");
  await requireMarketing(session);
  await db.$transaction(
    async (tx) => {
      const map = await mapForEdit(tx, session, form),
        id = text(form, "id", 100);
      const row = await tx.marketingProgram.findFirstOrThrow({
        where: {
          id,
          organisationId: session.organisationId,
          kind: "JOURNEY_TOUCH",
        },
      });
      if (journeyTouchSchema.parse(row.definition).journeyId !== map.id)
        throw new JourneyInputError(
          "This touchpoint belongs to another journey.",
        );
      if (form.get("remove") === "yes") {
        await tx.marketingProgram.update({
          where: { id, organisationId: session.organisationId },
          data: { status: "ARCHIVED" },
        });
        await audit(tx, session, map.id, "touch_archived", id);
        return;
      }
      const stageId = text(form, "stageId", 100),
        stage = await tx.marketingProgram.findFirstOrThrow({
          where: {
            id: stageId,
            organisationId: session.organisationId,
            kind: "JOURNEY_STAGE",
          },
        });
      if (journeyStageSchema.parse(stage.definition).journeyId !== map.id)
        throw new JourneyInputError("Choose a stage in this journey.");
      const name = text(form, "name", 250);
      if (!name) throw new JourneyInputError("Name this touchpoint.");
      const definition = journeyTouchSchema.parse({
        journeyId: map.id,
        stageId,
        channel: text(form, "channel"),
        moment: text(form, "moment", 500),
        owner: text(form, "owner", 250),
      });
      await tx.marketingProgram.update({
        where: { id, organisationId: session.organisationId },
        data: { name, definition },
      });
      await audit(tx, session, map.id, "touch_updated", id);
    },
    { isolationLevel: "Serializable" },
  );
  refresh();
}
export async function saveJourneyPath(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "marketing.program.manage");
  await requireMarketing(session);
  await db.$transaction(
    async (tx) => {
      const map = await mapForEdit(tx, session, form),
        id = text(form, "id", 100);
      if (id && form.get("remove") === "yes") {
        const row = await tx.marketingProgram.findFirstOrThrow({
          where: {
            id,
            organisationId: session.organisationId,
            kind: "JOURNEY_PATH",
          },
        });
        if (journeyPathSchema.parse(row.definition).journeyId !== map.id)
          throw new JourneyInputError("This path belongs to another journey.");
        await tx.marketingProgram.update({
          where: { id, organisationId: session.organisationId },
          data: { status: "ARCHIVED" },
        });
        await audit(tx, session, map.id, "path_archived", id);
        return;
      }
      const definition = journeyPathSchema.parse({
        journeyId: map.id,
        fromStageId: text(form, "fromStageId", 100),
        toStageId: text(form, "toStageId", 100),
        label: text(form, "label", 150),
        kind: text(form, "kind"),
      });
      const stages = await tx.marketingProgram.findMany({
        where: {
          organisationId: session.organisationId,
          kind: "JOURNEY_STAGE",
          id: { in: [definition.fromStageId, definition.toStageId] },
        },
      });
      if (
        stages.length !== 2 ||
        stages.some(
          (stage) =>
            journeyStageSchema.parse(stage.definition).journeyId !== map.id,
        )
      )
        throw new JourneyInputError("Connect stages from this journey only.");
      const duplicate = await tx.marketingProgram.findFirst({
        where: {
          organisationId: session.organisationId,
          kind: "JOURNEY_PATH",
          status: { not: "ARCHIVED" },
          AND: [
            { definition: { path: ["journeyId"], equals: map.id } },
            {
              definition: {
                path: ["fromStageId"],
                equals: definition.fromStageId,
              },
            },
            {
              definition: { path: ["toStageId"], equals: definition.toStageId },
            },
            { definition: { path: ["label"], equals: definition.label } },
          ],
        },
      });
      if (duplicate)
        throw new JourneyInputError("This path is already on the map.");
      const row = await tx.marketingProgram.create({
        data: {
          organisationId: session.organisationId,
          name: definition.label,
          kind: "JOURNEY_PATH",
          definition,
          campaignId: map.campaignId,
          ownerUserId: session.userId,
        },
      });
      await audit(tx, session, map.id, "path_created", row.id);
    },
    { isolationLevel: "Serializable" },
  );
  refresh();
}

async function feedback(action: () => Promise<void>) {
  try {
    await action();
    return {};
  } catch (error) {
    if (error instanceof JourneyInputError) return { error: error.message };
    if (error instanceof ZodError)
      return {
        error: "Check the stage, touchpoint or path fields before saving.",
      };
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      error.code === "P2034"
    )
      return {
        error: "This journey changed while saving. Refresh and try again.",
      };
    throw error;
  }
}

export async function editJourneyStageForm(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "marketing.program.manage");
  return feedback(() => editJourneyStage(form));
}

export async function moveJourneyStageForm(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "marketing.program.manage");
  return feedback(() => moveJourneyStage(form));
}

export async function editJourneyTouchForm(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "marketing.program.manage");
  return feedback(() => editJourneyTouch(form));
}

export async function saveJourneyPathForm(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "marketing.program.manage");
  return feedback(() => saveJourneyPath(form));
}
