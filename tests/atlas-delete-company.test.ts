import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  session: { userId: "staff", organisationId: "internal", capabilities: new Set<string>() },
  organisation: vi.fn(),
  user: vi.fn(),
  compare: vi.fn(async (password: string) => password === "correct-password"),
  wipe: vi.fn(),
}));

vi.mock("@/core/auth/session", () => ({ requireSession: async () => state.session }));
vi.mock("@/core/permissions/check", () => ({
  assertCapability: (session: typeof state.session, capability: string) => {
    if (!session.capabilities.has(capability)) throw new Error("FORBIDDEN");
  },
}));
vi.mock("@/core/db/client", () => ({
  db: {
    organisation: { findUnique: state.organisation },
    user: { findUniqueOrThrow: state.user },
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { compare: state.compare } }));
vi.mock("@/core/admin/wipe-company", () => ({ wipeTestCompanies: state.wipe }));

import { deleteTestCompany } from "@/app/(app)/atlas/actions";
import { redirect } from "next/navigation";

function form(values: Record<string, string>) {
  const result = new FormData();
  for (const [key, value] of Object.entries(values)) result.set(key, value);
  return result;
}

const company = {
  id: "test-company",
  name: "Company A",
  kind: "CUSTOMER",
  isTest: true,
  updatedAt: new Date("2026-10-08T10:00:00.000Z"),
};
const validForm = () => form({
  organisationId: company.id,
  confirmName: company.name,
  currentPassword: "correct-password",
});

beforeEach(() => {
  vi.clearAllMocks();
  state.session.organisationId = "internal";
  state.session.capabilities = new Set(["atlas.companies.archive"]);
  state.organisation.mockResolvedValue(company);
  state.user.mockResolvedValue({ passwordHash: "hash" });
  state.compare.mockImplementation(async password => password === "correct-password");
  state.wipe.mockResolvedValue(undefined);
});

describe("Atlas Admin single-company deletion", () => {
  it("requires the archive capability before looking up the company", async () => {
    state.session.capabilities.clear();
    await expect(deleteTestCompany(validForm())).rejects.toThrow("FORBIDDEN");
    expect(state.organisation).not.toHaveBeenCalled();
    expect(state.wipe).not.toHaveBeenCalled();
  });

  it("rejects a wrong company name without deleting", async () => {
    await expect(deleteTestCompany(form({
      organisationId: company.id,
      confirmName: "Wrong name",
      currentPassword: "correct-password",
    }))).rejects.toThrow("Type the company name exactly to confirm.");
    expect(state.user).not.toHaveBeenCalled();
    expect(state.wipe).not.toHaveBeenCalled();
  });

  it("rejects the wrong administrator password without deleting", async () => {
    await expect(deleteTestCompany(form({
      organisationId: company.id,
      confirmName: company.name,
      currentPassword: "wrong-password",
    }))).rejects.toThrow("Confirm your own Atlas sign-in password");
    expect(state.wipe).not.toHaveBeenCalled();
  });

  it("deletes only the confirmed disposable company using the signed-in identity", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    await expect(deleteTestCompany(validForm())).resolves.toBeUndefined();
    expect(state.wipe).toHaveBeenCalledExactlyOnceWith([company.id], {
      actorUserId: "staff",
      currentOrganisationId: "internal",
      selection: [{ id: company.id, name: company.name, updatedAt: company.updatedAt.toISOString() }],
    });
    expect(redirect).toHaveBeenCalledWith("/atlas");
  });
});
