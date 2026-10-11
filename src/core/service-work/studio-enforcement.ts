import { randomUUID } from "node:crypto";
import type { Session } from "@/core/auth/session";
import type { RecordContext } from "@/core/studio/registry/types";
import { closeAffectedFieldWriteWindows } from "@/core/studio/fields/runtime-write-window";
import { validateNativeResultingFieldRequirements } from "@/core/studio/fields/required-runtime";
import { withTicketFieldMutation, type TicketFieldOperation } from "./studio-native";

/** Owning native action boundary. All domain writes/private guards use the
 * current callback identity and remain in the caller's original transaction.
 * Window and all-active field checks run only for actual affected Tickets after
 * all native events/parent changes have completed. No client supplied plan. */
export function withValidatedTicketMutation<T>(context: RecordContext, operation: TicketFieldOperation,
  callback: (currentSession: Session) => Promise<T>): Promise<T> {
  return withTicketFieldMutation(context, operation, callback, async (authority, records, actualOperation, proof) => {
    const metadata = authority.registry.describe("tickets.ticket", 9);
    const entity = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
    await closeAffectedFieldWriteWindows(authority, { entity, operationId: randomUUID(),
      trigger: actualOperation === "tickets.ticket.create" ? "native_record_creation" : "native_record_write" });
    for (const record of records) await validateNativeResultingFieldRequirements(authority,
      { entity, recordId: record.recordId, expectedRevision: record.revision }, actualOperation, proof);
  });
}
