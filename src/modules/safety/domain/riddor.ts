/** UK RIDDOR decision assistance. Versioned localisation data, not a legal determination
 *  and not a submission to the regulator. */

export const UK_RIDDOR_LOCALISATION = {
  version: "GB-RIDDOR-2013-atlas-1",
  jurisdiction: "GB",
  effectiveFrom: "2013-10-01",
  reviewDate: "2027-04-06",
  source: "Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013. Atlas helps a responsible person review the event. Atlas does not decide that an incident is reportable and does not submit a report to the Health and Safety Executive.",
};

const POTENTIAL: Record<string, { category: string; reminder: string }> = {
  FATAL: { category: "Death", reminder: "Where a death may be reportable, the responsible person reviews it without delay. The configured reminder is 10 days from the event." },
  SPECIFIED_INJURY: { category: "Specified injury", reminder: "A specified injury may need a report within 10 days. A person must confirm that before anyone treats it as reportable." },
  OVER_SEVEN_DAY: { category: "Over-seven-day incapacitation", reminder: "Incapacity over seven days may need a report within 15 days. Confirm the absence and the work connection first." },
  DISEASE: { category: "Reportable occupational disease", reminder: "An occupational disease may be reportable once a diagnosis is received. Atlas does not diagnose." },
  DANGEROUS_OCCURRENCE: { category: "Dangerous occurrence", reminder: "A listed dangerous occurrence may need a report within 10 days. Match it to the current list before deciding." },
  NON_WORKER: { category: "Relevant non-worker incident", reminder: "An injury to a person who is not at work may be reportable where they are taken to hospital. Confirm the circumstances." },
  GAS: { category: "Gas event", reminder: "A gas incident may have its own reporting route. Confirm whether this event is in scope before acting." },
};

export function assistRiddor(input: { workRelated: boolean | null; personClass: string | null; outcome: string | null }): {
  potentialCategory: string | null;
  reminder: string | null;
  requiresResponsibleReview: true;
  guidance: string;
  ruleVersion: string;
} {
  const rule = input.outcome ? POTENTIAL[input.outcome] : undefined;
  const personRule = input.personClass === "NON_WORKER" && input.outcome && input.outcome !== "NONE" ? POTENTIAL.NON_WORKER : undefined;
  const chosen = personRule ?? rule ?? null;
  return {
    potentialCategory: input.workRelated === false ? null : chosen?.category ?? null,
    reminder: input.workRelated === false ? null : chosen?.reminder ?? null,
    requiresResponsibleReview: true,
    guidance: input.workRelated === false
      ? "The event is marked not work-related. A responsible person still records why it is not reportable. Atlas has not decided."
      : "This is a possible category for review. It is not a decision that the incident is reportable.",
    ruleVersion: UK_RIDDOR_LOCALISATION.version,
  };
}

export function riddorDecisionComplete(input: { decision: string; rationale: string }): { ok: boolean; reason?: string } {
  if (input.decision !== "REPORTABLE" && input.decision !== "NOT_REPORTABLE") return { ok: false, reason: "Mark the event reportable or not reportable." };
  if (input.rationale.trim().length < 8) return { ok: false, reason: "Record the reason for the decision." };
  return { ok: true };
}
