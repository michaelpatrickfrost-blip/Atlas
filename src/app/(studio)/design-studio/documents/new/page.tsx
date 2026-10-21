import { requireSession } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { requireTemplateWorkspace } from "@/core/templates/service";
import { TemplateEditor } from "@/modules/templates/components/editor";
import { saveStudioDocument } from "../actions";

export default async function NewDocument({ searchParams }: { searchParams: Promise<{ business?: string }> }) {
  const actor = await requireSession(), business = (await searchParams).business;
  const workspace = await withStudioAuthoringAuthority(actor, CAP.edit, business, async authority => {
    assertCapability(authority.session, "core.contract.manage"); await requireTemplateWorkspace(authority.session);
    return authority.session.organisationName;
  });
  const suffix = business ? `?business=${encodeURIComponent(business)}` : "";
  return <div className="mx-auto max-w-7xl px-5 py-8 md:px-10"><p className="mb-5 text-sm text-slate-500">Designing for {workspace}</p>
    <TemplateEditor saveAction={saveStudioDocument.bind(null, business)} libraryHref={`/design-studio/documents${suffix}`}/></div>;
}
