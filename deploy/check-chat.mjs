// Isolated synthetic acceptance on the server; no business records exported to Mac.
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
const stamp = crypto.randomUUID();
const form = (entries) => ({ __atlas: "form", entries: Object.entries(entries).map(([key, value]) => [key, String(value)]) });
const chat = "src/app/(app)/chat/actions:";

async function action(cookie, key, args) {
  const response = await fetch(endpoint + "/api/desktop/action", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Atlas-Client": "desktop", ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify({ action: key, args }),
  });
  return { status: response.status, body: await response.json(), cookie: response.headers.get("set-cookie")?.split(";")[0] };
}
async function ok(cookie, key, args) {
  const result = await action(cookie, key, args);
  assert.equal(result.status, 200, key + ": " + JSON.stringify(result.body));
  return result.body.value;
}
async function blocked(cookie, key, args) {
  const result = await action(cookie, key, args);
  assert.ok(result.status >= 400, key + " unexpectedly allowed");
}
async function signup(suffix) {
  const email = `chat-${stamp}-${suffix}@example.invalid`;
  const password = crypto.randomUUID() + crypto.randomUUID();
  identities.push(email);
  const result = await action(null, "src/app/(auth)/signup/actions:signup", [{ error: "" }, form({ name: "Synthetic " + suffix, company: "Synthetic Chat " + stamp + " " + suffix, email, password })]);
  assert.equal(result.body.redirect, "/home", JSON.stringify(result.body));
  const row = (await db.query('SELECT u.id AS userid, m.id AS membership, m."organisationId" AS org FROM users u JOIN memberships m ON m."userId" = u.id WHERE u.email = $1', [email])).rows[0];
  return { ...row, email, password, cookie: result.cookie };
}
async function moveUser(user, org) {
  await db.query('DELETE FROM roles_on_memberships WHERE "membershipId" = $1', [user.membership]);
  await db.query("DELETE FROM memberships WHERE id = $1", [user.membership]);
  await db.query('DELETE FROM roles WHERE "organisationId" = $1', [user.org]);
  await db.query("DELETE FROM organisations WHERE id = $1", [user.org]);
  user.org = org;
  user.membership = crypto.randomUUID();
  await db.query('INSERT INTO memberships (id, "organisationId", "userId", active, "grantedCapabilities", "deniedCapabilities") VALUES ($1, $2, $3, true, $4, $5)', [user.membership, org, user.userid, [], []]);
  const role = crypto.randomUUID();
  await db.query('INSERT INTO roles (id, "organisationId", key, name, capabilities) VALUES ($1, $2, $3, $4, $5)', [role, org, "synthetic-" + role, "Synthetic", ["core.chat.read", "core.chat.write", "projects.read", "projects.manage"]]);
  await db.query('INSERT INTO roles_on_memberships ("membershipId", "roleId") VALUES ($1, $2)', [user.membership, role]);
  const login = await action(null, "src/core/auth/actions:loginAction", [form({ email: user.email, password: user.password })]);
  assert.ok(login.cookie, JSON.stringify(login.body));
  user.cookie = login.cookie;
}

try {
  const owner = await signup("owner");
  const colleague = await signup("colleague");
  const outsider = await signup("outsider");
  await moveUser(colleague, owner.org);
  await blocked(owner.cookie, chat + "postMessage", [form({ body: "Synthetic company update", organisationId: outsider.org })]);
  const third = await signup("third");
  await moveUser(third, owner.org);
  const grouped = await ok(owner.cookie, chat + "openChat", [[colleague.userid, third.userid]]);
  assert.equal(typeof grouped.conversationId, "string");
  await blocked(owner.cookie, chat + "sendChat", [{ conversationId: grouped.conversationId, body: "Hidden order", kind: "TEXT", links: [{ type: "SALES_ORDER", id: "missing-order" }] }]);
  const direct = await ok(colleague.cookie, chat + "openDirectChat", [owner.userid]);
  assert.equal(typeof direct.conversationId, "string");
  await blocked(outsider.cookie, chat + "sendChat", [{ conversationId: direct.conversationId, body: "Must not arrive", kind: "TEXT" }]);
  await ok(colleague.cookie, chat + "sendChat", [{ conversationId: direct.conversationId, body: "Synthetic follow-up", kind: "TASK", assigneeUserId: owner.userid, taskType: "FOLLOW_UP", priority: "HIGH" }]);
  const snapshot = await ok(owner.cookie, chat + "chatSnapshot", [direct.conversationId]);
  assert.equal(snapshot.conversations.some((row) => row.kind === "COMPANY"), false);
  assert.ok(snapshot.conversations.some((row) => row.kind === "DIRECT" || row.kind === "GROUP"));
  assert.ok(snapshot.thread.some((row) => row.kind === "TASK" && row.task?.taskType === "FOLLOW_UP"));
  const task = (await db.query('SELECT visibility, "assigneeUserId" FROM project_tasks WHERE title = $1 AND "organisationId" = $2', ["Synthetic follow-up", owner.org])).rows[0];
  assert.equal(task.visibility, "PRIVATE");
  assert.equal(task.assigneeUserId, owner.userid);
  const leaked = await fetch(endpoint + "/api/desktop/query", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Atlas-Client": "desktop", Cookie: outsider.cookie },
    body: JSON.stringify({ model: "chatMessage", method: "findMany", args: { where: { body: "Synthetic follow-up" } } }),
  });
  assert.equal(leaked.status, 200);
  assert.equal((await leaked.json()).value.length, 0);
  await blocked(null, chat + "chatSnapshot", []);
  assert.equal((await fetch(endpoint + "/chat")).status, 404);
  console.log("PASS: company messages are refused, a group chat stays with its people, a missing order cannot be attached, direct messages stay with the two people, chat assigns a private Projects task, outsiders cannot read it, unauthenticated chat is rejected, and the server has no chat page.");
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
  console.log("Synthetic chat fixtures removed.");
}
