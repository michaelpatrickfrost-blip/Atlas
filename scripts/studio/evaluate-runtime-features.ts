import assert from "node:assert/strict";
import { probeConditionalFieldReaders } from "./probe-conditional-readiness";
import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

/** Executed in EACH actual runtime by that runtime's own tsx loader. No database,
 * session, generated metadata or configuration writes. Unsupported parsers fail
 * closed; process/import failures are separately rejected by the parent probe. */
async function evaluate() {
  const root = resolve(process.argv[2] ?? "");
  if (root !== process.cwd()) throw new Error("Probe must run in the actual runtime directory.");
  const source = (path: string) => pathToFileURL(resolve(root, path)).href;
  const schema = await import(source("src/core/studio/fields/schema.ts"));
  const field = { key: "readiness", label: "Readiness", classification: "confidential", storage: { type: "integer", min: 0 },
    defaultValue: { type: "integer", value: 0 } };
  if (!schema.customFieldSchema.safeParse(field).success) return [];
  // The first bridge may retain a genuine predecessor without ANY form receipt
  // implementation. Its strict field parser proves unsupported before optional
  // newer modules are imported; missing legacy modules cannot abort the bridge.
  const receipt = await import(source("src/core/service-work/form-receipt-contract.ts"));
  const required = await import(source("src/core/studio/fields/required-contract.ts"));
  const validation = await import(source("src/core/studio/fields/validation.ts"));
  assert.deepEqual(validation.validateFieldConstraints(field).defaultValue, field.defaultValue);
  assert.throws(() => validation.validateFieldConstraints({ ...field, defaultValue: { type: "integer", value: -1 } }));
  const uuid = "00000000-0000-4000-8000-000000000001", hash = "a".repeat(64);
  const payload = { schemaVersion: 2, entity: { id: "tickets.ticket", version: 9, schemaHash: hash, contractHash: hash },
    storageGeneration: uuid, field, requiredIf: { match: "all", predicates: [{ operator: "present", source: { kind: "native", fieldId: "status" } }] } };
  assert.deepEqual(required.versionedFieldPayloadSchema.parse(payload).field.defaultValue, field.defaultValue);
  const savedField = { operationId: uuid, definitionId: uuid, definitionRevision: 0, versionId: uuid, generationId: uuid, fingerprint: hash,
    requestChecksum: hash, extensionId: uuid, extensionRevision: 1, slotId: uuid, slotRevision: 1, valueRevision: 1, defaulted: true };
  const saved = { schemaVersion: 1, organisationId: "readiness", actorUserId: "readiness", operationId: "00000000-0000-4000-8000-000000000002",
    operation: "create", recordId: "readiness", recordRevision: 1, requestRecordRevision: 1, fieldRecordRevision: 1,
    nativeRequestChecksum: hash, packetChecksum: hash, fields: [savedField] };
  assert.equal(receipt.ticketFormReceiptSchema.parse(saved).fields[0].defaulted, true);
  const legacyField = { ...field }; Reflect.deleteProperty(legacyField, "defaultValue");
  const legacyParsed = schema.customFieldSchema.parse(legacyField);
  assert.equal(Object.hasOwn(legacyParsed, "defaultValue"), false);
  const legacySavedField = { ...savedField }; Reflect.deleteProperty(legacySavedField, "defaulted");
  assert.equal(Object.hasOwn(receipt.ticketFormReceiptSchema.parse({ ...saved, fields: [legacySavedField] }).fields[0], "defaulted"), false);
  const features = ["literalFieldDefaults.v1"];
  if (await probeConditionalFieldReaders(root)) features.push("conditionalFields.v1");
  // Absence is only a negative compatibility check. Existing modules must run
  // their actual strict parsers/engines; import or semantic failures are fatal.
  if (await pages(root, source, uuid, hash)) {
    features.push("structuredPages.v1");
    if (await ticketPanels(root, source)) features.push("ticketRecordPanels.v1");
    if (await salesMetrics(root, source)) features.push("salesPageMetrics.v1");
  }
  if (await profiles(root, source, uuid, hash)) {
    features.push("recordProfiles.v1");
    if (await typeForms(root, source, uuid, hash, receipt, saved)) features.push("recordTypeForms.v1");
  }
  if (await businessViews(root, source)) {
    features.push("analyticsBusinessViews.v1");
    if (features.includes("structuredPages.v1") && await embeddedPages(root, source, uuid)) features.push("pageEmbeddedAnalytics.v1");
  }
  return features;
}
function available(root: string, paths: string[]) { return paths.every(path => existsSync(resolve(root, path))); }
async function businessViews(root: string, source: (path: string) => string): Promise<boolean> {
  if (!available(root, ["src/core/studio/views/runtime.ts", "src/modules/analytics/services/studio-business-view.ts",
    "src/modules/analytics/services/business-view-contract.ts", "src/modules/analytics/components/business-view-charts.tsx"])) return false;
  const [runtime, owner, schema, contracts, registryModule, sales, products, compiler, react, server] = await Promise.all([
    import(source("src/core/studio/views/runtime.ts")), import(source("src/modules/analytics/services/studio-business-view.ts")),
    import(source("src/modules/analytics/services/business-view-contract.ts")), import(source("src/modules/analytics/services/studio-view.ts")),
    import(source("src/core/studio/registry/registry.ts")), import(source("src/modules/sales/services/studio-analytics.ts")),
    import(source("src/modules/products/services/studio-analytics.ts")), import(source("src/core/studio/views/definition-compiler.ts")),
    import(source("node_modules/react/index.js")), import(source("node_modules/react-dom/server.node.js")),
  ]);
  if (typeof runtime.readPublishedViewInTransaction !== "function" || typeof owner.readPublishedAnalyticsViewInTransaction !== "function") return false;
  const registry = new registryModule.CapabilityRegistry(async () => true);
  registry.register("analytics", contracts.analyticsBusinessViewContract); registry.register("sales", sales.salesAnalyticsStudioContract); registry.register("products", products.productsAnalyticsStudioContract);
  const metadata = registry.describe("analytics.dashboard.view", 1), sourceView = { id: metadata.id, version: metadata.version, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const content = schema.businessViewCreateSchema.parse({ name: "Readiness <dashboard>", period: "all", refreshSeconds: 0,
    widgets: [{ id: "orders", metricId: "sales.orders", visual: "kpi", wide: false, minimum: 0 }] });
  assert.equal(content.widgets[0].wide, false); assert.equal(content.refreshSeconds, 0);
  assert.equal(schema.businessViewCreateSchema.safeParse({ ...content, organisationId: "foreign" }).success, false);
  assert.equal(schema.businessViewCreateSchema.safeParse({ ...content, widgets: [{ ...content.widgets[0], data: { dataset: "finance.documents" } }] }).success, false);
  const resolved = registry.describeViewSource(sourceView), prepared = resolved.callbacks.prepare(content), native = registry.describe("sales.orders.metric", 1), query = registry.describe("sales.orders.metric.read", 1);
  const exact = (value: { id: string; version: number; schemaHash: string; contractHash: string }) => ({ id: value.id, version: value.version, schemaHash: value.schemaHash, contractHash: value.contractHash });
  const compiled = resolved.callbacks.compile(prepared.content, Object.freeze([{ source: exact(native), metadata: native, query: exact(query), queryMetadata: query,
    policy: native.details.analyticsSource }]));
  const plan = compiler.materialiseCompiledView({ schemaVersion: 1, sourceView, content }, { ...compiled, dependencies: [metadata, native, query].map(value => ({ ...exact(value),
    ownerModuleId: value.ownerModuleId, kind: value.kind, classification: value.classification })) });
  assert.deepEqual(plan.plan.requests[0].input, { period: "all", dimension: "status" });
  const access = denyAccess(), authority = { session: forgedSession(), stamp: {}, transaction: access.blocked, registry: access.blocked };
  await assert.rejects(() => runtime.readPublishedViewInTransaction(authority, { definitionId: "00000000-0000-4000-8000-000000000001" }, "analytics.dashboard.view"), /FORBIDDEN/);
  await assert.rejects(() => owner.readPublishedAnalyticsViewInTransaction(authority, { definitionId: "00000000-0000-4000-8000-000000000001" }), /FORBIDDEN/);
  assert.equal(access.accesses(), 0);
  // Probe-only CSS token loader: actual styles are read, not executed. Restore
  // before returning. This validates real JSX/native-chart semantics, never CSS
  // layout; the original production build and browser gates prove that separately.
  const require = createRequire(resolve(root, "package.json")), previous = require.extensions[".css"];
  require.extensions[".css"] = (module, filename) => {
    const text = readFileSync(filename, "utf8"), names = [...text.matchAll(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g)].map(match => match[1]);
    module.exports = Object.fromEntries(names.map(name => [name, name]));
  };
  try {
    const renderer = await import(source("src/modules/analytics/components/business-view-charts.tsx"));
    if (typeof renderer.BusinessViewCharts !== "function") return false;
    const metric = { id: "sales.orders", name: "Orders <safe>", subject: "Sales", definition: "Complete count", grain: "Record", snapshot: false, href: "/sales/orders", unit: "count",
      points: [{ label: "DRAFT", value: 0 }] };
    const html = server.renderToStaticMarkup(react.createElement(renderer.BusinessViewCharts, { view: { content, dataByWidget: { orders: metric } } }));
    assert(html.includes("Orders &lt;safe&gt;")); assert(html.includes(">0<")); assert(!html.includes("<form")); assert(!html.includes("<script"));
  } finally { if (previous) require.extensions[".css"] = previous; else delete require.extensions[".css"]; }
  return true;
}
async function embeddedPages(root: string, source: (path: string) => string, uuid: string): Promise<boolean> {
  if (!available(root, ["src/core/studio/pages/embedded-views.ts", "src/core/studio/views/runtime.ts", "src/modules/analytics/components/embedded-business-view.tsx"])) return false;
  const [pages, tickets, salesPages, sales, analytics, measures, products, registryModule, compiler, selection, display, viewCompiler, viewRuntime, pageRuntime, schema, contracts] = await Promise.all([
    import(source("src/core/service-work/studio-pages.ts")), import(source("src/core/service-work/studio.ts")),
    import(source("src/modules/sales/services/studio-pages.ts")), import(source("src/modules/sales/services/studio.ts")),
    import(source("src/modules/analytics/services/studio-view.ts")), import(source("src/modules/sales/services/studio-analytics.ts")),
    import(source("src/modules/products/services/studio-analytics.ts")), import(source("src/core/studio/registry/registry.ts")),
    import(source("src/core/studio/pages/compiler.ts")), import(source("src/core/studio/pages/selection.ts")),
    import(source("src/core/studio/pages/render-model.ts")), import(source("src/core/studio/views/definition-compiler.ts")),
    import(source("src/core/studio/views/runtime.ts")), import(source("src/core/studio/pages/runtime.ts")),
    import(source("src/modules/analytics/services/business-view-contract.ts")), import(source("src/core/studio/registry/contracts.ts")),
  ]);
  // Old owner families are unsupported before attempting the new composition;
  // file presence alone cannot declare immutable embedded reader compatibility.
  if (!pages.ticketPageEmbeddedPolicy || !salesPages.salesOrderEmbeddedPagePolicy
    || typeof viewRuntime.inspectSealedViewForReadInTransaction !== "function" || typeof viewRuntime.readSealedViewInTransaction !== "function") return false;
  const registry = new registryModule.CapabilityRegistry(async () => true);
  registry.register("analytics", analytics.analyticsBusinessViewContract);
  registry.register("sales", { contributions: [...sales.salesStudioContract.contributions, ...measures.salesAnalyticsStudioContract.contributions, ...salesPages.salesOrderPageContract.contributions] });
  registry.register("products", products.productsAnalyticsStudioContract);
  registry.register("tickets", { contributions: [...tickets.ticketStudioContract.contributions, ...pages.ticketPageContract.contributions] });
  const exact = (value: { id: string; version: number; schemaHash: string; contractHash: string }) => ({ id: value.id, version: value.version, schemaHash: value.schemaHash, contractHash: value.contractHash });
  const approve = (value: { id: string; version: number; schemaHash: string; contractHash: string; ownerModuleId: string; kind: string; classification: string; capability: string }) => ({ ...exact(value), ownerModuleId: value.ownerModuleId, kind: value.kind, classification: value.classification, capability: value.capability });
  const descriptor = registry.describe("analytics.dashboard.view", 1), resolved = registry.describeViewSource(exact(descriptor));
  const content = schema.businessViewCreateSchema.parse({ name: "Embedded <overview>", period: "all", refreshSeconds: 0, widgets: [{ id: "orders", metricId: "sales.orders", title: "Order <summary>", visual: "kpi", wide: false }] });
  const prepared = resolved.callbacks.prepare(content), metric = registry.describe("sales.orders.metric", 1), query = registry.describe("sales.orders.metric.read", 1);
  const compiled = resolved.callbacks.compile(prepared.content, [{ source: exact(metric), metadata: metric, query: exact(query), queryMetadata: query, policy: metric.details.analyticsSource }]);
  const dependencies = [descriptor, metric, query].map(value => { const { capability, ...dependency } = approve(value); void capability; return dependency; });
  const sealed = viewCompiler.materialiseCompiledView({ schemaVersion: 1, sourceView: exact(descriptor), content }, { ...compiled, dependencies });
  const pin = { kind: "view", definitionId: uuid, versionId: "00000000-0000-4000-8000-000000000003", schemaVersion: 1, checksum: sealed.checksum };
  const forms = ["desktop", "tablet", "phone"], widgetData = { orders: [{ label: "DRAFT", value: 0 }] };
  const access = denyAccess(), authority = { session: forgedSession(), stamp: {}, transaction: access.blocked, registry: access.blocked };
  for (const family of ["sales.order.page", "tickets.ticket.page"]) {
    const owner = registry.describePageSource(exact(registry.describe(family, 3))), prior = registry.describePageSource(exact(registry.describe(family, 2)));
    assert.deepEqual(owner.policy, { ...prior.policy, embeddedViewSources: [{ id: descriptor.id, version: 1 }], maxQueryCost: 64 });
    const entity = registry.describe(owner.policy.entity.id, owner.policy.entity.version);
    const payload = { schemaVersion: 1, entity: exact(entity), formFactors: forms, variants: [], sections: [{ id: "overview", label: "Overview", help: "", formFactors: forms, columns: { desktop: 2, tablet: 2, phone: 1 }, components: [{ id: "analytics", type: "analyticsView", view: pin, formFactors: forms }] }] };
    const plan = compiler.compilePage(payload, { entity: approve(entity), sourcePage: approve(owner.metadata), variants: owner.policy.variants, fieldSourceVersions: owner.policy.fieldSourceVersions,
      nativeFields: [], customFields: [], facts: [], contracts: [], queries: [], commands: [], metrics: [], surfaces: [], maxQueryCost: owner.policy.maxQueryCost,
      embeddedViews: [{ reference: pin, sourceView: approve(descriptor), dependencies, queryCount: 1, queryCost: 8 }] });
    assert.equal(plan.base.queryCost, 8); assert.equal(plan.base.queryCount, 1); assert.deepEqual(plan.configurationDependencies, [pin]);
    const digest = contracts.checksum(plan); assert.equal(digest, contracts.checksum(compiler.compilePage(payload, plan.approvals)));
    const layout = selection.resolvePageVariant(plan, { capabilities: new Set([entity.capability, descriptor.capability]), recordTypeDefinitionId: null, facts: new Map() }, "phone");
    const output = { view: pin, sourceView: exact(descriptor), content, dataByWidget: widgetData };
    const model = display.createPageDisplayModel(plan, layout, "phone", new Map(), new Map(), new Map(), new Map(), new Map(), new Map([["analytics", output]]));
    assert.equal(model.sections[0].columns, 1); assert.deepEqual(model.sections[0].components[0].output, output);
    await assert.rejects(() => pageRuntime.readPublishedPageInTransaction(authority, { page: { kind: "page", definitionId: "00000000-0000-4000-8000-000000000004", versionId: "00000000-0000-4000-8000-000000000005", schemaVersion: 1, checksum: digest }, request: { kind: "record", recordId: "readiness" }, formFactor: "phone", cursors: {} }), /DEPENDENCY_BROKEN/);
  }
  await assert.rejects(() => viewRuntime.inspectSealedViewForReadInTransaction(authority, pin, descriptor.id), /FORBIDDEN/);
  await assert.rejects(() => viewRuntime.readSealedViewInTransaction(authority, pin, descriptor.id), /FORBIDDEN/);
  assert.equal(access.accesses(), 0);
  const require = createRequire(resolve(root, "package.json")), previous = require.extensions[".css"];
  require.extensions[".css"] = (module, filename) => {
    const names = [...readFileSync(filename, "utf8").matchAll(/\.([a-zA-Z_][a-zA-Z0-9_-]*)/g)].map(match => match[1]);
    module.exports = Object.fromEntries(names.map(name => [name, name]));
  };
  try {
    const [adapter, react, server] = await Promise.all([import(source("src/modules/analytics/components/embedded-business-view.tsx")), import(source("node_modules/react/index.js")), import(source("node_modules/react-dom/server.node.js"))]);
    if (typeof adapter.embeddedBusinessViewDisplay !== "function" || typeof adapter.EmbeddedBusinessView !== "function") return false;
    const output = { view: pin, sourceView: exact(descriptor), content, dataByWidget: widgetData };
    assert.equal(adapter.embeddedBusinessViewDisplay(output).dataByWidget.orders.points[0].value, 0);
    assert.throws(() => adapter.embeddedBusinessViewDisplay({ ...output, dataByWidget: { ...widgetData, forbidden: [] } }));
    const html = server.renderToStaticMarkup(react.createElement(adapter.EmbeddedBusinessView, { output }));
    assert(html.includes("Order &lt;summary&gt;")); assert(html.includes(">0<")); assert(!html.includes("<form")); assert(!html.includes("<script"));
  } finally { if (previous) require.extensions[".css"] = previous; else delete require.extensions[".css"]; }
  return true;
}
const denyAccess = () => {
  let accesses = 0;
  const blocked = new Proxy({}, { get() { accesses++; throw new Error("Readiness must not access records or transactions."); } });
  return { blocked, accesses: () => accesses };
};
const forgedSession = () => ({ userId: "readiness", membershipId: "readiness", organisationId: "readiness", capabilities: new Set(["readiness.record.read"]) });
async function pages(root: string, source: (path: string) => string, uuid: string, hash: string): Promise<boolean> {
  if (!available(root, ["src/core/studio/pages/schema.ts", "src/core/studio/pages/compiler.ts", "src/core/studio/pages/runtime.ts", "src/core/studio/pages/render-model.ts"])) return false;
  const [schema, compiler, runtime, selection, display, contracts] = await Promise.all([
    import(source("src/core/studio/pages/schema.ts")), import(source("src/core/studio/pages/compiler.ts")),
    import(source("src/core/studio/pages/runtime.ts")), import(source("src/core/studio/pages/selection.ts")),
    import(source("src/core/studio/pages/render-model.ts")), import(source("src/core/studio/registry/contracts.ts")),
  ]);
  if (typeof runtime.readPublishedPageInTransaction !== "function") return false;
  const ref = (id: string) => ({ id, version: 1, schemaHash: hash, contractHash: hash });
  const identity = { ownerModuleId: "readiness", classification: "confidential", capability: "readiness.record.read" };
  const query = ref("readiness.record.page_get"), forms = ["desktop", "tablet", "phone"];
  const format = { kind: "money_minor", currencyColumnId: "currency" };
  const approvals = { entity: { ...ref("readiness.record"), ...identity, kind: "entity" }, sourcePage: { ...ref("readiness.record.page"), ...identity, kind: "surface" },
    variants: false, fieldSourceVersions: [], nativeFields: [{ id: "amount", label: "Total", classification: "confidential", editable: false, query, format },
      { id: "done", label: "Complete", classification: "confidential", editable: false, query }], customFields: [], facts: [], contracts: [],
    queries: [{ ...query, ...identity, kind: "query", sourceEntityId: "readiness.record", purpose: "fact", pagination: "none", maxCardinality: 1, costClass: "low",
      columns: [{ id: "amount", label: "Total", classification: "confidential", format }, { id: "currency", classification: "confidential" }, { id: "done", classification: "confidential" }] }],
    commands: [], metrics: [], surfaces: [], maxQueryCost: 4 };
  const payload = { schemaVersion: 1, entity: ref("readiness.record"), formFactors: forms, variants: [], sections: [{ id: "main", label: "Overview", help: "",
    formFactors: forms, columns: { desktop: 2, tablet: 2, phone: 1 }, components: [{ id: "details", type: "fields", formFactors: forms,
      fields: [{ source: "native", fieldId: "amount", mode: "read" }, { source: "native", fieldId: "done", mode: "read" }] }] }] };
  assert.equal(schema.pagePayloadSchema.safeParse({ ...payload, organisationId: "forged" }).success, false);
  assert.equal(schema.pagePayloadSchema.safeParse({ ...payload, schemaVersion: 999 }).success, false);
  const plan = compiler.compilePage(payload, approvals), digest = contracts.checksum(plan);
  assert.equal(digest, contracts.checksum(compiler.compilePage(payload, approvals)));
  assert.notEqual(digest, contracts.checksum(compiler.compilePage({ ...payload, sections: [{ ...payload.sections[0], label: "Changed" }] }, approvals)));
  const layout = selection.resolvePageVariant(plan, { capabilities: new Set([identity.capability]), recordTypeDefinitionId: null, facts: new Map() }, "phone");
  const values = { amount: 1234, currency: "KWD", done: false };
  const model = display.createPageDisplayModel(plan, layout, "phone", new Map(), new Map([["amount", { value: values.amount, values }], ["done", { value: false, values }]]));
  assert.equal(model.sections[0].columns, 1); assert.match(model.sections[0].components[0].cells[0].text, /1\.234/);
  assert.equal(model.sections[0].components[0].cells[1].text, "No");
  const unavailable = display.createPageDisplayModel(plan, layout, "phone", new Map(), new Map([["amount", { value: 1234, values: { ...values, currency: "ZZZ" } }]]));
  assert.equal(unavailable.sections[0].components[0].cells[0].unavailable, true);
  const access = denyAccess(), authority = { session: forgedSession(), stamp: {}, transaction: access.blocked, registry: access.blocked };
  await assert.rejects(() => runtime.readPublishedPageInTransaction(authority, { page: { kind: "page", definitionId: uuid, versionId: uuid, schemaVersion: 1, checksum: hash },
    request: { kind: "record", recordId: "readiness" }, formFactor: "phone", cursors: {} }), /DEPENDENCY_BROKEN/);
  assert.equal(access.accesses(), 0);
  return true;
}
async function ticketPanels(root: string, source: (path: string) => string): Promise<boolean> {
  // A predecessor with generic Page support lacks this exact owner/renderer
  // family. Missing optional files are unsupported; broken present imports fail.
  if (!available(root, ["src/core/service-work/page-panel-contract.ts", "src/core/service-work/studio-page-surfaces.ts",
    "src/core/service-work/studio-pages.ts", "src/components/service-work/ticket-record-panels.tsx"])) return false;
  const [panels, pages, tickets, registryModule, display, react, server] = await Promise.all([
    import(source("src/core/service-work/page-panel-contract.ts")), import(source("src/core/service-work/studio-pages.ts")),
    import(source("src/core/service-work/studio.ts")), import(source("src/core/studio/registry/registry.ts")),
    import(source("src/components/service-work/ticket-record-panels.tsx")), import(source("node_modules/react/index.js")),
    import(source("node_modules/react-dom/server.node.js")),
  ]);
  if (typeof display.TicketRecordSurface !== "function") return false;
  const registry = new registryModule.CapabilityRegistry(async () => true);
  if (pages.ticketPageEmbeddedPolicy) { const analytics = await import(source("src/modules/analytics/services/studio-view.ts")); registry.register("analytics", analytics.analyticsBusinessViewContract); }
  registry.register("tickets", tickets.ticketStudioContract); registry.register("tickets", pages.ticketPageContract);
  const exact = (version: number) => { const value = registry.describe("tickets.ticket.page", version);
    return { id: value.id, version: value.version, schemaHash: value.schemaHash, contractHash: value.contractHash }; };
  const retained = registry.describePageSource(exact(1)), current = registry.describePageSource(exact(2));
  assert.equal(retained.policy.entity.id, "tickets.ticket"); assert.equal(current.policy.entity.version, 9);
  assert.equal(retained.metadata.version, 1); assert.equal(current.metadata.version, 2);
  assert.equal(current.policy.queries.length, retained.policy.queries.length + 6);
  assert.equal(current.policy.surfaces.length, retained.policy.surfaces.length + 6);
  assert.deepEqual(panels.ticketPanelKinds, ["status", "activity", "documents", "relationships", "outstanding_work", "approval"]);
  for (const kind of panels.ticketPanelKinds) {
    const queryRef = panels.ticketPanelQuery(kind), surfaceRef = panels.ticketPanelSurface(kind);
    const query = registry.describe(queryRef.id, queryRef.version), surface = registry.describe(surfaceRef.id, surfaceRef.version);
    assert.equal(query.kind, "query"); assert.equal(query.ownerModuleId, "tickets"); assert.equal(query.details.transaction, "required");
    assert.equal(query.details.pagination, kind === "status" ? "none" : "page"); assert.equal(query.details.maxCardinality, kind === "status" ? 1 : 50);
    assert.equal(surface.kind, "surface"); assert.equal(surface.ownerModuleId, "tickets");
    assert(current.policy.queries.some((entry: { query: { id: string; version: number } }) => entry.query.id === queryRef.id && entry.query.version === 1));
    assert(current.policy.surfaces.some((entry: { surface: { id: string; version: number } }) => entry.surface.id === surfaceRef.id && entry.surface.version === 1));
  }
  const time = "2026-10-12T00:00:00.000Z";
  const document = { rows: [{ id: "readiness-file", values: { name: "Readiness <file>", size: 0, mime: "text/plain", created_at: time } }], nextCursor: null };
  assert.equal(panels.parseTicketPanel("documents", document)[0].values.size, 0);
  const status = { rows: [{ id: "readiness", values: { status: "NEW", owner: "Readiness", reopen_count: 0, first_response_state: "PAUSED",
    first_response_due: null, resolution_state: "PAUSED", resolution_due: null } }], nextCursor: null };
  assert.equal(panels.parseTicketPanel("status", status)[0].values.reopen_count, 0);
  const render = (kind: string, output: object) => server.renderToStaticMarkup(react.createElement(display.TicketRecordSurface,
    { surface: panels.ticketPanelSurface(kind), outputs: [output] }));
  const html = render("documents", document);
  assert(html.includes('/api/service-files/readiness-file')); assert(html.includes("Readiness &lt;file&gt;")); assert(!html.includes("<form"));
  assert(render("status", status).includes("Reopened 0 times"));
  assert.throws(() => render("documents", { ...document, rows: [{ ...document.rows[0], id: "https://foreign.example/file" }] }));
  const access = denyAccess();
  await assert.rejects(() => registry.invokePageRead({ session: forgedSession(), transaction: access.blocked }, exact(2),
    { kind: "record", recordId: "readiness" }, { query: panels.ticketPanelQuery("status"), pageSize: 1, cursor: null }), /genuine/);
  assert.equal(access.accesses(), 0);
  return true;
}
async function salesMetrics(root: string, source: (path: string) => string): Promise<boolean> {
  if (!available(root, ["src/modules/sales/services/studio-pages.ts", "src/modules/sales/services/studio.ts", "src/core/studio/pages/render-model.ts"])) return false;
  const [pages, sales, registryModule, compiler, display, selection] = await Promise.all([
    import(source("src/modules/sales/services/studio-pages.ts")), import(source("src/modules/sales/services/studio.ts")),
    import(source("src/core/studio/registry/registry.ts")), import(source("src/core/studio/pages/compiler.ts")),
    import(source("src/core/studio/pages/render-model.ts")), import(source("src/core/studio/pages/selection.ts")),
  ]);
  const registry = new registryModule.CapabilityRegistry(async () => true);
  if (pages.salesOrderEmbeddedPagePolicy) { const analytics = await import(source("src/modules/analytics/services/studio-view.ts")); registry.register("analytics", analytics.analyticsBusinessViewContract); }
  registry.register("sales", sales.salesStudioContract); registry.register("sales", pages.salesOrderPageContract);
  const legacy = registry.describe("sales.order.page", 1);
  // Older actual runtime has ordinary Pages but no exact new owner family.
  if (!pages.salesOrderMetricPagePolicy) return false;
  const metadata = registry.describe("sales.order.page", 2), entity = registry.describe("sales.order", 1);
  const exact = (entry: { id: string; version: number; schemaHash: string; contractHash: string }) => ({ id: entry.id, version: entry.version, schemaHash: entry.schemaHash, contractHash: entry.contractHash });
  const current = registry.describePageSource(exact(metadata)), retained = registry.describePageSource(exact(legacy));
  assert.equal(current.policy.queries.length, retained.policy.queries.length + 1);
  assert.equal(retained.policy.metrics.length, 0); assert.equal(current.policy.metrics.length, 1);
  const metric = registry.describe("sales.order.page.total_metric", 1), query = registry.describe("sales.order.page.total", 1);
  assert.equal(query.kind, "query"); assert.equal(query.details.transaction, "required"); assert.equal(query.details.pagination, "none");
  assert.equal(query.details.maxCardinality, 1); assert.equal(query.details.costClass, "low");
  const owned = current.policy.queries.find((entry: { query: { id: string } }) => entry.query.id === query.id);
  assert(owned); assert.equal(owned.scope, "record"); assert.equal(owned.purpose, "metric");
  assert.deepEqual(owned.columns.map((entry: { id: string }) => entry.id), ["gross_amount", "currency"]);
  assert.deepEqual(owned.columns[0].format, { kind: "money_minor", currencyColumnId: "currency" });
  const approve = (entry: { id: string; version: number; schemaHash: string; contractHash: string; ownerModuleId: string; kind: string; classification: string; capability: string }) => ({ ...exact(entry), ownerModuleId: entry.ownerModuleId, kind: entry.kind, classification: entry.classification, capability: entry.capability });
  const forms = ["desktop", "tablet", "phone"];
  const payload = { schemaVersion: 1, entity: exact(entity), formFactors: forms, variants: [], sections: [{ id: "total", label: "Order", help: "", formFactors: forms,
    columns: { desktop: 1, tablet: 1, phone: 1 }, components: [{ id: "value", type: "metric", metric: exact(metric), formFactors: forms }] }] };
  const plan = compiler.compilePage(payload, { entity: approve(entity), sourcePage: approve(metadata), variants: true, fieldSourceVersions: [],
    nativeFields: [], customFields: [], facts: [], contracts: [], commands: [], surfaces: [], maxQueryCost: current.policy.maxQueryCost,
    queries: [{ ...approve(query), sourceEntityId: entity.id, purpose: "metric", pagination: "none", maxCardinality: 1, costClass: "low", columns: owned.columns.map((column: { id: string; label?: string; classification: string; capability?: string; format?: object }) => ({ id: column.id, ...(column.label ? { label: column.label } : {}), classification: column.classification, ...(column.capability ? { capability: column.capability } : {}), ...(column.format ? { format: column.format } : {}) })) }],
    metrics: [{ ...approve(metric), sourceEntityId: entity.id, query: exact(query), formFactors: forms }] });
  const layout = selection.resolvePageVariant(plan, { capabilities: new Set(["sales.order.read"]), recordTypeDefinitionId: null, facts: new Map() }, "desktop");
  const outputs = new Map([[display.pageQueryKey(query), { rows: [{ id: "readiness", values: { gross_amount: 0, currency: "GBP" } }], nextCursor: null }]]);
  const model = display.createPageDisplayModel(plan, layout, "desktop", outputs);
  assert.equal(model.sections[0].components[0].type, "metric"); assert.equal(model.sections[0].components[0].cells[0].text, "£0.00");
  const access = denyAccess();
  await assert.rejects(() => registry.invokePageRead({ session: forgedSession(), transaction: access.blocked }, exact(metadata),
    { kind: "record", recordId: "readiness" }, { query: { id: query.id, version: query.version }, pageSize: 1, cursor: null }), /genuine/);
  assert.equal(access.accesses(), 0);
  return true;
}
async function profiles(root: string, source: (path: string) => string, uuid: string, hash: string): Promise<boolean> {
  if (!available(root, ["src/core/studio/record-types/schema.ts", "src/core/studio/record-types/compiler.ts", "src/core/studio/record-types/resolver.ts", "src/core/studio/record-types/runtime-profile.ts"])) return false;
  const [schema, compiler, resolver, runtime, contracts, registryModule] = await Promise.all([
    import(source("src/core/studio/record-types/schema.ts")), import(source("src/core/studio/record-types/compiler.ts")),
    import(source("src/core/studio/record-types/resolver.ts")), import(source("src/core/studio/record-types/runtime-profile.ts")),
    import(source("src/core/studio/registry/contracts.ts")), import(source("src/core/studio/registry/registry.ts")),
  ]);
  if (typeof runtime.resolveRecordProfileInTransaction !== "function") return false;
  // Only synthetic metadata: an empty profile needs no sealed rows or values.
  // This is not an issued data principal; the real runtime denial is separate.
  const registry = new registryModule.CapabilityRegistry(async () => true);
  const { z } = await import(source("node_modules/zod/index.js"));
  const projections = ["list", "get"].map(name => contracts.query({
    id: `readiness.record.${name}`, version: 1, label: "Readiness", capability: "readiness.record.read", kind: "query", lifecycle: "active", classification: "confidential",
    input: z.strictObject({}), output: z.strictObject({}), pagination: "none", maxCardinality: 1, costClass: "low",
    execute: () => { throw new Error("Readiness projections must never execute."); } }));
  registry.register("readiness", { contributions: [...projections, contracts.entity({ id: "readiness.record", version: 1, label: "Readiness", capability: "readiness.record.read", kind: "entity",
    lifecycle: "active", classification: "confidential", key: "string",
    fields: [{ id: "name", type: "string", nullable: false, classification: "confidential", filterable: false, sortable: false, decision: false, template: false }],
    record: { writeCapability: "readiness.record.write", detailRoute: "/readiness/{recordId}", labelField: "name",
      listQuery: { id: "readiness.record.list", version: 1 }, getQuery: { id: "readiness.record.get", version: 1 },
      nativeFields: "read_only", revision: "owner_positive_integer", authorise: () => { throw new Error("Readiness record policy must never execute."); } },
    extensionPolicy: { customFields: false, recordTypes: true, pageVariants: false } })] });
  const metadata = registry.describe("readiness.record", 1), entity = { id: metadata.id, version: 1, schemaHash: metadata.schemaHash, contractHash: metadata.contractHash };
  const base = schema.entityProfilePayloadSchema.parse({ schemaVersion: 1, entity, profile: { page: null, requiredFields: [], allowedProcesses: [], defaultDecisions: [] } });
  assert.equal(schema.entityProfilePayloadSchema.safeParse({ ...base, organisationId: "forged" }).success, false);
  assert.equal(schema.entityProfilePayloadSchema.safeParse({ ...base, schemaVersion: 999 }).success, false);
  const access = denyAccess(), compiled = await compiler.compileRecordProfile({ session: forgedSession(), transaction: access.blocked, registry, definitionId: uuid }, "entityProfile", base);
  assert.equal(compiled.checksum, contracts.checksum(compiled.plan));
  assert.deepEqual(compiled.plan.resolvedProfile, resolver.resolveEntityProfile(base).profile);
  assert.equal(access.accesses(), 0);
  const basePin = { kind: "entityProfile", definitionId: uuid, versionId: uuid, schemaVersion: 1, checksum: compiled.checksum };
  const ownId = "00000000-0000-4000-8000-000000000003";
  const overlay = schema.recordTypePayloadSchema.parse({ schemaVersion: 1, entity, label: "Readiness type", baseProfile: basePin, overlay: { page: null } });
  assert.deepEqual(resolver.resolveRecordTypeProfile({ reference: basePin, payload: base }, overlay, ownId).profile, compiled.plan.resolvedProfile);
  assert.throws(() => resolver.resolveRecordTypeProfile({ reference: { ...basePin, checksum: hash }, payload: base }, overlay, ownId));
  assert.throws(() => resolver.resolveEntityProfile(base, [overlay, overlay]));
  await assert.rejects(() => runtime.resolveRecordProfileInTransaction({ session: forgedSession(), stamp: {}, transaction: access.blocked, registry: access.blocked },
    { entity, recordId: "readiness", expectedRevision: 1 }), /FORBIDDEN: genuine current record design authority/);
  assert.equal(access.accesses(), 0);
  return true;
}
async function typeForms(root: string, source: (path: string) => string, uuid: string, hash: string,
  receipt: { ticketFormReceiptSchema: { safeParse(value: unknown): { success: boolean }; parse(value: unknown): object } },
  legacy: { operationId: string; [key: string]: unknown }): Promise<boolean> {
  // Probe the actual predecessor's receipt parser BEFORE loading optional new
  // creation modules. A receipt1-only bridge is unsupported, not a broken import.
  const { checksum } = await import(source("src/core/studio/registry/contracts.ts"));
  const selection = { schemaVersion: 1, manifestChecksum: hash, definitionId: null };
  const saved = { ...legacy, schemaVersion: 2, fields: [], typeSelection: selection, typeAssignment: {
    operationId: uuid, extensionId: uuid, extensionRevision: 1, requestChecksum: hash, checksum: hash, selectionChecksum: checksum(selection) } };
  if (!receipt.ticketFormReceiptSchema.safeParse(saved).success) return false;
  if (!available(root, ["src/core/service-work/record-type-creation-contract.ts", "src/core/service-work/record-type-creation.ts"])) return false;
  const [contract, creation, replay] = await Promise.all([import(source("src/core/service-work/record-type-creation-contract.ts")),
    import(source("src/core/service-work/record-type-creation.ts")), import(source("src/core/service-work/form-receipt.ts"))]);
  assert.deepEqual(contract.parseTicketCreationTypeSelection(JSON.stringify(selection)), selection);
  assert.throws(() => contract.parseTicketCreationTypeSelection(JSON.stringify({ ...selection, organisationId: "forged" })));
  assert.equal(receipt.ticketFormReceiptSchema.safeParse({ ...saved, operation: "update" }).success, false);
  assert.equal(receipt.ticketFormReceiptSchema.safeParse({ ...saved, typeAssignment: { ...saved.typeAssignment, selectionChecksum: "b".repeat(64) } }).success, false);
  assert.equal(Object.hasOwn(receipt.ticketFormReceiptSchema.parse(legacy), "typeSelection"), false);
  const operation = creation.ticketCreationTypeOperationId(legacy.operationId, null);
  assert.match(operation, /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-8[a-f0-9]{3}-[a-f0-9]{12}$/);
  assert.equal(operation, creation.ticketCreationTypeOperationId(legacy.operationId, null));
  assert.notEqual(operation, creation.ticketCreationTypeOperationId(uuid, null));
  const access = denyAccess(), session = forgedSession(), authority = { session, stamp: {}, transaction: access.blocked, registry: access.blocked };
  await assert.rejects(() => creation.inspectTicketCreationTypeReceipt(authority, legacy.operationId, selection, "readiness", 0, false, saved.typeAssignment), /FORBIDDEN/);
  await assert.rejects(() => replay.replayTicketFormInTransaction(session, access.blocked, { operation: "create", nativeRequestChecksum: hash,
    typeSelection: selection, packet: { schemaVersion: 1, operationId: legacy.operationId, manifestChecksum: hash, extensionRevision: null, fields: [] } }), /FORBIDDEN/);
  assert.equal(access.accesses(), 0);
  return true;
}
evaluate().then(features => process.stdout.write(JSON.stringify({ schemaVersion: 1, features })))
  .catch(() => { process.stderr.write("Studio runtime reader probe failed.\n"); process.exitCode = 1; });
