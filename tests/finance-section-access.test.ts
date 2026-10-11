import { describe, it, expect, vi } from "vitest";
vi.mock("@/core/modules/access", () => ({ assertModuleEnabled: vi.fn() }));
import {
  assertDocumentKindRead,
  documentScope,
} from "@/modules/finance/services/access";
import type { Session } from "@/core/auth/session";
const session = (caps: string[]) =>
  ({
    organisationId: "company",
    userId: "member",
    capabilities: new Set(caps),
  }) as Session;
describe("Finance section delegation", () => {
  it("allows own procurement/expense reads but requires distinct company-wide visibility", () => {
    const requester = session([
      "finance.overview.read",
      "finance.request.create",
    ]);
    expect(() => assertDocumentKindRead(requester, "REQUEST")).not.toThrow();
    expect(() => assertDocumentKindRead(requester, "AR_INVOICE")).toThrow(
      "finance.receivables.read",
    );
    expect(() => assertDocumentKindRead(requester, "EXPENSE")).toThrow(
      "finance.spend.read",
    );
    const scope = documentScope(requester);
    expect(scope.organisationId).toBe("company");
    expect(JSON.stringify(scope)).toContain(
      '"kind":"REQUEST","creatorUserId":"member"',
    );
    expect(JSON.stringify(scope)).not.toContain("SERVICE_CREDIT");
    expect(() =>
      assertDocumentKindRead(session(["finance.expense.create"]), "EXPENSE"),
    ).not.toThrow();
  });
  it("keeps overview entry separate from invoices and bank access", () => {
    const overview = session(["finance.overview.read"]);
    expect(() => assertDocumentKindRead(overview, "AR_INVOICE")).toThrow();
    expect(JSON.stringify(documentScope(overview))).not.toContain(
      "SERVICE_CREDIT",
    );
    expect(() =>
      assertDocumentKindRead(
        session(["finance.receivables.read"]),
        "AR_INVOICE",
      ),
    ).not.toThrow();
    expect(
      JSON.stringify(documentScope(session(["finance.receivables.read"]))),
    ).toContain("SERVICE_CREDIT");
  });
});
