import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requireSession } from "@/core/auth/session";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { getSetupCatalogInTransaction } from "@/core/studio/authoring/configuration";
import { readAdditionalFieldMigrationSetup } from "@/core/studio/authoring/field-migration-preview";
import { FieldChangeEditor } from "@/components/studio/field-change-editor";
import { saveFieldChange, previewFieldChange, prepareFieldChange, collectFieldChange, sealFieldChange,
  readFieldChangeStatus, readFieldChangeRecovery, publishFieldChange, startFieldChange, executeFieldChange,
  applyFieldChange, cancelFieldChange, rollbackFieldChange, finalizeFieldChange } from "../../actions";

export default async function FieldChange({ params, searchParams }: {
  params: Promise<{ definitionId: string }>; searchParams: Promise<{ business?: string; review?: string }>;
}) {
  const actor = await requireSession(), { definitionId } = await params, { business, review } = await searchParams;
  // The URL is only a saved review identity. Reading this page never opens a
  // support window, reads migration values, or advances the migration engine.
  const initialPreparationId = z.uuid().optional().parse(review);
  const setup = await readAdditionalFieldMigrationSetup(actor, business, { definitionId });
  const catalogue = await withStudioAuthoringAuthority(actor, CAP.edit, business, async authority => ({
    ...await getSetupCatalogInTransaction(authority), name: authority.session.organisationName,
    canPreview: authority.session.capabilities.has(CAP.publish),
  }));
  const suffix = business ? `?business=${encodeURIComponent(business)}` : "";
  return <div className="mx-auto max-w-6xl space-y-7 px-5 py-8 md:px-10 md:py-12">
    <Link href={`/design-studio/setup/${definitionId}${suffix}`} className="inline-flex items-center gap-2 text-sm font-medium text-slate-500"><ArrowLeft className="h-4 w-4"/>Back to field setup</Link>
    <header><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Field change · {catalogue.name}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Keep your details useful.</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Design new settings, then review how existing values would change. Your team keeps using the current live field while you prepare.</p>
    </header>
    <FieldChangeEditor key={`${business ?? "own"}:${setup.definitionId}:${setup.definitionRevision}:${setup.draftRevision}`}
      initial={setup} fieldTypes={catalogue.fieldTypes} referenceTargets={catalogue.referenceTargets} canPreview={catalogue.canPreview}
      migration={{ initialPreparationId, callbacks: {
        prepare: prepareFieldChange.bind(null, business), collect: collectFieldChange.bind(null, business),
        seal: sealFieldChange.bind(null, business), status: readFieldChangeStatus.bind(null, business),
        recoveryStatus: readFieldChangeRecovery.bind(null, business), publish: publishFieldChange.bind(null, business),
        start: startFieldChange.bind(null, business), execute: executeFieldChange.bind(null, business),
        cutover: applyFieldChange.bind(null, business), cancel: cancelFieldChange.bind(null, business),
        rollback: rollbackFieldChange.bind(null, business), finalize: finalizeFieldChange.bind(null, business),
      } }}
      callbacks={{ save: saveFieldChange.bind(null, business), preview: previewFieldChange.bind(null, business) }}/>
  </div>;
}
