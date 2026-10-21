"use server";

import { z } from "zod";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { saveTemplateInTransaction } from "@/core/templates/authoring";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveStudioDocument(business: string | undefined, form: FormData) {
  const actor = await requireSession();
  assertCapability(actor, CAP.edit);
  const target = z.string().min(1).max(100).optional().parse(business);
  const saved = await withStudioAuthoringAuthority(actor, CAP.edit, target, authority => saveTemplateInTransaction(authority.session, authority.transaction, form));
  revalidatePath("/design-studio", "layout"); revalidatePath("/templates"); revalidatePath("/crm/contracts");
  redirect(`/design-studio/documents/${saved.id}${target ? `?business=${encodeURIComponent(target)}` : ""}`);
}
