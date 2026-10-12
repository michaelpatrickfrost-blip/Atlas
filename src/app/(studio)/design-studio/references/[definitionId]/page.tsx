import { requireSession } from "@/core/auth/session";
import { STUDIO_CAPABILITIES } from "@/core/studio/permissions";
import { withStudioAuthoringAuthority } from "@/core/studio/authoring/context";
import { readDesignReferenceUsageInTransaction } from "@/core/studio/authoring/reference-navigation";
import { ReferenceUsagePanel } from "@/components/studio/reference-usage";

export default async function ReferenceUsagePage({ params, searchParams }: {
  params: Promise<{ definitionId: string }>;
  searchParams: Promise<{ kind?: string; version?: string; schema?: string; checksum?: string;
    business?: string; after?: string; cursorChecksum?: string }>;
}) {
  const actor = await requireSession(), { definitionId } = await params, query = await searchParams;
  const model = await withStudioAuthoringAuthority(actor, STUDIO_CAPABILITIES.read, query.business, authority =>
    readDesignReferenceUsageInTransaction(authority, { reference: { kind: query.kind, definitionId,
      versionId: query.version, schemaVersion: query.schema === "1" ? 1 : query.schema === "2" ? 2 : null, checksum: query.checksum },
    ...(query.after !== undefined || query.cursorChecksum !== undefined ? { cursor: { after: query.after, checksum: query.cursorChecksum } } : {}) },
    query.business === undefined ? {} : { business: query.business }));
  return <ReferenceUsagePanel model={model} workspaceHref={`/design-studio${query.business === undefined ? "" : `?business=${encodeURIComponent(query.business)}`}`}/>;
}
