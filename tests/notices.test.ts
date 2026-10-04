import { describe, expect, it } from "vitest";
import { hideTasksAlreadyListed, noticeKind, type Notice } from "@/app/(app)/notices/shape";

const task = (id: string): Notice => ({ id, group: "Assigned", title: "Pack the order", detail: "Assigned to you", href: "/projects/tasks/t1" });

describe("notification ids", () => {
  it("accepts a tag, an inbox row and an assignment", () => {
    expect(noticeKind("echo:cm123")).toBe("echo");
    expect(noticeKind("inbox:cm456")).toBe("inbox");
    expect(noticeKind("work:task:cm789")).toBe("work");
    expect(noticeKind("work:one-to-one:cm789")).toBe("work");
  });

  it("rejects anything that is not a notice", () => {
    expect(noticeKind("work:drop")).toBeNull();
    expect(noticeKind("../etc")).toBeNull();
    expect(noticeKind("echo:")).toBeNull();
  });

  it("hides an open task when that assignment is already in the list", () => {
    const items = [task("work:task:t1"), task("work:activity:a1")];
    expect(hideTasksAlreadyListed(new Set(["t1"]), items).map((item) => item.id)).toEqual(["work:activity:a1"]);
  });
});
