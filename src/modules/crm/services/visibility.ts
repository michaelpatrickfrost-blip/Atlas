import { can } from "@/core/permissions/check";
import { SALES_CAPABILITIES } from "@/core/permissions/capabilities";
import type { Session } from "@/core/auth/session";

/** `sales_manager` carries `pipelineManage`; `sales_rep` does not (see
 *  capabilities.ts). A rep sees only their own prospects/deals; a manager
 *  sees everyone's. Returns the ownerUserId to force onto a query, or
 *  undefined when the session is allowed to see all owners. */
export function ownerRestriction(session: Session): string | undefined {
  return can(session, SALES_CAPABILITIES.pipelineManage) ? undefined : session.userId;
}

export function crmSeesAllPipeline(session: Session): boolean {
  return can(session, SALES_CAPABILITIES.pipelineManage);
}
