export const NCR_SOURCES = ["INCOMING", "MANUFACTURING", "FINAL", "WAREHOUSE", "CUSTOMER", "SUPPLIER", "AUDIT", "OTHER"] as const;
export const NCR_SEVERITIES = ["MINOR", "MAJOR", "CRITICAL"] as const;
export const NCR_STATUSES = ["OPEN", "CONTAINED", "INVESTIGATING", "DISPOSITIONED", "CLOSED"] as const;
export const NCR_DISPOSITIONS = ["PENDING", "USE_AS_IS", "REWORK", "SCRAP", "RETURN_TO_SUPPLIER", "CONCESSION", "SORT"] as const;
export const ACTION_STATUSES = ["OPEN", "DONE", "VERIFIED", "INEFFECTIVE"] as const;
export const CHECK_METHODS = ["MEASUREMENT", "PASS_FAIL", "VISUAL", "CHECKLIST"] as const;
export const CONTROL_TRIGGERS = ["RECEIPT", "PRODUCTION", "FINAL", "DISPATCH", "RETURN", "MANUAL"] as const;
export const SPEC_STATUSES = ["DRAFT", "EFFECTIVE", "SUPERSEDED"] as const;

export function label(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");
}

/** Closure is a review of disposition, investigation and every recorded action. Holds remain independent. */
export function canClose(ncr: { severity: string; disposition: string; status: string; rootCauseConfirmed?: boolean; actions?: {status:string}[] }): { ok: boolean; reason?: string } {
 if(ncr.status==="CLOSED")return {ok:false,reason:"Already closed."};
 if(ncr.disposition==="PENDING")return {ok:false,reason:"Record a disposition before closing."};
 if(["MAJOR","CRITICAL"].includes(ncr.severity)&&!ncr.rootCauseConfirmed)return {ok:false,reason:"Confirm the root cause for a major or critical issue before closing."};
 if(ncr.actions?.some(action=>action.status!=="VERIFIED"))return {ok:false,reason:"Verify every corrective action; unresolved or ineffective actions prevent closure."};
 if(["MAJOR","CRITICAL"].includes(ncr.severity)&&!ncr.actions?.length)return {ok:false,reason:"Record and verify corrective action for a major or critical issue."};
 return {ok:true};
}

/** Evaluate a measured value against a characteristic's limits. Non-numeric methods fall back to the recorded pass flag. */
export function evaluateMeasurement(method: string, value: number | null, lowerLimit: number | null, upperLimit: number | null, recordedPass: boolean): boolean {
  if (method !== "MEASUREMENT") return recordedPass;
  if(value===null||!Number.isFinite(value))return false;
  if (lowerLimit !== null && value < lowerLimit) return false;
  if (upperLimit !== null && value > upperLimit) return false;
  return true;
}
