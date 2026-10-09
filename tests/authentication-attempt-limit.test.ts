import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ query: vi.fn(), execute: vi.fn() }));
vi.mock("@/core/db/client", () => ({ db: { $queryRaw: mocks.query, $executeRaw: mocks.execute } }));
import { allowAuthenticationAttempt, authenticationAttemptKeys } from "@/core/auth/attempt-limit";
const request = new Headers({ "x-forwarded-for": "192.0.2.9" });
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv("SESSION_SECRET", "test-authentication-secret-32-characters-long"); });
afterEach(() => vi.unstubAllEnvs());
describe("shared authentication limits", () => {
  it("hashes identities and uses the trusted final proxy hop", () => {
    const direct = authenticationAttemptKeys(request, "person@example.test", "login");
    expect(authenticationAttemptKeys(new Headers({ "x-forwarded-for": "198.51.100.1, 192.0.2.9" }), "person@example.test", "login")).toEqual(direct);
    expect(direct.ipKey).toMatch(/^[a-f0-9]{64}$/); expect(direct.identityKey).toMatch(/^[a-f0-9]{64}$/);
    expect(authenticationAttemptKeys(request, "other@example.test", "login").identityKey).not.toBe(direct.identityKey);
    expect(authenticationAttemptKeys(request, "person@example.test", "recovery").identityKey).not.toBe(direct.identityKey);
  });
  for (const [ipAttempts, identityAttempts, allowed] of [[60,10,true],[61,1,false],[1,11,false]] as const) it(`enforces IP ${ipAttempts} and identity ${identityAttempts} limits`, async () => {
    const keys = authenticationAttemptKeys(request, "person@example.test", "login");
    mocks.query.mockResolvedValue([{ key: keys.ipKey, attempts: ipAttempts }, { key: keys.identityKey, attempts: identityAttempts }]);
    expect(await allowAuthenticationAttempt(request, "person@example.test", "login")).toBe(allowed);
    expect(mocks.query).toHaveBeenCalledOnce(); expect(mocks.execute).toHaveBeenCalledOnce();
  });
  it("fails closed if the signing secret is missing", () => {
    vi.stubEnv("SESSION_SECRET", "");
    expect(() => authenticationAttemptKeys(request, "person@example.test", "login")).toThrow("unavailable");
    expect(mocks.query).not.toHaveBeenCalled();
  });
});
