"use server";

import { z } from "zod";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { compareCurrentPageDraftInTransaction } from "@/core/studio/authoring/page-comparison";

/** Read-only recovery; selected business and current rights are server-owned.
 * This action does not revalidate routes, save a draft or approve publication. */
export async function compareSavedVisualScreen(business: string | undefined, input: unknown) {
  const actor = await requireSession();
  assertCapability(actor, CAP.read);
  const selectedBusiness = z.string().min(1).max(100).optional().parse(business);
  return withStudioAuthoringAuthority(actor, CAP.read, selectedBusiness,
    authority => compareCurrentPageDraftInTransaction(authority, input, selectedBusiness === undefined ? {} : { business: selectedBusiness }));
}
