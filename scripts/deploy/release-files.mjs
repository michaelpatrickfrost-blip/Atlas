import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Never replace a real directory, including an operator's unfinished checkout. */
export function atomicLink(target, link) {
  if (fs.existsSync(link) && !fs.lstatSync(link).isSymbolicLink()) throw new Error("Release pointer must be absent or a symlink.");
  if (!fs.statSync(target).isDirectory()) throw new Error("Release target must be an existing directory.");
  const temporary = `${link}.next-${process.pid}`;
  try { fs.symlinkSync(target, temporary); fs.renameSync(temporary, link); }
  finally { try { fs.unlinkSync(temporary); } catch (error) { if (error.code !== "ENOENT") throw error; } }
}

/** Old open tabs may still request their hashed assets after activation. */
export function retainStaticAssets(previous, candidate) {
  if (!fs.existsSync(previous)) throw new Error("Previous static assets unavailable.");
  fs.mkdirSync(candidate, { recursive: true });
  fs.cpSync(previous, candidate, { recursive: true, force: false, errorOnExist: false, dereference: false });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [command, from, to] = process.argv.slice(2);
  if (!from || !to) throw new Error("Release paths required.");
  if (command === "link") atomicLink(from, to);
  else if (command === "assets") retainStaticAssets(from, to);
  else throw new Error("Use link or assets.");
}
