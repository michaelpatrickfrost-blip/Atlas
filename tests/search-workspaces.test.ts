import { beforeEach, expect, it, vi } from "vitest";
import type { ModuleManifest } from "@/core/modules/types";
import type { Session } from "@/core/auth/session";
const state = vi.hoisted(() => ({ modules: [] as unknown[] }));
vi.mock("@/core/modules/runtime", () => ({ getAccessibleModules: async () => state.modules, getModuleNavigation: (module: ModuleManifest) => module.navigation }));
vi.mock("@/core/customers/search", () => ({ searchCustomers: async () => [] }));
import { searchAtlas } from "@/core/search/aggregate";
const parent = { id: "manufacturing", name: "Manufacturing & Supply", navigation: [] } as unknown as ModuleManifest;
const inventory = { id: "stock", name: "Inventory", launcherConsolidatedInto: "manufacturing", navigation: [{ label: "On hand", href: "/stock" }] } as unknown as ModuleManifest;
const products = { id: "products", name: "Products", launcherVisible: false, launcherConsolidatedInto: "manufacturing", navigation: [{ label: "Catalogue", href: "/products" }] } as unknown as ModuleManifest;
beforeEach(() => { state.modules = [parent, inventory, products]; });
it("keeps included stock/product pages searchable under one workspace name", async () => {
  const session = {} as Session;
  expect(await searchAtlas(session, "on hand")).toEqual([expect.objectContaining({ href: "/stock", subtitle: "Manufacturing & Supply" })]);
  expect(await searchAtlas(session, "catalogue")).toEqual([expect.objectContaining({ href: "/products", subtitle: "Manufacturing & Supply" })]);
});
it("retains standalone inventory search without a console and excludes inaccessible owners", async () => {
  state.modules = [inventory];
  expect(await searchAtlas({} as Session, "on hand")).toEqual([expect.objectContaining({ href: "/stock", subtitle: "Inventory" })]);
  expect(await searchAtlas({} as Session, "catalogue")).toEqual([]);
});
