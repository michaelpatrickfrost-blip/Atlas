import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requireSession } from "@/core/auth/session";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { readConfigurationDraftInTransaction } from "@/core/studio/authoring/configuration";
import { readAdditionalFieldRequirementEvolutionInTransaction } from "@/core/studio/authoring/field-requirement-authoring";
import { FieldRequirementWorkflow } from "@/components/studio/field-requirement-workflow";
import { saveFieldRequirementChange, prepareFieldChange, collectFieldChange, sealFieldChange,
  readFieldChangeStatus, readFieldChangeRecovery, publishFieldChange, startFieldChange, executeFieldChange,
  applyFieldChange, cancelFieldChange, rollbackFieldChange, finalizeFieldChange } from "../../actions";

export default async function FieldRequirements({ params, searchParams }: {
  params: Promise<{ definitionId: string }>; searchParams: Promise<{ business?: string; review?: string }>;
}) {
  const actor = await requireSession(), { definitionId } = await params, { business, review } = await searchParams;
  const initialPreparationId = z.uuid().optional().parse(review);
  // Metadata only. Loading or resuming this editor never opens support, queries
  // the migration cohort or advances an engine operation.
  const setup = await withStudioAuthoringAuthority(actor, CAP.edit, business, async authority => {
    const draft = await readConfigurationDraftInTransaction(authority, definitionId);
    if (draft.kind !== "customField") throw new Error("This field setup is unavailable.");
    const name = authority.session.organisationName;
    if (!draft.activeVersionId) return { draft, name, rules: null, reason: "First review and enable this additional detail from its field setup. Then choose rules and review existing records before making them live." };
    if (!authority.session.capabilities.has(CAP.publish)) return { draft, name, rules: null, reason: "Your current access can edit field setup. Reviewing changes to live required-field rules also needs publishing access." };
    try { return { draft, name, rules: await readAdditionalFieldRequirementEvolutionInTransaction(authority, { definitionId }), reason: null }; }
    catch (error) {
      if (!(error instanceof Error) || !/^(FORBIDDEN|NOT_READY):/.test(error.message)) throw error;
      return { draft, name, rules: null, reason: "These rule changes are not available with your current business access or readiness. Your current live field and saved rules are kept." };
    }
  });
  const suffix = business ? `?business=${encodeURIComponent(business)}` : "";
  return <div className="mx-auto max-w-6xl space-y-7 px-5 py-8 md:px-10 md:py-12">
    <Link href={`/design-studio/setup/${setup.draft.id}${suffix}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><ArrowLeft size={16}/>Back to field setup</Link>
    <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">Required details · {setup.name}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{setup.draft.name}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Choose when your team needs this detail. Atlas applies the rule whenever records are saved and reviews existing records before the change goes live.</p>
    </header>
    {setup.rules ? <FieldRequirementWorkflow key={`${business ?? "own"}:${setup.draft.id}`} initial={setup.rules}
      save={saveFieldRequirementChange.bind(null, business)} migration={{ initialPreparationId, callbacks: {
        prepare: prepareFieldChange.bind(null, business), collect: collectFieldChange.bind(null, business), seal: sealFieldChange.bind(null, business),
        status: readFieldChangeStatus.bind(null, business), recoveryStatus: readFieldChangeRecovery.bind(null, business),
        publish: publishFieldChange.bind(null, business), start: startFieldChange.bind(null, business), execute: executeFieldChange.bind(null, business),
        cutover: applyFieldChange.bind(null, business), cancel: cancelFieldChange.bind(null, business),
        rollback: rollbackFieldChange.bind(null, business), finalize: finalizeFieldChange.bind(null, business),
      } }}/>
      : <section className="rounded-3xl border border-slate-200 bg-white p-7"><p role="status" className="text-sm leading-6 text-slate-600">{setup.reason}</p></section>}
  </div>;
}
