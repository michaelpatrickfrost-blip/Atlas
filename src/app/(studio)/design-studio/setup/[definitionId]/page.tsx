import Link from "next/link";
import { ArrowLeft, CheckCircle2, History, Rocket } from "lucide-react";
import { z } from "zod";
import { requireSession } from "@/core/auth/session";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { getSetupCatalogInTransaction, readConfigurationDraftInTransaction } from "@/core/studio/authoring/configuration";
import { versionedFieldPayloadSchema } from "@/core/studio/fields/required-contract";
import { entityProfilePayloadSchema, recordTypePayloadSchema } from "@/core/studio/record-types/schema";
import { ActionForm } from "@/components/ui/action-form";
import { RecordSetupChoices, SetupIdentity, SetupName } from "../choices";
import { saveBusinessSetup, reviewBusinessSetup, goLiveBusinessSetup, restoreBusinessSetup } from "../actions";
import { AdditionalFieldSetup } from "@/components/studio/additional-field-setup";
import { SetupDraftGuard } from "../draft-guard";

const validationSchema = z.object({ validatedRevision: z.number().int().nonnegative(), warnings: z.array(z.string()) });
export default async function SetupEditor({ params, searchParams }: {
  params: Promise<{ definitionId: string }>; searchParams: Promise<{ business?: string }>;
}) {
  const actor = await requireSession(), { definitionId } = await params, { business } = await searchParams;
  const setup = await withStudioAuthoringAuthority(actor, CAP.read, business, async authority => {
    const draft = await readConfigurationDraftInTransaction(authority, definitionId), catalogue = await getSetupCatalogInTransaction(authority);
    const saved = await authority.transaction.studioDraft.findFirst({ where: { organisationId: authority.session.organisationId,
      definitionId: draft.id, revision: draft.revision }, select: { validation: true } });
    const validation = validationSchema.safeParse(saved?.validation);
    return { draft, catalogue, name: authority.session.organisationName, canPublish: authority.session.capabilities.has(CAP.publish),
      review: validation.success && validation.data.validatedRevision === draft.revision ? validation.data : null };
  });
  const { draft, catalogue } = setup, suffix = business ? `?business=${encodeURIComponent(business)}` : "";
  const field = draft.kind === "customField" ? versionedFieldPayloadSchema.parse(draft.payload).field : null;
  const profile = draft.kind === "entityProfile" ? entityProfilePayloadSchema.parse(draft.payload).profile : null;
  const subtype = draft.kind === "recordType" ? recordTypePayloadSchema.parse(draft.payload) : null;
  const chosen = subtype?.overlay ?? profile;
  const fields = (catalogue.groups.find(group => group.kind === "customField")?.definitions ?? [])
    .filter(value => value.activeVersionId && value.presentationEditable).map(value => ({ id: value.id, name: value.name }));
  const projected = draft.fieldSettings?.kind === "editable" ? draft.fieldSettings.initial : null;
  const initialFieldSettings = projected && catalogue.fieldTypes.some(type => type.id === projected.type) ? projected : null;
  const title = draft.kind === "customField" ? "Additional field" : draft.kind === "entityProfile" ? "Base record setup" : "Record type";
  return <div className="mx-auto max-w-6xl space-y-7 px-5 py-8 md:px-10 md:py-12">
    <Link href={`/design-studio/setup${suffix}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><ArrowLeft className="h-4 w-4"/>Back to business setup</Link>
    <header><p className="text-xs font-semibold tracking-[0.2em] text-blue-600">{title} · {setup.name}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{draft.name}</h1><p className="mt-3 text-sm text-slate-500">{draft.activeVersionId ? "Your live setup is in use. Changes below stay in the draft until you make them live." : "This draft is saved for your business. Review it before making it live."}</p>
    </header>
    <SetupDraftGuard key={`${draft.id}:${draft.revision}`} editor={<section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8"><h2 className="mb-5 text-xl font-semibold">Design the details</h2>
        {field && draft.activeVersionId && <Link href={`/design-studio/setup/${draft.id}/change${suffix}`} className="mb-6 block rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900"><strong>Change settings and preview existing values</strong><span className="mt-2 block leading-6">Adjust the kind of detail, limits or choices using the reviewed field-change workflow.</span></Link>}
        {draft.presentationEditable ? <ActionForm key={draft.revision} action={saveBusinessSetup} label="Save draft">
          <SetupIdentity business={business} kind={draft.kind} id={draft.id} revision={draft.revision}/>
          {field && (initialFieldSettings ? <><input type="hidden" name="fieldSettings" value="on"/><AdditionalFieldSetup fieldTypes={catalogue.fieldTypes} referenceTargets={catalogue.referenceTargets} initial={initialFieldSettings}/></>
            : <><SetupName label={field.label} help={field.help}/><p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{draft.fieldSettings?.kind === "read_only" ? draft.fieldSettings.reason : "Its saved data and rules are kept when you change its name or description. Published settings use the reviewed field workflow."}</p></>)}
          {subtype && <SetupName label={subtype.label} help={subtype.help}/>}
          {chosen && <RecordSetupChoices pages={catalogue.pages} fields={fields} page={chosen.page?.definitionId ?? (chosen.page === null ? null : undefined)}
            requiredFields={chosen.requiredFields?.map(pin => pin.definitionId)} inherit={!!subtype}/>}
        </ActionForm> : <p className="text-sm leading-6 text-slate-600">This setup needs its existing reviewed field workflow or additional editing access. Its saved rules have been preserved.</p>}
      </section>} controls={<aside className="space-y-5"><section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-semibold"><CheckCircle2 className="h-5 w-5 text-blue-600"/>Review and go live</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">Atlas checks the saved draft, access and affected records. A failed check keeps your current live setup.</p>
        {draft.presentationEditable && <ActionForm action={reviewBusinessSetup} label="Review saved draft" className="mt-5"><SetupIdentity business={business} kind={draft.kind} id={draft.id} revision={draft.revision}/></ActionForm>}
        {setup.review && <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><p className="font-medium">Saved draft reviewed</p>
          {setup.review.warnings.length ? <ul className="mt-2 list-disc space-y-2 pl-4">{setup.review.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul> : <p className="mt-2">Ready for the final live checks.</p>}</div>}
        {setup.canPublish && draft.presentationEditable && setup.review && <details className="mt-5 rounded-xl border border-blue-200 p-4"><summary className="cursor-pointer text-sm font-semibold text-blue-700">Make this setup live</summary>
          <ActionForm action={goLiveBusinessSetup} label="Go live" className="mt-4"><SetupIdentity business={business} kind={draft.kind} id={draft.id} revision={draft.revision}/>
            <p className="text-xs leading-5 text-slate-500">Your team will use this version once all final checks pass.</p>
            {!!setup.review.warnings.length && <label className="flex gap-2 text-sm"><input type="checkbox" name="acknowledgeWarnings" required/>I have reviewed the points above.</label>}
          </ActionForm>
        </details>}
      </section><section className="rounded-3xl border border-slate-200 bg-white p-6"><h2 className="flex items-center gap-2 text-lg font-semibold"><History className="h-5 w-5 text-blue-600"/>Published versions</h2>
        <div className="mt-5 space-y-3">{draft.versions.map(version => <div key={version.id} className="rounded-xl border border-slate-200 p-4"><p className="text-sm font-semibold">Version {version.version}{draft.activeVersionId === version.id && <span className="ml-2 inline-flex items-center gap-1 text-xs text-blue-600"><Rocket className="h-3 w-3"/>Live</span>}</p>
          <p className="mt-1 text-xs text-slate-500">{new Date(version.publishedAt).toLocaleDateString("en-GB", { timeZone: "Europe/London" })}</p>
          {setup.canPublish && version.id !== draft.activeVersionId && <details className="mt-3"><summary className="cursor-pointer text-sm text-blue-700">Restore this version</summary><ActionForm action={restoreBusinessSetup} label="Restore live version" className="mt-3">
            <SetupIdentity business={business} kind={draft.kind} id={draft.id}/><input type="hidden" name="versionId" value={version.id}/><input type="hidden" name="definitionRevision" value={draft.definitionRevision}/>
            <label className="flex gap-2 text-xs"><input type="checkbox" name="confirm" required/>Use this version for the business. Keep my draft.</label>
          </ActionForm></details>}
        </div>)}{!draft.versions.length && <p className="text-sm text-slate-500">No published versions yet.</p>}</div>
      </section></aside>}/>
  </div>;
}
