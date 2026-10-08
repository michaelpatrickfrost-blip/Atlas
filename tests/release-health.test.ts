import { afterEach, expect, it, vi } from "vitest";
import { GET } from "../src/app/api/health/release/route";
afterEach(() => vi.unstubAllEnvs());
it("returns the running pinned revision without caching or exposing other environment", async () => {
  vi.stubEnv("ATLAS_RELEASE_REVISION", "a".repeat(40)); vi.stubEnv("DATABASE_URL", "private database");
  const response = GET(); expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ revision: "a".repeat(40) });
});
it("does not expose malformed release environment as a public value", async () => {
  vi.stubEnv("ATLAS_RELEASE_REVISION", "unexpected private value"); expect(await GET().json()).toEqual({ revision: null });
});
