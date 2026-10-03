#!/usr/bin/env node
/**
 * A real, locally-installed Postgres server (not a container, not a cloud DB) for
 * offline development on this machine. `embedded-postgres` bundles the actual
 * Postgres binary for this platform (downloaded once via npm install, then fully
 * offline) and manages its lifecycle for us. Data persists to .atlas/pgdata.
 *
 * Usage: node scripts/local-postgres.mjs [start|stop]
 * With no argument, starts the server and keeps running in the foreground until
 * interrupted (Ctrl+C) or sent SIGTERM — used by `npm run dev:all`.
 */
import EmbeddedPostgres from "embedded-postgres";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", ".atlas", "pgdata");
const port = Number(process.env.ATLAS_LOCAL_PG_PORT ?? 5433);
const databaseName = "atlas";

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: true,
});

const isFirstRun = !fs.existsSync(path.join(dataDir, "PG_VERSION"));

async function main() {
  if (isFirstRun) {
    console.log("[atlas] initialising local Postgres data directory (first run)...");
    await pg.initialise();
  }

  await pg.start();
  console.log(`[atlas] local Postgres listening on 127.0.0.1:${port}, data at ${dataDir}`);

  if (isFirstRun) {
    await pg.createDatabase(databaseName);
    console.log(`[atlas] created database "${databaseName}"`);
  }
}

async function shutdown() {
  try {
    await pg.stop();
  } finally {
    process.exit(0);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await main();
