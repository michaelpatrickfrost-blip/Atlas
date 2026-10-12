import type { PageComponent, PageScalar } from "../pages/schema";
import type { PagePresentationCatalog } from "../pages/design-model";

type Field = Extract<PageComponent, { type: "fields" }> ["fields"][number];
type PaletteComponent = { [K in PageComponent["type"]]: Omit<Extract<PageComponent, { type: K }>, "id"> }[PageComponent["type"]];
type Links = { sourceHref?: string; whereUsedHref?: string };
/** Current permission-filtered presentation only. Exact field/View versions are
 * kept in each design's own choices; this carries no approval or runtime grant.
 * Browser-safe Core contract deliberately has no component/UI imports. */
export type PageDraftPresentation = {
  catalog: PagePresentationCatalog;
  fields: (Links & { key: string; label: string; field: Field; editable: boolean; required: boolean })[];
  palette: (Links & { key: string; label: string; description: string; component: PaletteComponent;
    table?: { columns: readonly { id: string; label: string }[]; maxPageSize: number } })[];
  conditions: { variantsAllowed: boolean;
    facts: { id: string; label: string; choices: readonly { label: string; value: PageScalar }[] }[];
    recordTypes: (Links & { id: string; label: string })[] };
};
export type PageDraftComparisonPresentation = { saved: PageDraftPresentation; local: PageDraftPresentation };
