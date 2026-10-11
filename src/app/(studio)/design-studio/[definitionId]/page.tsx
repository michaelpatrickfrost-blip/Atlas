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
    const choices = await pageEditorCatalogInTransaction(authority, draft.payload);
    const source = authority.registry.describePageSourceForEntity(draft.payload.entity);
    const queryScopes = new Map(source.policy.queries.map(query => [`${query.query.id}@${query.query.version}`, query.scope]));
    const scope = draft.payload.sections.some(section => section.components.some(component =>
      component.type === "queryList" && queryScopes.get(`${component.query.id}@${component.query.version}`) === "list")) ? "list" as const : "record" as const;
    const layouts = (await screenLayouts(authority, draft.payload.entity)).filter(layout => layout.scope === scope);
    return { business: { id: authority.session.organisationId, name: authority.session.organisationName, workspaceHref: `/design-studio${business ? `?business=${encodeURIComponent(business)}` : ""}` },
      draft: { ...draft, versions: draft.versions.map(version => ({ id: version.id, label: `Version ${version.version}`, publishedAt: version.publishedAt })) },
      catalog: choices.catalog, palette: choices.palette, fields: choices.fields, conditions: choices.conditions,
      presets: layouts.map(layout => ({ key: layout.id, label: layout.name, description: layout.description, sections: layout.page.sections })), scope };
  });
  return <BusinessScreenEditor key={`${setup.business.id}:${definitionId}`} {...setup} selectedBusiness={business} />;
}
