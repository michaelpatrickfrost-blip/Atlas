import Link from "next/link";
import { ArrowLeft, ArrowUpRight, ListChecks, Plus, Tags, TextCursorInput } from "lucide-react";
import { requireSession } from "@/core/auth/session";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { getSetupCatalogInTransaction } from "@/core/studio/authoring/configuration";
import { ActionForm } from "@/components/ui/action-form";
import { AdditionalFieldSetup } from "@/components/studio/additional-field-setup";
import { createBusinessSetup } from "./actions";
import { RecordSetupChoices, SetupIdentity, SetupName } from "./choices";

export default async function BusinessSetup({ searchParams }: { searchParams: Promise<{ business?: string }> }) {
  const actor = await requireSession(), business = (await searchParams).business;
  const setup = await withStudioAuthoringAuthority(actor, CAP.read, business, async authority => ({
    ...await getSetupCatalogInTransaction(authority, business === undefined ? {} : { business }), name: authority.session.organisationName,
    canEdit: authority.session.capabilities.has(CAP.edit),
  }));
  const suffix = business ? `?business=${encodeURIComponent(business)}` : "";
  const fields = setup.groups.find(group => group.kind === "customField")?.definitions ?? [];
  const bases = setup.groups.find(group => group.kind === "entityProfile")?.definitions ?? [];
  const types = setup.groups.find(group => group.kind === "recordType")?.definitions ?? [];
  const requiredChoices = fields.filter(field => field.activeVersionId && field.presentationEditable).map(field => ({ id: field.id, name: field.name, ...field.navigation }));
  const groups = [{ title: "Additional fields", text: "The extra details this business needs on its tickets.", icon: TextCursorInput, items: fields },
    { title: "Base record setup", text: "The standard screen and required details for your business.", icon: ListChecks, items: bases },
    { title: "Record types", text: "Special setups for different kinds of ticket, built on your base.", icon: Tags, items: types }];
  return <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 md:px-10 md:py-12">
    <header><Link href={`/design-studio${suffix}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><ArrowLeft className="h-4 w-4"/>Back to Studio</Link>
      <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Business setup · {setup.name}</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Make the details work for your team.</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">Add useful ticket details and choose the screens and rules your business needs. Save a draft, review it, then make it live.</p>
    </header>
    <div className="grid gap-5 lg:grid-cols-3">{groups.map(({ title, text, icon: Icon, items }) => <section key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <Icon className="h-6 w-6 text-blue-600"/><h2 className="mt-4 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
      <div className="mt-5 grid gap-3">{items.map(item => <Link key={item.id} href={`/design-studio/setup/${item.id}${suffix}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50/40">
        <span><strong className="text-sm">{item.name}</strong><span className="mt-1 block text-xs text-slate-500">{item.activeVersionId ? "Live · edit a draft" : "Draft"}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400"/>
      </Link>)}{!items.length && <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">No {title.toLowerCase()} yet.</p>}</div>
    </section>)}</div>
    {setup.canEdit && <div className="grid items-start gap-5 lg:grid-cols-3">
      <section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="mb-5 flex items-center gap-2 text-lg font-semibold"><Plus className="h-5 w-5 text-blue-600"/>Add a field</h2>
        <ActionForm action={createBusinessSetup} label="Create field draft"><SetupIdentity business={business} kind="field"/>
          <AdditionalFieldSetup fieldTypes={setup.fieldTypes} referenceTargets={setup.referenceTargets}/>
          <p className="text-xs leading-5 text-slate-500">New fields start optional. Your business can choose which details are required in its record setup.</p>
        </ActionForm>
      </section>
      {!bases.length && <section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="mb-5 text-lg font-semibold">Create base record setup</h2>
        <ActionForm action={createBusinessSetup} label="Create base draft"><SetupIdentity business={business} kind="base"/>
          <RecordSetupChoices pages={setup.pages} fields={requiredChoices}/>
        </ActionForm>
      </section>}
      <section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="mb-5 text-lg font-semibold">Add a record type</h2>
        {bases.some(base => base.activeVersionId) ? <ActionForm action={createBusinessSetup} label="Create record type draft"><SetupIdentity business={business} kind="type"/><SetupName/>
          <RecordSetupChoices pages={setup.pages} fields={requiredChoices} inherit references={{ baseProfile: bases.find(base => base.activeVersionId)?.navigation ?? null }}/>
        </ActionForm> : <p className="text-sm leading-6 text-slate-500">Create and make your base setup live first. Each record type then builds on that business setup.</p>}
      </section>
    </div>}
  </div>;
}
