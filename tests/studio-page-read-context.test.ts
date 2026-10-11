import { expect, it } from "vitest";
import { pageReadScope } from "@/core/studio/pages/definition-compiler";
import type { CompiledPagePlan } from "@/core/studio/pages/compiler";
import type { PageSourcePolicy } from "@/core/studio/pages/owner-contract";

const dependency = (id: string, version = 1): CompiledPagePlan["dependencies"][number] => ({ id, version,
  schemaHash: "a".repeat(64), contractHash: "b".repeat(64), ownerModuleId: "sales", kind: "query", classification: "confidential" });
const policy: Pick<PageSourcePolicy, "queries"> = { queries: [
  { query: { id: "sales.orders", version: 1 }, scope: "list", purpose: "list", columns: [] },
  { query: { id: "sales.order.header", version: 1 }, scope: "record", purpose: "fact", columns: [] },
  { query: { id: "sales.order.lines", version: 1 }, scope: "record", purpose: "list", columns: [] },
] };
it("keeps related line tables in their owning record context", () => {
  expect(pageReadScope({ dependencies: [dependency("sales.order.header"), dependency("sales.order.lines")] }, policy)).toBe("record");
});
it("uses only exact registered query generations when choosing list context", () => {
  expect(pageReadScope({ dependencies: [dependency("sales.orders")] }, policy)).toBe("list");
  expect(pageReadScope({ dependencies: [dependency("sales.orders", 2)] }, policy)).toBe("record");
  expect(pageReadScope({ dependencies: [] }, policy)).toBe("record");
});
it("rejects mixed canonical list/record anchors including dependencies used by variants", () => {
  expect(() => pageReadScope({ dependencies: [dependency("sales.orders"), dependency("sales.order.header")] }, policy)).toThrow("mixing");
});
