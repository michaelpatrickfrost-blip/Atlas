/** Plain-language explanations of native permissions. No authorisation rules live here. */
const sections: Record<string, string> = {
  "finance.overview": "Workspace entry",
  "finance.receivables": "Invoices & customer balances",
  "finance.payables": "Supplier invoices & balances",
  "finance.purchase": "Purchase orders & goods receipts",
  "finance.request": "Procurement requests",
  "finance.spend": "Requests & expenses visibility",
  "finance.bank": "Bank accounts & details",
  "finance.payment": "Payments & payment approval",
  "finance.approval": "Financial approvals",
  "finance.ledger": "General ledger",
  "finance.journal": "Accounting journals",
  "customers.bank": "Customer bank details",
  "customers.restricted_notes": "Private customer notes",
  "core.users": "User accounts & passwords",
  "core.roles": "Access profiles",
  "core.modules": "Company settings & apps",
};
const descriptions: Record<string, string> = {
  "finance.overview.read":
    "Open Finance. Figures and records still require their own section permissions; this does not grant banking access.",
  "finance.receivables.read":
    "View customer invoices, credit notes and outstanding customer balances.",
  "finance.receivables.manage":
    "Create and change customer financial documents. Posting and approvals retain their own rules.",
  "finance.request.create":
    "Raise a procurement request and view your own requests. Purchasing, approval and banking are separate.",
  "finance.spend.read":
    "View company procurement requests and expenses, subject to project access.",
  "finance.purchase.read": "View purchase orders and goods receipts.",
  "finance.purchase.manage":
    "Create and manage purchase orders and goods receipts.",
  "finance.bank.read": "View banking and reconciliation records.",
  "finance.bank.reveal":
    "Reveal protected supplier bank details. This is sensitive access.",
  "finance.bank.manage":
    "Manage bank accounts, statement imports and bank-change requests.",
  "finance.bank.verify":
    "Independently verify supplier bank details under Finance approval rules.",
  "customers.bank.read":
    "View masked customer bank details; full account values remain hidden.",
  "customers.bank.reveal":
    "Reveal full customer bank details. This is sensitive access.",
  "customers.bank.manage":
    "Change customer bank details; revealing existing protected values is separate.",
  "core.users.manage":
    "Edit company user details, assign or reset passwords, suspend accounts and revoke sessions.",
  "core.roles.manage":
    "Create and edit reusable company profiles. User assignment also needs user administration.",
};
export function accessSectionName(id: string, fallback: string) {
  return sections[id] ?? fallback;
}
export function permissionDescription(cap: string, sectionName: string) {
  if (descriptions[cap]) return descriptions[cap];
  const action = cap.split(".").at(-1)?.replaceAll("_", " ") ?? "use";
  if (["read", "view"].includes(action))
    return `View ${sectionName.toLowerCase()} within the user's authorised records.`;
  if (action === "self")
    return `Use your own ${sectionName.toLowerCase()} records.`;
  if (action === "manage")
    return `Create and update ${sectionName.toLowerCase()} within the app's existing rules.`;
  return `${action.charAt(0).toUpperCase() + action.slice(1)} ${sectionName.toLowerCase()}. Existing ownership, approval and company rules apply.`;
}
