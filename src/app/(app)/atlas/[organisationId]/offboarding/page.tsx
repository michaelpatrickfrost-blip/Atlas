import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { PortalActionForm as ActionForm } from "@/app/(app)/atlas/portal-action-form";
import { archiveAtlasCompany } from "../../admin-actions";
import { CompanyExportForm } from "../../export-form";
import { ConsoleNav } from "../../console-nav";
const input = "mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm";
export default async function Offboarding({ params }: { params: Promise<{ organisationId: string }> }) {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.archive");
  const { organisationId } = await params;
  const org = await db.organisation.findFirst({ where: { id: organisationId, kind: "CUSTOMER" } });
  if (!org) notFound();
  return <div className="space-y-6"><ConsoleNav organisationId={org.id} current="offboarding" /><div><h2 className="text-2xl font-semibold tracking-tight">Archive & export</h2><p className="mt-2 text-sm text-slate-500">{org.name} · Preserve the records and provide a complete company handover.</p></div><div className="grid items-start gap-6 lg:grid-cols-2">
    <section className="rounded-2xl border border-slate-200 bg-white p-6"><h3 className="font-semibold">Download company data</h3><p className="my-4 text-sm leading-relaxed text-slate-500">One compressed NDJSON file containing company records, linked child records, audit history and stored documents across all apps. A manifest records table counts and exclusions. Database document bytes are encoded as hex; server attachments as base64.</p><p className="mb-5 text-xs leading-relaxed text-slate-500">Includes sensitive HR, financial and customer records. Authentication secrets and service credentials are excluded. External document links remain links. Exports up to 250 MB are supported here; larger accounts require a managed export. The file is generated on demand and kept off server disk.</p><CompanyExportForm organisationId={org.id} name={org.name} /></section>
    <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6"><h3 className="font-semibold">{org.archivedAt ? "Restore archived company" : "Archive company"}</h3>{org.archivedAt ? <><p className="my-4 text-sm text-slate-600">Archived {org.archivedAt.toLocaleString("en-GB")}. Reason: {org.archiveReason}</p><p className="mb-5 text-xs text-slate-600">Restoring keeps sign-in suspended. Review the account, then set Account access to Active. Previous sessions and recovery codes stay revoked.</p></> : <p className="my-4 text-sm leading-relaxed text-slate-600">Blocks company sign-in and revokes all sessions and unused setup/recovery codes. Records, documents and history remain intact and available for export. Archive before exporting to stop further customer edits.</p>}
      {org.id === session.organisationId ? <p className="rounded-xl bg-white p-4 text-sm text-amber-800">Open another company workspace before archiving this one.</p> : <ActionForm action={archiveAtlasCompany} label={org.archivedAt ? "Restore to suspended" : "Archive company"}><input type="hidden" name="organisationId" value={org.id} /><input type="hidden" name="mode" value={org.archivedAt ? "restore" : "archive"} />{!org.archivedAt && <label className="block text-xs">Reason for archive<textarea name="reason" required maxLength={1000} rows={3} className={input} /></label>}<label className="block text-xs">Type company name to confirm<input name="confirmName" required autoComplete="off" placeholder={org.name} className={input} /></label><label className="block text-xs">Your administrator password<input name="currentPassword" type="password" required autoComplete="current-password" className={input} /></label></ActionForm>}
    </section></div></div>;
}
