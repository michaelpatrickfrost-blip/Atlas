"use server";

import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { withFieldRuntimeAuthority } from "@/core/studio/fields/runtime-authority";
import { readActiveCustomerPage, prepareVisiblePageActionInTransaction, prepareVisiblePageRecordInTransaction } from "@/core/studio/pages/customer-gateway";
import { salesStudioContract, salesOrderAcknowledgementResultSchema } from "@/modules/sales/services/studio";
import { readRecordDefaultCustomerPage, prepareVisibleRecordDefaultActionInTransaction } from "@/core/studio/pages/record-default";
import { z } from "zod";

export async function loadBusinessScreen(input: unknown) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  return readActiveCustomerPage(session, input);
}

export async function loadRecordBusinessScreen(input: unknown) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  const view = await readRecordDefaultCustomerPage(session, input);
  if (!view) throw new Error("This record no longer has a business layout. Open it in Tickets.");
  return view;
}

export async function openBusinessScreenRecord(input: unknown) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  return withFieldRuntimeAuthority(session, async authority => {
    const prepared = await prepareVisiblePageRecordInTransaction(authority, input);
    if (prepared.anchor.kind !== "record") throw new Error("This business record is unavailable.");
    const destination = prepared.ownerModuleId === "sales" && prepared.entity.id === "sales.order" ? "/sales/orders"
      : prepared.ownerModuleId === "tickets" && prepared.entity.id === "tickets.ticket" ? "/tickets" : null;
    if (!destination) throw new Error("This app has not approved record navigation.");
    return `${destination}/${encodeURIComponent(prepared.anchor.recordId)}`;
  });
}

/** This first approved operation is the existing read-only Sales PDF preview.
 * All binding is server-owned and uses the freshly authorised canonical anchor.
 * Future domain operations require their owning transaction adapter. */
export async function executeBusinessScreenButton(input: unknown) {
  const session = await requireSession();
  assertCapability(session, "core.profile.self");
  return withFieldRuntimeAuthority(session, async authority => {
    const mode = z.object({ mode: z.literal("record_default").optional() }).parse(input).mode;
    const prepared = mode === "record_default" ? await prepareVisibleRecordDefaultActionInTransaction(authority, input)
      : await prepareVisiblePageActionInTransaction(authority, input);
    if (prepared.ownerModuleId !== "sales" || prepared.command.id !== "sales.order.preview_acknowledgement"
      || prepared.command.version !== 1 || prepared.anchor.kind !== "record")
      throw new Error("This app operation is unavailable.");
    const contribution = salesStudioContract.contributions.find(value => value.metadata.id === prepared.command.id
      && value.metadata.version === prepared.command.version);
    if (!contribution?.run) throw new Error("This app operation is unavailable.");
    const result = salesOrderAcknowledgementResultSchema.parse(await contribution.run({ session: prepared.authority.session,
      transaction: prepared.authority.transaction }, { orderId: prepared.anchor.recordId }));
    // The browser receives only the owner's validated result, never authority or
    // configuration approval objects. The native PDF endpoint repeats Read.
    return result;
  });
}
