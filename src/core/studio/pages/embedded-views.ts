import { checksum } from "../registry/contracts";
import { pageQueryCostWeight } from "../registry/query-cost";
import { inspectPublishedViewInTransaction } from "../views/seal";
import { inspectSealedViewForReadInTransaction, readSealedViewInTransaction } from "../views/runtime";
import { viewPayloadSchema, viewJsonSchema, type ViewVersionReference } from "../views/schema";
import type { FieldRuntimeAuthority } from "../fields/runtime-authority";
import type { ContractReference } from "../registry/types";
import { embeddedViewApprovalSchema, type ValidatedPageApprovals } from "./approvals";
import type { PageSourcePolicy } from "./owner-contract";
import type { PageComponent } from "./schema";

export type EmbeddedViewApproval = NonNullable<ValidatedPageApprovals["embeddedViews"]>[number];
export type EmbeddedViewOutput = { view: ViewVersionReference; sourceView: ContractReference; content: ReturnType<typeof viewJsonSchema.parse>;
  dataByWidget: Record<string, ReturnType<typeof viewJsonSchema.parse>> };
const exact = ({ id, version, schemaHash, contractHash }: ContractReference): ContractReference => ({ id, version, schemaHash, contractHash });
function broken(): never { throw new Error("DEPENDENCY_BROKEN: the embedded analytics view changed or is not approved by this screen owner."); }
/** Metadata only: exact retained version, current registered owner/dependency
 * compatibility and complete seal. Hidden components cause no native data read.
 * The Page owner must explicitly opt in to this exact View source revision. */
export async function reconstructEmbeddedViewApproval(authority: FieldRuntimeAuthority, pin: ViewVersionReference, policy: PageSourcePolicy): Promise<EmbeddedViewApproval> {
  const inspected = await inspectPublishedViewInTransaction(authority, pin), payload = viewPayloadSchema.parse(inspected.plan.payload);
  if (!policy.embeddedViewSources?.some(ref => ref.id === payload.sourceView.id && ref.version === payload.sourceView.version)) broken();
  const source = authority.registry.describe(payload.sourceView.id, payload.sourceView.version);
  let queryCost = 0;
  for (const request of inspected.plan.requests) {
    const query = authority.registry.describe(request.query.id, request.query.version);
    if (query.kind !== "query" || checksum(exact(query)) !== checksum(request.query)) broken();
    queryCost += pageQueryCostWeight(query.details.costClass);
  }
  return embeddedViewApprovalSchema.parse({ reference: pin, sourceView: { ...exact(source), ownerModuleId: source.ownerModuleId,
    kind: source.kind, classification: source.classification, capability: source.capability }, dependencies: inspected.plan.dependencies,
    queryCost, queryCount: inspected.plan.requests.length });
}
/** Current native Read for ALL used sources is required before the first view
 * provider. Preflight the whole visible set and charge its actual combined cost
 * before loading any results; no author's rights, active pointer or cache. */
export async function prepareVisibleEmbeddedViews(authority: FieldRuntimeAuthority, components: readonly PageComponent[], approvals: ValidatedPageApprovals) {
  const prepared: { componentId: string; approval: EmbeddedViewApproval }[] = [];
  let queryCost = 0, queryCount = 0;
  for (const component of components) {
    if (component.type !== "analyticsView") continue;
    const approval = approvals.embeddedViews?.find(value => checksum(value.reference) === checksum(component.view));
    if (!approval) broken();
    const actual = await inspectSealedViewForReadInTransaction(authority, component.view, approval.sourceView.id);
    if (checksum(actual.pin) !== checksum(approval.reference) || checksum(actual.payload.sourceView) !== checksum(exact(approval.sourceView))
      || checksum(actual.plan.dependencies) !== checksum(approval.dependencies) || actual.queryCost !== approval.queryCost || actual.queryCount !== approval.queryCount) broken();
    queryCost += actual.queryCost; queryCount += actual.queryCount;
    prepared.push({ componentId: component.id, approval });
  }
  return { prepared, queryCost, queryCount };
}
export async function readPreparedEmbeddedViews(authority: FieldRuntimeAuthority, prepared: Awaited<ReturnType<typeof prepareVisibleEmbeddedViews>>["prepared"]) {
  const outputs = new Map<string, EmbeddedViewOutput>();
  for (const entry of prepared) {
    const result = await readSealedViewInTransaction(authority, entry.approval.reference, entry.approval.sourceView.id);
    if (checksum(result.pin) !== checksum(entry.approval.reference) || checksum(result.payload.sourceView) !== checksum(exact(entry.approval.sourceView))) broken();
    const declared = new Set(Object.keys(result.dataByWidget));
    // Only the exact compiled widget keys may leave Core. The owning strict query
    // schema bounds results; the browser-safe JSON boundary rejects foreign data.
    const dataByWidget = Object.create(null) as EmbeddedViewOutput["dataByWidget"];
    if (declared.size !== entry.approval.queryCount) broken();
    for (const [id, value] of Object.entries(result.dataByWidget)) dataByWidget[id] = viewJsonSchema.parse(value);
    outputs.set(entry.componentId, { view: result.pin, sourceView: result.payload.sourceView, content: result.payload.content, dataByWidget });
  }
  return outputs;
}
