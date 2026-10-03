/** Default checklists created automatically when an employee starts onboarding
 *  or offboarding begins. Organisations can add/edit/remove individual tasks
 *  afterwards — these are a sensible starting point, not a fixed policy. */

export const ONBOARDING_TASK_TEMPLATE: Array<{ title: string; category: string }> = [
  { title: "Send offer letter and contract for signature", category: "Documentation" },
  { title: "Right to work check", category: "Compliance" },
  { title: "Collect bank details and emergency contact", category: "Documentation" },
  { title: "Set up payroll record", category: "Payroll" },
  { title: "Create IT accounts and equipment", category: "IT" },
  { title: "Add to building/systems access", category: "IT" },
  { title: "Schedule induction and welcome session", category: "Induction" },
  { title: "Assign workstation and desk", category: "Facilities" },
  { title: "Enrol on mandatory training", category: "Training" },
  { title: "Schedule 30-day probation check-in", category: "Induction" },
];

export const OFFBOARDING_TASK_TEMPLATE: Array<{ title: string; category: string }> = [
  { title: "Confirm leaving date and notice period", category: "Documentation" },
  { title: "Schedule exit interview", category: "Induction" },
  { title: "Revoke IT accounts and equipment", category: "IT" },
  { title: "Revoke building/systems access", category: "IT" },
  { title: "Return equipment and company property", category: "Facilities" },
  { title: "Final payroll run and holiday pay settlement", category: "Payroll" },
  { title: "Issue P45 / leaver documentation", category: "Documentation" },
  { title: "Reassign ongoing work and handover notes", category: "Handover" },
];
