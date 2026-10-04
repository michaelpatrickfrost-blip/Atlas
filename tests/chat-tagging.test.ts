import { describe, expect, it, vi } from "vitest";

vi.mock("@/core/db/client", () => ({ db: {} }));
vi.mock("@/core/auth/session", () => ({ requireSession: vi.fn() }));

import { mentionsName } from "@/app/(app)/notices/load";
import { noticeKind } from "@/app/(app)/notices/shape";

describe("chat tagging", () => {
  it("matches a first name or full name after @", () => {
    expect(mentionsName("Can you check this @Sophie?", "Sophie Green")).toBe(true);
    expect(mentionsName("@sophie green please sign off", "Sophie Green")).toBe(true);
    expect(mentionsName("hi (@Sophie)", "Sophie Green")).toBe(true);
  });
  it("ignores plain names, emails and longer names", () => {
    expect(mentionsName("Sophie will do it", "Sophie Green")).toBe(false);
    expect(mentionsName("mail sophie@example.com", "Sophie Green")).toBe(false);
    expect(mentionsName("@Sophiehall is away", "Sophie Green")).toBe(false);
  });
  it("recognises chat notification ids", () => {
    expect(noticeKind("chat:abc123")).toBe("chat");
    expect(noticeKind("chat:../x")).toBeNull();
  });
});
