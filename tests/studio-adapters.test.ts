import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { templateProviderAdapter } from "@/core/studio/registry/adapters";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import type { ModuleManifest } from "@/core/modules/types";
import type { Session } from "@/core/auth/session";
const session: Session = { userId: "a", membershipId: "m", userName: "A", userEmail: "a@example.invalid", organisationName: "A", organisationId: "tenant-a", capabilities: new Set(["projects.read"]) };
const record = { id: "p", type: "project", label: "Private project", href: "/projects/p", partyId: null, fields: { "record.name": "Visible project" } };
function setup() {
  const get = vi.fn(async (s: Session, _type: string, id: string) => s.organisationId === "tenant-a" && id === "p" ? record : null);
  const list = vi.fn(async () => [record]);
  const manifest = { id: "projects", templateContextProvider: { types: [{ id: "project", label: "Project", capability: "projects.read" }], get, list } } as unknown as ModuleManifest;
  const registry = new CapabilityRegistry(async () => true);
  registry.register(manifest.id, { contributions: templateProviderAdapter(manifest) });
  return { registry, get, list };
}
describe("Studio existing template provider adapter", () => {
  it("delegates canonical reads to the owner with the same session and field whitelist", async () => {
    const { registry, get } = setup();
    const m = registry.describe("projects.template.project.get", 1);
    expect(await registry.invoke(session, m, { id: "p" })).toEqual(record);
    expect(get).toHaveBeenCalledWith(session, "project", "p");
    expect(await registry.invoke({ ...session, organisationId: "tenant-b" }, m, { id: "p" })).toBeNull();
    expect(z.array(z.string()).parse((await registry.discover(session)).map(d => d.id))).toHaveLength(3);
  });
  it("denies missing source permissions before the provider runs", async () => {
    const { registry, get } = setup();
    await expect(registry.invoke({ ...session, capabilities: new Set() }, registry.describe("projects.template.project.get", 1), { id: "p" })).rejects.toThrow("FORBIDDEN");
    expect(get).not.toHaveBeenCalled();
  });
});
