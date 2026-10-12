import { requireSession } from "@/core/auth/session";
import { STUDIO_CAPABILITIES as CAP } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { readPageDraftInTransaction } from "@/core/studio/authoring/pages";
import { pageEditorCatalogInTransaction } from "@/core/studio/authoring/catalog";
import { screenLayouts } from "../layouts";
import { BusinessScreenEditor } from "./editor";

export default async function ScreenDesigner({ params, searchParams }: {
  params: Promise<{ definitionId: string }>; searchParams: Promise<{ business?: string }>;
}) {
  const actor = await requireSession(), { definitionId } = await params, { business } = await searchParams;
  const setup = await withStudioAuthoringAuthority(actor, CAP.edit, business, async authority => {
    const draft = await readPageDraftInTransaction(authority, definitionId);
    const choices = await pageEditorCatalogInTransaction(authority, draft.payload, business === undefined ? {} : { business });
    const scope = choices.scope;
    const layouts = (await screenLayouts(authority, draft.payload.entity)).filter(layout => layout.scope === scope);
    return { business: { id: authority.session.organisationId, name: authority.session.organisationName, workspaceHref: `/design-studio${business ? `?business=${encodeURIComponent(business)}` : ""}` },
      draft: { ...draft, versions: draft.versions.map(version => ({ id: version.id, label: `Version ${version.version}`, publishedAt: version.publishedAt })) },
      catalog: choices.catalog, palette: choices.palette, fields: choices.fields, conditions: choices.conditions,
      presets: layouts.map(layout => ({ key: layout.id, label: layout.name, description: layout.description, sections: layout.page.sections })), scope };
  });
  return <BusinessScreenEditor key={`${setup.business.id}:${definitionId}`} {...setup} selectedBusiness={business} />;
}
