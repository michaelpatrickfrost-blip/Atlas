import { expect, it } from "vitest";
import {
  GUIDES,
  visibleGuides,
  canFollowStep,
  guideForPath,
} from "@/core/guides/catalogue";
it("keeps stock handoff guidance available to Warehouse without Manufacturing rights", () => {
  const visible = visibleGuides(new Set(["stock.read"]), new Set(["stock"]));
  expect(visible.some((g) => g.id === "production-handoff")).toBe(true);
  expect(visible.some((g) => g.id === "manufacturing")).toBe(false);
  expect(guideForPath("/stock/handoffs")).toBe("production-handoff");
});
it("requires both app and explicit capability for Procurement guidance", () => {
  expect(
    visibleGuides(
      new Set(["finance.overview.read"]),
      new Set(["finance"]),
    ).some((g) => g.id === "procurement"),
  ).toBe(false);
  expect(
    visibleGuides(new Set(["finance.purchase.read"]), new Set()).some(
      (g) => g.id === "procurement",
    ),
  ).toBe(false);
  expect(
    visibleGuides(
      new Set(["finance.purchase.read"]),
      new Set(["finance"]),
    ).some((g) => g.id === "procurement"),
  ).toBe(true);
});
it("hides unauthorised source links while retaining plain working instructions", () => {
  const guide = GUIDES.find((g) => g.id === "manufacturing")!;
  const handoff = guide.steps.find((s) => s.href === "/stock/handoffs")!;
  expect(canFollowStep(handoff, new Set(), new Set(["stock"]))).toBe(false);
  expect(canFollowStep(handoff, new Set(["stock.read"]), new Set())).toBe(
    false,
  );
  expect(
    canFollowStep(handoff, new Set(["stock.read"]), new Set(["stock"])),
  ).toBe(true);
  expect(handoff.detail.length).toBeGreaterThan(50);
});
it("gives every guide preparation, actual steps, an outcome and blocker help with unique routes", () => {
  expect(new Set(GUIDES.map((g) => g.id)).size).toBe(GUIDES.length);
  for (const guide of GUIDES) {
    expect(guide.before.length).toBeGreaterThan(0);
    expect(guide.steps.length).toBeGreaterThan(2);
    expect(guide.outcome).toBeTruthy();
    expect(guide.troubleshoot.length).toBeGreaterThan(0);
    for (const s of guide.steps)
      if (s.href) expect(s.href.startsWith("/")).toBe(true);
  }
});

import { guideApps, searchGuideApps } from "@/core/guides/library";
import type { ModuleManifest } from "@/core/modules/types";
it("groups consolidated supply guides under the app and leaves disabled app contributions out", () => {
  const modules = [
    { id: "manufacturing", name: "Manufacturing & Supply", guides: [{ id: "partial", title: "Partial output", summary: "Actual kg", href: "/manufacturing/help/partial-production", category: "Daily work" }] },
    { id: "stock", name: "Inventory", launcherConsolidatedInto: "manufacturing" },
    { id: "products", name: "Products", launcherConsolidatedInto: "manufacturing" },
  ] as ModuleManifest[];
  const apps = guideApps(new Set(["stock.read"]), modules);
  expect(apps.find(app => app.id === "manufacturing")?.guides.map(guide => guide.id)).toEqual(expect.arrayContaining(["stock", "products", "production-handoff", "partial"]));
  expect(apps.some(app => app.id === "stock")).toBe(false);
  expect(apps.some(app => app.id === "fieldservice")).toBe(false);
  expect(searchGuideApps(apps, "kg")[0].guides[0].id).toBe("partial");
  const standalone = guideApps(new Set(["stock.read"]), modules.filter(module => module.id === "stock"));
  expect(standalone.some(app => app.id === "stock")).toBe(true);
  expect(standalone.some(app => app.id === "manufacturing")).toBe(false);
});

import { filterGuideApps } from '@/core/guides/library';
it('keeps legacy Operations links filtered while retaining app grouping and combined search',()=>{
 const apps=[{id:'manufacturing',name:'Manufacturing & Supply',description:'',guides:[{id:'weights',title:'Use kg',summary:'',href:'/weights',category:'Setup' as const,area:'Operations'}]},{id:'finance',name:'Finance',description:'',guides:[{id:'books',title:'Open books',summary:'',href:'/books',category:'Setup' as const,area:'Business'}]}];
 expect(filterGuideApps(apps,{area:'Operations'}).map(app=>app.id)).toEqual(['manufacturing']);
 expect(filterGuideApps(apps,{area:'Operations',q:'kg'})[0].guides[0].id).toBe('weights');
 expect(filterGuideApps(apps,{area:'Operations',app:'finance'})).toEqual([]);
});

it('keeps operational purchasing under Finance while excluding its Business guide', () => {
 const modules=[{id:'finance',name:'Finance'}] as ModuleManifest[];
 const apps=guideApps(new Set(['finance.purchase.read']),modules);
 expect(filterGuideApps(apps,{area:'Operations',app:'finance'})[0].guides.map(guide=>guide.id)).toEqual(['procurement']);
 expect(filterGuideApps(apps,{area:'Business',app:'finance'})[0].guides.map(guide=>guide.id)).toContain('finance');
});
