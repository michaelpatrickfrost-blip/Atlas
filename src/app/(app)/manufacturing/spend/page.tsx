import Link from "next/link";
import { Wallet, ArrowUpRight } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { assertModuleEnabled } from "@/core/modules/access";
import { getModule } from "@/core/modules/registry";
import { money } from "@/modules/finance/domain/money";
import { DataTable } from "@/components/ui/table";
import { spendRequestSchema } from "@/modules/finance/services/supply-spend";
import type { SupplySpendRequest } from "@/core/supply/types";

export default async function SupplySpend({ searchParams }: { searchParams: Promise<{ entity?: string; start?: string; end?: string; group?: string }> }) {
  const session = await requireSession();
  assertCapability(session, "finance.report.read");
  assertCapability(session, "finance.overview.read");
  await assertModuleEnabled(session, "finance");
  const query = await searchParams;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/London" });
  const groups = ["supplier", "category", "costCentre", "site", "month"] as const;
  const group = groups.includes(query.group as SupplySpendRequest["group"]) ? query.group as SupplySpendRequest["group"] : "supplier";
  const request = { entity: query.entity, start: query.start || `${today.slice(0, 7)}-01`, end: query.end || today, group };
  if (!spendRequestSchema.safeParse(request).success) return <div className="rounded-2xl border border-amber-200 bg-white p-6"><h2 className="text-xl font-semibold">Supply spend report</h2><p role="alert" className="mt-3 text-sm text-amber-700">Choose valid reporting dates, with the end date on or after the start date.</p><Link href="/manufacturing/spend" className="mt-4 inline-block text-sm font-semibold text-blue-600">Reset reporting dates →</Link></div>;
  const provider = getModule("finance")?.supplySpendProvider;
  if (!provider) throw new Error("Finance spend reporting is unavailable.");
  const report = await provider(session, request);
  const display = (amount: string | null, currency: string) => amount === null ? "Restricted" : money(BigInt(amount), currency);
  const input = "mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800";
  return <div className="space-y-6">
    <header className="rounded-[24px] border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6"><div className="flex items-center gap-3"><Wallet className="text-blue-600" size={24} /><h2 className="text-2xl font-semibold tracking-tight">Supply spend report</h2></div><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">Review supplier spend and purchase commitments alongside the manufacturing operation. Drill into the original financial document to follow its purchase, receipt and invoice history.</p></header>
    <form className="grid items-end gap-3 rounded-[22px] border border-slate-200 bg-white p-5 sm:grid-cols-2 xl:grid-cols-5"><label className="text-xs text-slate-500">Legal entity<select name="entity" defaultValue={report.entity?.id} className={input}>{report.entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}</select></label><label className="text-xs text-slate-500">From<input type="date" name="start" defaultValue={report.start} required className={input} /></label><label className="text-xs text-slate-500">Through<input type="date" name="end" defaultValue={report.end} required className={input} /></label><label className="text-xs text-slate-500">Break down by<select name="group" defaultValue={group} className={input}>{groups.map((value) => <option key={value} value={value}>{value === "costCentre" ? "Cost centre" : value.charAt(0).toUpperCase() + value.slice(1)}</option>)}</select></label><button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Update report</button></form>
    {report.totals.map((row) => <section key={row.currency} aria-label={`${row.currency} spend`}><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{row.currency} · {report.entity?.name}</p><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Posted supplier spend · net", row.postedNet, "Supplier invoices less credits, plus debit adjustments in this period."],
      ["Uninvoiced commitments · net", row.committedNet, "Approved purchase orders through the end date, less linked posted invoices."],
      ["Accepted receipts · net", row.receivedNet, "Posted goods receipts in this period; separate from supplier spend."],
      ["Current open payables · gross", row.openPayables, "Current supplier documents still unsettled, including VAT and credits."],
    ].map(([label, amount, note]) => <div className="rounded-[22px] border border-slate-200 bg-white p-5" key={label}><p className="text-xs text-slate-500">{label}</p><p className="mt-3 break-words text-2xl font-semibold tracking-tight text-slate-900">{display(amount, row.currency)}</p><p className="mt-2 text-xs leading-5 text-slate-400">{note}</p></div>)}</div></section>)}
    <section><h3 className="mb-3 text-base font-semibold">Posted spend by {group === "costCentre" ? "cost centre" : group}</h3><DataTable rows={report.groups.map((row) => ({ ...row, id: JSON.stringify([row.label, row.currency]) }))} emptyLabel="No authorised posted supplier spend in this period." columns={[{ header: "Group", render: (row) => row.label }, { header: "Currency", render: (row) => row.currency }, { header: "Documents", align: "right", render: (row) => row.documents }, { header: "Net spend", align: "right", render: (row) => money(BigInt(row.net), row.currency) }]} /></section>
    <section><h3 className="mb-3 text-base font-semibold">Source supplier documents</h3><DataTable rows={report.documents} emptyLabel="Posted invoices, credits and debit adjustments will appear here." columns={[{ header: "Document", render: (row) => <Link className="font-semibold text-blue-600" href={`/finance/documents/${row.id}`}>{row.reference}</Link> }, { header: "Supplier", render: (row) => row.supplier }, { header: "Type", render: (row) => row.kind.replace("AP_", "").replaceAll("_", " ") }, { header: "Accounting date", render: (row) => row.date }, { header: "Net", align: "right", render: (row) => money(BigInt(row.net), row.currency) }]} /></section>
    <div className="flex flex-wrap gap-2">{[["Purchase orders & receipts", "/finance/purchases", "finance.purchase.read"], ["Supplier invoices", "/finance/payables", "finance.payables.read"], ["Finance reports", "/finance/reporting", "finance.report.read"]].filter(([, , cap]) => session.capabilities.has(cap)).map(([label, href]) => <Link key={href} href={href} className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">{label}<ArrowUpRight size={14} /></Link>)}</div>
    <details className="rounded-2xl border border-slate-200 bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-slate-600">Report basis and coverage</summary><ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-slate-500">{report.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>
  </div>;
}
