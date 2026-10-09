import Link from "next/link";
import { Building2, ShieldCheck } from "lucide-react";
import { ActionForm } from "@/components/ui/action-form";
import { COMPANY_ACCESS_AREAS } from "@/core/permissions/company-access";
import { COMPANY_COUNTRIES, COMPANY_CURRENCIES, COMPANY_TIMEZONES, FISCAL_MONTHS, type CompanyProfile } from "@/core/setup/company-profile";
import { saveCompanyAccess, saveCompanyProfile, saveWorkspaceDetails } from "./actions";

const input = "mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm";

export function WorkspacePanel({ company, profile, editCompany }: {
  company: { name: string; allowCustomerCreation: boolean; allowProductCreation: boolean; restrictedAccessAreas: string[] };
  profile: CompanyProfile;
  editCompany: boolean;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <Building2 className="mb-4 text-blue-500" size={23} />
        <h3 className="text-base font-semibold">Registered company</h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">The legal identity used across Atlas. This is the company itself, separate from customer accounts you sell to.</p>
        {editCompany ? (
          <ActionForm action={saveCompanyProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-xs">Legal name<input name="legalName" defaultValue={profile.legalName} maxLength={200} className={input} /></label>
            <label className="text-xs">Trading name<input name="tradingName" defaultValue={profile.tradingName} maxLength={200} className={input} /></label>
            <label className="text-xs">Company number<input name="registrationNumber" defaultValue={profile.registrationNumber} maxLength={40} className={input} /></label>
            <label className="text-xs">VAT number<input name="vatNumber" defaultValue={profile.vatNumber} maxLength={40} className={input} /></label>
            <label className="text-xs">Industry<input name="industry" defaultValue={profile.industry} maxLength={80} className={input} /></label>
            <label className="text-xs">Website<input name="website" defaultValue={profile.website} maxLength={200} placeholder="https://" className={input} /></label>
            <label className="text-xs">Phone<input name="phone" defaultValue={profile.phone} maxLength={40} className={input} /></label>
            <label className="text-xs">Email<input name="email" type="email" defaultValue={profile.email} maxLength={200} className={input} /></label>
            <label className="text-xs sm:col-span-2">Registered address<input name="addressLine1" defaultValue={profile.addressLine1} maxLength={200} className={input} /></label>
            <label className="text-xs">City<input name="city" defaultValue={profile.city} maxLength={80} className={input} /></label>
            <label className="text-xs">Postcode<input name="postcode" defaultValue={profile.postcode} maxLength={20} className={input} /></label>
            <label className="text-xs">Country<select name="country" defaultValue={profile.country} className={input}>{COMPANY_COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select></label>
            <label className="text-xs">Time zone<select name="timezone" defaultValue={profile.timezone} className={input}>{COMPANY_TIMEZONES.map((zone) => <option key={zone}>{zone}</option>)}</select></label>
            <label className="text-xs">Default currency<select name="defaultCurrency" defaultValue={profile.defaultCurrency} className={input}>{COMPANY_CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
            <label className="text-xs">Fiscal year starts<select name="fiscalYearStartMonth" defaultValue={profile.fiscalYearStartMonth} className={input}>{FISCAL_MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
            <label className="text-xs">Language<select name="locale" defaultValue={profile.locale} className={input}><option value="en-GB">English (UK)</option><option value="en-US">English (US)</option></select></label>
            <div className="sm:col-span-2"><button className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs text-white">Save company profile</button></div>
          </ActionForm>
        ) : <p className="mt-4 text-sm text-slate-500">{profile.legalName || company.name}{profile.vatNumber ? ` · VAT ${profile.vatNumber}` : ""}</p>}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-base font-semibold">Trading defaults</h3>
          <p className="mt-2 text-sm text-slate-500">Currency, year end and whether people can create new customers and products from Sales.</p>
          {editCompany ? (
            <ActionForm action={saveWorkspaceDetails} className="mt-5 space-y-4">
              <label className="block text-xs">Workspace name<input name="name" defaultValue={company.name} required maxLength={120} className={input} /></label>
              <p className="text-xs text-slate-400">Default currency {profile.defaultCurrency}. Fiscal year starts in {FISCAL_MONTHS[profile.fiscalYearStartMonth - 1]}. Language {profile.locale}. Set those on the registered company.</p>
              {[{ name: "allowCustomerCreation", label: "Allow new customers", value: company.allowCustomerCreation }, { name: "allowProductCreation", label: "Allow new products", value: company.allowProductCreation }].map((policy) => (
                <label key={policy.name} className="flex items-center justify-between rounded-xl bg-slate-50 p-4 text-xs">{policy.label}<input type="checkbox" name={policy.name} defaultChecked={policy.value} className="size-4 accent-blue-600" /></label>
              ))}
              <p className="text-xs text-slate-500">People also need the matching permission. These switches stop new records from Sales shortcuts.</p>
              <button className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs text-white">Save trading defaults</button>
            </ActionForm>
          ) : <p className="mt-3 text-sm text-slate-500">Your administrator manages company policies.</p>}
          <div className="mt-5 flex flex-wrap gap-4 text-xs text-blue-600">
            {editCompany && <Link href="/apps">Manage enabled modules →</Link>}
            <Link href="/settings/imports">Day-to-day imports →</Link>
          </div>
        </section>
        {editCompany && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <ShieldCheck className="mb-4 text-blue-500" size={23} />
            <h3 className="text-base font-semibold">Workspace access</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">Turning an area off overrides every role and individual permission. Records and audit history stay in place.</p>
            <ActionForm action={saveCompanyAccess} className="mt-5 grid gap-2 sm:grid-cols-2">
              {COMPANY_ACCESS_AREAS.map((area) => (
                <label key={area.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">{area.label}<input type="checkbox" name={`allow_${area.id}`} defaultChecked={!company.restrictedAccessAreas.includes(area.id)} className="size-4 accent-blue-600" /></label>
              ))}
              <div className="sm:col-span-2"><button className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs text-white">Save workspace access</button></div>
            </ActionForm>
          </section>
        )}
      </div>
    </div>
  );
}
