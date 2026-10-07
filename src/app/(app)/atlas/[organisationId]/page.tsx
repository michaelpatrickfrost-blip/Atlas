import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability, can } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { getImplementedModules } from "@/core/modules/registry";
import { PortalActionForm as ActionForm } from "@/app/(app)/atlas/portal-action-form";
import { updateCompanyAccount, saveCompanyEntitlements, deleteTestCompany } from "../actions";
import { saveAtlasCompanyProfile, openCompanyWorkspace } from "../admin-actions";
import { ConsoleNav } from "../console-nav";
import { readCompanyProfile, COMPANY_TIMEZONES, FISCAL_MONTHS } from "@/core/setup/company-profile";

const input = "mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm";
const panel = "rounded-2xl border border-slate-200 bg-white p-6";
export default async function CompanyAccount({ params }: { params: Promise<{ organisationId: string }> }) {
  const session = await requireSession();
  assertCapability(session, "atlas.companies.manage");
  const { organisationId } = await params;
  const org = await db.organisation.findFirst({ where: { id: organisationId, kind: "CUSTOMER" }, include: { moduleStates: true, _count: { select: { memberships: true, parties: true, products: true, employees: true } } } });
  if (!org) notFound();
  const profile = readCompanyProfile(org.companyProfile);
  return <div className="space-y-6">
    <ConsoleNav organisationId={org.id} current="account" />
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-3xl font-semibold tracking-tight">{org.name}</h2><p className="mt-2 text-sm text-slate-500">{org._count.memberships} users · {org._count.parties} customers · {org._count.products} products · {org._count.employees} employees{org.isTest ? " · Test company" : ""}</p></div><div className="flex flex-wrap gap-3"><Link href={`/atlas/${org.id}/users`} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">Manage users</Link>{org.status === "ACTIVE" && <form action={openCompanyWorkspace}><input type="hidden" name="organisationId" value={org.id} /><button className="rounded-xl bg-blue-600 px-4 py-3 text-sm text-white">Open company workspace →</button></form>}</div></div>
    {org.archivedAt ? <section className={panel}><h3 className="font-semibold">Archived {org.archivedAt.toLocaleDateString("en-GB")}</h3><p className="mt-3 text-sm text-slate-500">{org.archiveReason}</p><Link href={`/atlas/${org.id}/offboarding`} className="mt-4 inline-block text-sm text-blue-700">Export records or restore account →</Link></section> : <div className="grid items-start gap-6 lg:grid-cols-2">
      <div className="space-y-6"><section className={panel}><h3 className="mb-5 font-semibold">Account & subscription</h3><ActionForm action={updateCompanyAccount} label="Save account">
        <input type="hidden" name="organisationId" value={org.id} />{org.isTest && <input type="hidden" name="isTest" value="on" />}
        <label className="block text-xs">Company name<input required name="name" maxLength={150} defaultValue={org.name} className={input} /></label>
        <label className="block text-xs">Account access<select name="status" defaultValue={org.status} className={input}><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended — block company sign-in</option></select></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="block text-xs">Subscription<select name="subscriptionStatus" defaultValue={org.subscriptionStatus} className={input}>{["TRIAL", "ACTIVE", "PAST_DUE", "CANCELLED"].map(status => <option key={status}>{status}</option>)}</select></label><label className="block text-xs">Plan name<input required name="planName" maxLength={100} defaultValue={org.planName} className={input} /></label></div>
        <label className="block text-xs">Trial ends<input name="trialEndsAt" type="date" defaultValue={org.trialEndsAt?.toISOString().slice(0, 10)} className={input} /></label>
        <p className="text-xs text-slate-500">Subscription status is an administration record. Charging and automatic expiry are not configured.</p>
      </ActionForm></section>
      <section className={panel}><h3 className="mb-5 font-semibold">Registered company profile</h3><ActionForm action={saveAtlasCompanyProfile} label="Save profile"><input type="hidden" name="organisationId" value={org.id} /><div className="grid gap-4 sm:grid-cols-2">{[["legalName", "Legal name"], ["registrationNumber", "Company number"], ["vatNumber", "VAT number"], ["addressLine1", "Registered address"], ["city", "City"], ["postcode", "Postcode"], ["country", "Country code (GB, IE…)"], ["defaultCurrency", "Currency (GBP, EUR…)"]].map(([key, label]) => <label key={key} className="text-xs">{label}<input name={key} defaultValue={String(profile[key as keyof typeof profile])} maxLength={key === "country" ? 2 : key === "defaultCurrency" ? 3 : 200} className={input} /></label>)}<label className="text-xs">Time zone<select name="timezone" defaultValue={profile.timezone} className={input}>{COMPANY_TIMEZONES.map(zone => <option key={zone}>{zone}</option>)}</select></label><label className="text-xs">Financial year starts<select name="fiscalYearStartMonth" defaultValue={profile.fiscalYearStartMonth} className={input}>{FISCAL_MONTHS.map((month, i) => <option key={month} value={i + 1}>{month}</option>)}</select></label><label className="text-xs">Language<select name="locale" defaultValue={profile.locale} className={input}><option value="en-GB">English (UK)</option><option value="en-US">English (US)</option></select></label></div></ActionForm></section></div>
      <section className={panel}><h3 className="font-semibold">App entitlements</h3><p className="mb-5 mt-2 text-xs text-slate-500">Controls the apps the company may enable. Users still need permission to open each app. Removing an app preserves its records.</p><ActionForm action={saveCompanyEntitlements} label="Save entitlements"><input type="hidden" name="organisationId" value={org.id} />{getImplementedModules().map(module => <label key={module.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm"><input type="checkbox" name="moduleId" value={module.id} defaultChecked={org.moduleStates.some(state => state.moduleId === module.id && state.entitled)} /><span className="flex-1">{module.name}</span><span className="text-[10px] text-slate-500">{org.moduleStates.some(state => state.moduleId === module.id && state.enabled) ? "Enabled" : "Disabled"}</span></label>)}</ActionForm></section>
    </div>}
    {org.isTest && can(session, "atlas.companies.archive") && <details className="rounded-2xl border border-rose-200 bg-rose-50 p-6"><summary className="cursor-pointer text-sm font-semibold text-rose-900">Delete disposable test company</summary><p className="my-4 text-xs text-rose-800">Permanently deletes all test records including finance. Type the company name to confirm. Real companies use Archive & export.</p><ActionForm action={deleteTestCompany} label="Delete permanently"><input type="hidden" name="organisationId" value={org.id} /><label className="block text-xs">Company name<input required name="confirmName" autoComplete="off" placeholder={org.name} className={input} /></label></ActionForm></details>}
  </div>;
}
