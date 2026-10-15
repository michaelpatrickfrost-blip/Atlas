import { notFound } from "next/navigation";
import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { requireTemplateWorkspace } from "@/core/templates/service";
import { parseBlocks } from "@/core/templates/domain";
import { TemplateEditor } from "@/modules/templates/components/editor";
import { saveStudioDocument, listStudioDocumentPreviewRecords, previewStudioDocument, inspectStudioDocumentDraft, compareStudioDocumentDraft } from "../actions";

export default async function DocumentDesigner({ params, searchParams }: {
  params: Promise<{ templateId: string }>; searchParams: Promise<{ business?: string }>;
}) {
  const actor = await requireSession(), { templateId } = await params, { business } = await searchParams;
  const workspace = await withStudioAuthoringAuthority(actor, CAP.edit, business, async authority => {
    assertCapability(authority.session, "core.contract.manage"); await requireTemplateWorkspace(authority.session);
    const template = await authority.transaction.documentTemplate.findFirst({ where: { id: templateId,
      organisationId: authority.session.organisationId, status: { not: "ARCHIVED" } } });
    if (!template) notFound();
    return { name: authority.session.organisationName, template: { ...template, blocks: parseBlocks(template.blocks) } };
  });
  const suffix = business ? `?business=${encodeURIComponent(business)}` : "";
  return <div className="mx-auto max-w-7xl px-5 py-8 md:px-10"><p className="mb-5 text-sm text-slate-500">Designing for {workspace.name}</p>
    <TemplateEditor key={workspace.template.version} initial={workspace.template} saveAction={saveStudioDocument.bind(null, business)} inspectDraft={inspectStudioDocumentDraft.bind(null, business)} compareSaved={compareStudioDocumentDraft.bind(null, business)} listPreviewRecords={listStudioDocumentPreviewRecords.bind(null, business)} previewRecord={previewStudioDocument.bind(null, business)} libraryHref={`/design-studio/documents${suffix}`}/></div>;
}
