import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { PrismaClient } from "@/generated/prisma/client";
import { assertStudioRuntimeFeatureEnabled, readStudioRuntimeFeatureEvidence, STUDIO_LITERAL_DEFAULT_FEATURE as FEATURE,
  STUDIO_RUNTIME_FEATURE_FILE as FILE, studioRuntimeFeaturesForPayload } from "@/core/studio/runtime-features";
import { prepareStudioRuntimeFeatureEvidence } from "../scripts/studio/prepare-runtime-features";
import { probeStudioRuntimeFeatures, verifyStudioRuntimeFeaturePair } from "../scripts/studio/runtime-feature-probe";
import { scanStudioRuntimeFeatureCompatibility } from "@/core/studio/registry/runtime-compatibility";
import type { Session } from "@/core/auth/session";
import type { Prisma } from "@/generated/prisma/client";
import { CapabilityRegistry } from "@/core/studio/registry/registry";
import { ticketStudioContract } from "@/core/service-work/studio";
import { compileCustomField } from "@/core/studio/compiler/fields";
import { publishCompiledDefinitionInTransaction, type PublicationDraft } from "@/core/studio/definitions/publication";
import { activateCompiledVersionInTransaction } from "@/core/studio/definitions/activation";

vi.mock("node:child_process", () => ({ spawnSync: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: {} }));
const revision = "a".repeat(40), rollbackRevision = "b".repeat(40), roots: string[] = [];
const evidence = (features: string[] = [FEATURE]) => ({ schemaVersion: 1, releaseRevision: revision, rollbackRevision, features });
function tree(sealed?: string) {
  const root = mkdtempSync(join(tmpdir(), "atlas-runtime-readiness-")); roots.push(root);
  mkdirSync(join(root, "node_modules/tsx/dist"), { recursive: true }); writeFileSync(join(root, "node_modules/tsx/dist/loader.mjs"), "");
  if (sealed) writeFileSync(join(root, ".atlas-ready"), sealed + "\n");
  return root;
}
function marker(root: string, value = evidence()) { writeFileSync(join(root, FILE), JSON.stringify(value)); }
function supports(...sets: string[][]) {
  const mocked = vi.mocked(spawnSync); mocked.mockReset();
  for (const features of sets) mocked.mockReturnValueOnce({ status: 0, signal: null, pid: 1, output: [], stdout: JSON.stringify({ schemaVersion: 1, features }), stderr: "" });
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe("sealed Studio runtime feature evidence", () => {
  it("closes authoring when absent, including an environment enable flag", () => {
    const root = tree(revision); vi.spyOn(process, "cwd").mockReturnValue(root); vi.stubEnv("ATLAS_RELEASE_REVISION", revision);
    vi.stubEnv("ATLAS_STUDIO_LITERAL_DEFAULTS", "1");
    expect(readStudioRuntimeFeatureEvidence()).toBeNull(); expect(() => assertStudioRuntimeFeatureEnabled(FEATURE)).toThrow("UNAVAILABLE");
  });
  it("an accepted bridge with an empty marker remains authoring closed", () => {
    const root = tree(revision); marker(root, evidence([])); vi.spyOn(process, "cwd").mockReturnValue(root); vi.stubEnv("ATLAS_RELEASE_REVISION", revision);
    expect(() => assertStudioRuntimeFeatureEnabled(FEATURE)).toThrow("UNAVAILABLE");
  });
  it("enables only the exact sealed runtime revision", () => {
    const root = tree(revision); marker(root); vi.spyOn(process, "cwd").mockReturnValue(root); vi.stubEnv("ATLAS_RELEASE_REVISION", revision);
    expect(() => assertStudioRuntimeFeatureEnabled(FEATURE)).not.toThrow();
    expect(() => readStudioRuntimeFeatureEvidence(root, rollbackRevision)).toThrow("INVALID");
    writeFileSync(join(root, ".atlas-ready"), rollbackRevision); expect(() => readStudioRuntimeFeatureEvidence(root, revision)).toThrow("INVALID");
  });
  it.each([ { ...evidence(), features: ["futureFeature"] }, { ...evidence(), features: [FEATURE, FEATURE] }, { ...evidence(), enabled: true }, { ...evidence(), rollbackRevision: "bad" } ])
    ("rejects unknown/malformed/duplicate/client-style marker evidence", bad => {
      const root = tree(revision); writeFileSync(join(root, FILE), JSON.stringify(bad)); expect(() => readStudioRuntimeFeatureEvidence(root, revision)).toThrow();
    });
  it("does not rewrite absent historical metadata or treat a null literal as absence", () => {
    const payload = { field: { key: "field" } }; expect(studioRuntimeFeaturesForPayload("customField", payload)).toEqual([]);
    expect(payload).toEqual({ field: { key: "field" } });
    expect(studioRuntimeFeaturesForPayload("customField", { field: { defaultValue: null } })).toEqual([FEATURE]);
    expect(studioRuntimeFeaturesForPayload("capabilitySet", { field: { defaultValue: 0 } })).toEqual([]);
  });
  it("ordinary publication, reviewed binder and activation deny defaults before any transaction effect", async () => {
    const root = tree(revision); marker(root, evidence([])); vi.spyOn(process, "cwd").mockReturnValue(root); vi.stubEnv("ATLAS_RELEASE_REVISION", revision);
    const session: Session = { userId: "user", userName: "User", userEmail: "user@example.invalid", membershipId: "member",
      organisationId: "tenant", organisationName: "Tenant", capabilities: new Set(["studio.definition.publish", "tickets.ticket.read", "tickets.ticket.manage"]) };
    const registry = new CapabilityRegistry(async () => true); registry.register("tickets", ticketStudioContract);
    const entity = registry.describe("tickets.ticket", 2), id = "00000000-0000-4000-8000-000000000001";
    const compiled = await compileCustomField(session, { schemaVersion: 1, entity: { id: entity.id, version: entity.version, schemaHash: entity.schemaHash, contractHash: entity.contractHash },
      storageGeneration: id, field: { key: "readiness", label: "Readiness", classification: "confidential", storage: { type: "integer" }, defaultValue: { type: "integer", value: 0 } } }, registry);
    const draft = { organisationId: "tenant", definitionId: id, revision: 0, definition: { id, organisationId: "tenant", kind: "customField", latestVersion: 0 }, baseVersion: null } as unknown as PublicationDraft;
    const count = vi.fn(), binder = vi.fn(), tx = { moduleState: { count } } as unknown as Prisma.TransactionClient;
    await expect(publishCompiledDefinitionInTransaction(tx, session, draft, 0, compiled)).rejects.toThrow("UNAVAILABLE");
    await expect(publishCompiledDefinitionInTransaction(tx, session, draft, 0, compiled, binder)).rejects.toThrow("UNAVAILABLE");
    await expect(activateCompiledVersionInTransaction(tx, session, id, 0, { id, definitionId: id, organisationId: "tenant", version: 1,
      compiledPlan: compiled.plan, checksum: compiled.checksum }, compiled)).rejects.toThrow("UNAVAILABLE");
    expect(count).not.toHaveBeenCalled(); expect(binder).not.toHaveBeenCalled();
  });
});

describe("original release candidate/rollback probe boundary", () => {
  it("generates a disabled first bridge, then enables a compatible second release", () => {
    const candidate = tree(), previous = tree(rollbackRevision); supports([FEATURE], []);
    expect(prepareStudioRuntimeFeatureEvidence(candidate, previous, revision).features).toEqual([]);
    expect(JSON.parse(readFileSync(join(candidate, FILE), "utf8"))).toEqual(evidence([]));
    const second = tree(); writeFileSync(join(candidate, ".atlas-ready"), revision); supports([FEATURE], [FEATURE]);
    expect(prepareStudioRuntimeFeatureEvidence(second, candidate, "c".repeat(40)).features).toEqual([FEATURE]);
  });
  it("refuses an enabled reader downgrade before writing evidence", () => {
    const candidate = tree(), previous = tree(rollbackRevision); marker(previous, { ...evidence(), releaseRevision: rollbackRevision }); supports([], [FEATURE]);
    expect(() => prepareStudioRuntimeFeatureEvidence(candidate, previous, revision)).toThrow("remove");
  });
  it("never writes to sealed/same candidates or overwrites original evidence", () => {
    const candidate = tree(revision), previous = tree(rollbackRevision);
    expect(() => prepareStudioRuntimeFeatureEvidence(candidate, previous, revision)).toThrow("unsealed");
    expect(() => prepareStudioRuntimeFeatureEvidence(previous, previous, revision)).toThrow("unsealed");
    const unsealed = tree(); marker(unsealed); supports([FEATURE], [FEATURE]);
    expect(() => prepareStudioRuntimeFeatureEvidence(unsealed, previous, revision)).toThrow();
  });
  it("runs each actual root's loader and rejects timeout/import/failure output", () => {
    const root = tree(revision); supports([FEATURE]); expect(probeStudioRuntimeFeatures(root)).toEqual([FEATURE]);
    const [binary, args, options] = vi.mocked(spawnSync).mock.calls.at(-1)!;
    const actual = realpathSync(root);
    expect(binary).toBe(process.execPath); expect(args).toContain(actual); expect(args).toContainEqual(expect.stringContaining(actual + "/node_modules/tsx/dist/loader.mjs"));
    expect(options).toMatchObject({ cwd: actual, timeout: 15000, maxBuffer: 16384 });
    vi.mocked(spawnSync).mockReturnValueOnce({ status: 1, signal: null, pid: 1, output: [], stdout: "", stderr: "private failure" });
    expect(() => probeStudioRuntimeFeatures(root)).toThrow("readiness probe failed");
  });
  it("revalidates sealed prepared pairing and rejects a changed rollback pointer/reader", () => {
    const candidate = tree(revision), previous = tree(rollbackRevision); marker(candidate); supports([FEATURE], [FEATURE]);
    expect(verifyStudioRuntimeFeaturePair(candidate, previous, revision)).toEqual(evidence());
    writeFileSync(join(previous, ".atlas-ready"), "c".repeat(40)); expect(() => verifyStudioRuntimeFeaturePair(candidate, previous, revision)).toThrow("pair");
    writeFileSync(join(previous, ".atlas-ready"), rollbackRevision); supports([FEATURE], []);
    expect(() => verifyStudioRuntimeFeaturePair(candidate, previous, revision)).toThrow("readers");
  });
});

describe("metadata-only reader compatibility independent of authoring marker", () => {
  it("checks retained and active payloads without values and follows suspended Test policy", async () => {
    const row = (id: string, isTest: boolean, status: string) => ({ id, definitionId: "definition", payload: { field: { defaultValue: { type: "boolean", value: false } } },
      definition: { kind: "customField", organisation: { isTest, status } } });
    const findMany = vi.fn().mockResolvedValueOnce([row("1", false, "SUSPENDED"), row("2", true, "ACTIVE"), row("3", true, "SUSPENDED")]).mockResolvedValueOnce([]);
    const client = { studioDefinitionVersion: { findMany } } as unknown as PrismaClient;
    expect(await scanStudioRuntimeFeatureCompatibility(client, [])).toHaveLength(2);
    expect(findMany.mock.calls[0][0]).toMatchObject({ take: 200, select: { id: true, definitionId: true, payload: true } });
    expect(findMany.mock.calls[1][0]).toMatchObject({ cursor: { id: "3" }, skip: 1 });
    expect(JSON.stringify(findMany.mock.calls)).not.toMatch(/fieldValue|serviceWorkItem|auditEntry/);
    findMany.mockResolvedValueOnce([row("1", false, "ACTIVE")]).mockResolvedValueOnce([]);
    expect(await scanStudioRuntimeFeatureCompatibility(client, [FEATURE])).toEqual([]);
  });
});
