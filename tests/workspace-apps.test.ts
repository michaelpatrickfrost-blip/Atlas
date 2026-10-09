import { expect, it } from "vitest";
import { getModule } from "@/core/modules/registry";
import { groupWorkspaceApps } from "@/core/modules/workspaces";
it("shows one Manufacturing app card while retaining each feature's exact access switches", () => {
  const states = ["manufacturing", "planning", "stock", "products", "finance"].map((id) => ({ module: getModule(id)!, enabled: id !== "planning", entitled: id !== "products" }));
  const apps = groupWorkspaceApps(states);
  expect(apps.map(({ module }) => module.id)).toEqual(["manufacturing", "finance"]);
  expect(apps[0].features).toEqual(states.slice(1, 4));
  const preserved = apps.flatMap(({ features, module, enabled, entitled }) => [{ module, enabled, entitled }, ...features]);
  expect(preserved.sort((a, b) => a.module.id.localeCompare(b.module.id))).toEqual([...states].sort((a, b) => a.module.id.localeCompare(b.module.id)));
});
it("retains standalone access management when the receiving workspace is absent", () => {
  const states = [{ module: getModule("stock")!, enabled: true, entitled: true }];
  expect(groupWorkspaceApps(states)).toEqual([{ ...states[0], features: [] }]);
});
