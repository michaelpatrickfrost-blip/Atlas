// Isolated synthetic acceptance on the server; no business records exported to the Mac.
import fs from "node:fs";
import pg from "pg";
import assert from "node:assert/strict";

const endpoint = process.argv[2] ?? "http://127.0.0.1:3100";
if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(endpoint)) throw new Error("Private loopback only");
const env = Object.fromEntries(fs.readFileSync("/etc/atlas-test/migration.env", "utf8").trim().split("\n").map((line) => {
  const index = line.indexOf("=");
  return [line.slice(0, index), line.slice(index + 1)];
}));
const db = new pg.Client({ connectionString: env.DATABASE_URL });
await db.connect();
const identities = [];
const stamp = crypto.randomUUID().slice(0, 8);
const form = (entries) => ({ __atlas: "form", entries: Object.entries(entries).map(([key, value]) => [key, String(value)]) });
const saveProduct = "src/app/(app)/products/actions:saveProduct";
  const saveRecipe = "src/modules/products/services/make:saveProductRecipe";
  const saveMeasures = "src/app/(app)/products/actions:saveMeasures";

async function action(cookie, key, args) {
  const response = await fetch(endpoint + "/api/desktop/action", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Atlas-Client": "desktop", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ action: key, args }),
  });
  return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
async function query(cookie, model, args) {
  const response = await fetch(endpoint + "/api/desktop/query", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Atlas-Client": "desktop", Cookie: cookie },
    body: JSON.stringify({ model, method: "findMany", args }),
  });
  const body = await response.json();
  assert.equal(response.status, 200, JSON.stringify(body));
  return body.value;
}
async function signup(suffix) {
  const email = `recipe-${stamp}-${suffix}@example.invalid`;
  const password = crypto.randomUUID() + crypto.randomUUID();
  identities.push(email);
  const result = await action(null, "src/app/(auth)/signup/actions:signup", [{ error: "" }, form({ name: "Synthetic " + suffix, company: "Synthetic Recipe " + stamp + " " + suffix, email, password })]);
  assert.equal(result.body.redirect, "/home", JSON.stringify(result.body));
  return { email, cookie: result.cookie };
}

try {
  const owner = await signup("owner");
  const outsider = await signup("outsider");
  for (const [code, name, price] of [["BOARD-" + stamp, "Board", "2.00"], ["FRAME-" + stamp, "Frame", "0"], ["TABLE-" + stamp, "Table", "0"]]) {
    const saved = await action(owner.cookie, saveProduct, [form({ code, name, price, currency: "GBP", unit: "each", kind: "PRODUCT", taxCategory: "STANDARD" })]);
    assert.equal(saved.status, 200, JSON.stringify(saved.body));
  }
  const products = await query(owner.cookie, "product", {});
  const byCode = Object.fromEntries(products.filter((product) => String(product.code).endsWith(stamp) || String(product.code).includes(stamp)).map((product) => [product.code, product.id]));
  const board = byCode["BOARD-" + stamp];
  const frame = byCode["FRAME-" + stamp];
  const table = byCode["TABLE-" + stamp];
  assert.ok(board && frame && table, JSON.stringify(products.map((product) => product.code)));
  const frameSaved = await action(owner.cookie, saveRecipe, [frame, { supply: "WIP", batchQuantity: 10, yieldPercent: 100, lines: [{ componentId: board, quantityPerUnit: 1, scrapPercent: 0 }], operations: [{ name: "Cut", setupMinutes: 60, runMinutesPerUnit: 6, crewSize: 1, machineRate: 60, labourRate: 30, logistics: 0, machineIncludesLabour: false }] }]);
  assert.equal(frameSaved.status, 200, JSON.stringify(frameSaved.body));
  const tableSaved = await action(owner.cookie, saveRecipe, [table, { supply: "MAKE", batchQuantity: 5, yieldPercent: 80, lines: [{ componentId: frame, quantityPerUnit: 1, scrapPercent: 0 }], operations: [] }]);
  assert.equal(tableSaved.status, 200, JSON.stringify(tableSaved.body));
  const loop = await action(owner.cookie, saveRecipe, [board, { supply: "MAKE", batchQuantity: 1, yieldPercent: 100, lines: [{ componentId: board, quantityPerUnit: 1, scrapPercent: 0 }], operations: [] }]);
  assert.ok(loop.status >= 400, "a product was allowed to contain itself");
  const definitions = await query(owner.cookie, "productDefinition", { where: { status: "ACTIVE" }, include: { lines: true } });
  assert.ok(definitions.some((row) => row.productId === frame && row.supply === "WIP"));
  assert.ok(definitions.some((row) => row.productId === table && row.lines.some((line) => line.componentProductId === frame)));
  const leaked = await query(outsider.cookie, "productDefinition", { where: { productId: table } });
  assert.equal(leaked.length, 0);
  const foreign = await action(outsider.cookie, saveRecipe, [table, { supply: "BUY", batchQuantity: 1, yieldPercent: 100, lines: [], operations: [] }]);
  assert.ok(foreign.status >= 400, "another company changed the recipe");
  const weighed = await action(owner.cookie, saveMeasures, [board, { netKg: "1.5", grossKg: "1.8", lengthMm: "200", widthMm: "100", heightMm: "50", originCountry: "gb" }]);
  assert.equal(weighed.status, 200, JSON.stringify(weighed.body));
  const stored = (await db.query('SELECT "netWeightGrams", "grossWeightGrams", "originCountry" FROM products WHERE id = $1', [board])).rows[0];
  assert.equal(stored.netWeightGrams, 1500);
  assert.equal(stored.grossWeightGrams, 1800);
  assert.equal(stored.originCountry, "GB");
  const light = await action(owner.cookie, saveMeasures, [board, { netKg: "5", grossKg: "1" }]);
  assert.ok(light.status >= 400, "gross weight below net was accepted");
  const stolen = await action(outsider.cookie, saveMeasures, [board, { netKg: "9" }]);
  assert.ok(stolen.status >= 400, "another company changed the weight");
  assert.equal((await fetch(endpoint + "/products")).status, 404);
  console.log("PASS: a versioned WIP recipe rolls into the finished product, weight and size stay on the product, a loop is rejected, and another company cannot read or change it.");
} finally {
  for (const email of identities) {
    const rows = (await db.query('SELECT u.id AS userid, m."organisationId" AS org FROM users u LEFT JOIN memberships m ON m."userId" = u.id WHERE u.email = $1', [email])).rows;
    for (const row of rows) {
      if (row.org) {
        await db.query('DELETE FROM roles_on_memberships WHERE "membershipId" IN (SELECT id FROM memberships WHERE "organisationId" = $1)', [row.org]);
        await db.query('DELETE FROM roles WHERE "organisationId" = $1', [row.org]);
        await db.query("DELETE FROM organisations WHERE id = $1", [row.org]);
      }
      await db.query("DELETE FROM users WHERE id = $1", [row.userid]);
    }
  }
  await db.end();
  console.log("Synthetic recipe fixtures removed.");
}
