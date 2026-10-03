#!/usr/bin/env node
/**
 * One command to run Atlas fully offline on this Mac: starts the local embedded
 * Postgres (scripts/local-postgres.mjs), waits for it to accept connections,
 * applies the schema with `prisma db push` (safe/idempotent for local dev — no
 * shadow database required), seeds demo data on first run, starts `next dev`,
 * then opens the browser. Used by both `npm run dev:all` and the desktop launcher
 * (see docs/LOCAL_DEVELOPMENT.md).
 */
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import net from "node:net";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const port = Number(process.env.ATLAS_LOCAL_PG_PORT ?? 5433);
const dataDir = path.join(root, ".atlas", "pgdata");
const isFirstRun = !fs.existsSync(path.join(dataDir, "PG_VERSION"));

const children = [];
function run(command, args, opts = {}) {
  const child = spawn(command, args, { cwd: root, stdio: "inherit", ...opts });
  children.push(child);
  return child;
}

function shutdown() {
  for (const child of children) child.kill("SIGTERM");
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

async function waitForPort(targetPort, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ok = await new Promise((resolve) => {
      const socket = net.createConnection({ port: targetPort, host: "127.0.0.1" });
      socket.once("connect", () => {
        socket.end();
        resolve(true);
      });
      socket.once("error", () => resolve(false));
    });
    if (ok) return true;
    await sleep(300);
  }
  return false;
}

console.log("[atlas] starting local Postgres...");
run("node", ["scripts/local-postgres.mjs"]);

const reachable = await waitForPort(port);
if (!reachable) {
  console.error(`[atlas] local Postgres did not become reachable on port ${port}`);
  shutdown();
}

console.log("[atlas] syncing database schema...");
await new Promise((resolve) => run("npx", ["prisma", "db", "push"]).on("exit", resolve));

if (isFirstRun) {
  console.log("[atlas] seeding demo data...");
  await new Promise((resolve) => run("npm", ["run", "db:seed"]).on("exit", resolve));
}

console.log("[atlas] starting Next.js dev server...");
run("npm", ["run", "dev"]);

if (process.env.ATLAS_SKIP_OPEN !== "1") {
  const appReachable = await waitForPort(3000, 60000);
  if (appReachable) {
    run("open", ["http://localhost:3000"]);
  }
}
