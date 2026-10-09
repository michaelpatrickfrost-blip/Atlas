"use server";
import { withFormFeedback } from "@/core/shared/form-feedback";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { revalidatePath } from "next/cache";
export async function saveProfile(form: FormData) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  return withFormFeedback(async () => {
    const name = String(form.get("name") ?? "").trim();
    if (!name || name.length > 100)
      throw new Error("Enter a name between 1 and 100 characters.");
    await db.$transaction(async (tx) => {
      const before = await tx.user.findUniqueOrThrow({
        where: { id: session.userId },
        select: { name: true },
      });
      await tx.user.update({ where: { id: session.userId }, data: { name } });
      await tx.auditEntry.create({
        data: {
          organisationId: session.organisationId,
          actorUserId: session.userId,
          action: "profile.details.updated",
          entityType: "User",
          entityId: session.userId,
          before,
          after: { name },
        },
      });
    });
    revalidatePath("/", "layout");
  });
}
