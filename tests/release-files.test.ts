import { afterEach, describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { atomicLink, retainStaticAssets } from "../scripts/deploy/release-files.mjs";
const roots: string[] = [];
const root = () => { const value = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-release-")); roots.push(value); return value; };
afterEach(() => { for (const value of roots.splice(0)) fs.rmSync(value, { recursive: true, force: true }); });
describe("immutable release pointers and old browser assets", () => {
  it("switches and rolls back without changing either release's files", () => {
    const dir = root(), link = path.join(dir, "current");
    for (const version of ["old", "new"]) { fs.mkdirSync(path.join(dir, version)); fs.writeFileSync(path.join(dir, version, "page"), version); }
    atomicLink(path.join(dir, "old"), link);
    const open = fs.openSync(path.join(link, "page"), "r");
    atomicLink(path.join(dir, "new"), link);
    expect(fs.readFileSync(path.join(link, "page"), "utf8")).toBe("new");
    expect(fs.readFileSync(open, "utf8")).toBe("old"); fs.closeSync(open);
    atomicLink(path.join(dir, "old"), link);
    expect(fs.readFileSync(path.join(link, "page"), "utf8")).toBe("old");
    expect(fs.readFileSync(path.join(dir, "new/page"), "utf8")).toBe("new");
  });
  it("refuses to replace a real checkout or its unfinished files", () => {
    const dir = root(), current = path.join(dir, "current"); fs.mkdirSync(current); fs.writeFileSync(path.join(current, "draft"), "unfinished");
    expect(() => atomicLink(path.join(dir, "candidate"), current)).toThrow("symlink");
    expect(fs.readFileSync(path.join(current, "draft"), "utf8")).toBe("unfinished");
  });
  it("rejects an incomplete candidate without changing the working pointer", () => {
    const dir = root(), old = path.join(dir, "old"), current = path.join(dir, "current"); fs.mkdirSync(old); atomicLink(old, current);
    expect(() => atomicLink(path.join(dir, "missing"), current)).toThrow();
    expect(fs.readlinkSync(current)).toBe(old);
    expect(fs.readdirSync(dir).sort()).toEqual(["current", "old"]);
  });
  it("retains old hashed chunks without replacing new collision contents", () => {
    const dir = root(), old = path.join(dir, "old"), next = path.join(dir, "new"); fs.mkdirSync(old); fs.mkdirSync(next);
    fs.writeFileSync(path.join(old, "old-hash.js"), "old tab"); fs.writeFileSync(path.join(old, "shared.js"), "old"); fs.writeFileSync(path.join(next, "shared.js"), "new");
    retainStaticAssets(old, next);
    expect(fs.readFileSync(path.join(next, "old-hash.js"), "utf8")).toBe("old tab");
    expect(fs.readFileSync(path.join(next, "shared.js"), "utf8")).toBe("new");
    expect(fs.readFileSync(path.join(old, "shared.js"), "utf8")).toBe("old");
  });
});
