import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const project = fileURLToPath(new URL("..", import.meta.url));
const testURL = process.env.TEST_DATABASE_URL;
let database;
try {
  database = new URL(testURL ?? "");
} catch {
  throw new Error("Set TEST_DATABASE_URL to a local shoe_beta_auth_test database.");
}
assert.ok(["postgres:", "postgresql:"].includes(database.protocol)
  && ["localhost", "127.0.0.1", "[::1]"].includes(database.hostname)
  && database.pathname === "/shoe_beta_auth_test", "Auth tests require a local shoe_beta_auth_test database.");

const env = { ...process.env, DATABASE_URL: testURL, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" };
for (const name of ["DOTENV_CONFIG_PATH", "DATABASE_URL_POOLED", "BETTER_AUTH_SECRET", "BETTER_AUTH_SECRETS", "BETTER_AUTH_URL", "VERCEL_URL"]) delete env[name];
const pool = new pg.Pool({ connectionString: testURL, max: 1, connectionTimeoutMillis: 3000 });
const server = createServer();
server.listen(0, "127.0.0.1");
await once(server, "listening");
const port = server.address().port;
await new Promise((resolve) => server.close(resolve));
const baseURL = `http://127.0.0.1:${port}`;
const secret = randomBytes(32).toString("base64");
const runtime = await mkdtemp(join(tmpdir(), "shoe-beta-auth-"));
const emails = [`alice-${randomUUID()}@example.test`, `bob-${randomUUID()}@example.test`];
const password = "Climbing-test-password-123!";
let app;
let logs = "";

async function stop() {
  if (!app || app.exitCode !== null || app.signalCode !== null) return;
  const child = app;
  const timeout = setTimeout(() => child.kill("SIGKILL"), 5000);
  timeout.unref();
  child.kill("SIGTERM");
  await once(child, "exit");
  clearTimeout(timeout);
}

async function start(configured = true, https = false) {
  logs = "";
  const appEnv = { ...env, BETTER_AUTH_URL: https ? baseURL.replace("http:", "https:") : baseURL };
  if (configured) {
    appEnv.BETTER_AUTH_SECRET = secret;
    appEnv.DATABASE_URL_POOLED = testURL;
    delete appEnv.DATABASE_URL;
  }
  app = spawn(process.execPath, [join(project, "node_modules/next/dist/bin/next"), "start", runtime, "--hostname", "127.0.0.1", "--port", String(port)], {
    cwd: runtime, env: appEnv, stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [app.stdout, app.stderr]) stream.on("data", (chunk) => { logs = (logs + chunk).slice(-32000); });
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    assert.ok(app.exitCode === null && app.signalCode === null, "Test server exited before becoming ready.");
    try {
      const response = await fetch(`${baseURL}/questionnaire`, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error("Test server did not become ready.");
}

async function request(path, { method = "GET", body, cookies = new Map(), origin = baseURL } = {}) {
  const headers = { Origin: origin };
  if (body) headers["Content-Type"] = "application/json";
  if (cookies.size) headers.Cookie = [...cookies.values()].join("; ");
  const response = await fetch(`${baseURL}/api/auth${path}`, {
    method, headers, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
  });
  const setCookies = response.headers.getSetCookie();
  for (const cookie of setCookies) {
    const pair = cookie.split(";")[0];
    const name = pair.slice(0, pair.indexOf("="));
    if (/max-age=0/i.test(cookie) || pair.endsWith("=")) cookies.delete(name);
    else cookies.set(name, pair);
  }
  return { status: response.status, body: await response.json(), setCookies };
}

try {
  await symlink(join(project, ".next"), join(runtime, ".next"), "dir");
  await symlink(join(project, "node_modules"), join(runtime, "node_modules"), "dir");
  await writeFile(join(runtime, "package.json"), JSON.stringify({ name: "shoe-beta-auth-test", private: true }));
  const existing = await pool.query("SELECT to_regclass('public.\"Shoe\"') AS name");
  const shoesBefore = existing.rows[0].name ? (await pool.query('SELECT * FROM "Shoe" ORDER BY id')).rows : null;
  execFileSync("npm", ["run", "db:deploy"], { cwd: project, env, stdio: "inherit" });
  if (shoesBefore) assert.deepEqual((await pool.query('SELECT * FROM "Shoe" ORDER BY id')).rows, shoesBefore);
  await start();

  assert.deepEqual((await request("/get-session")).body, null);
  const invalid = await request("/sign-up/email", { method: "POST", body: { name: "Test", email: emails[0], password: "short" } });
  assert.equal(invalid.status, 400);
  const aliceCookies = new Map();
  const bobCookies = new Map();
  const alice = await request("/sign-up/email", { method: "POST", cookies: aliceCookies, body: { name: "Alice", email: emails[0], password } });
  assert.equal(alice.status, 200);
  assert.equal(alice.body.user.email, emails[0]);
  assert.ok(alice.setCookies.some((cookie) => /httponly/i.test(cookie) && /samesite=lax/i.test(cookie)));
  assert.ok(!JSON.stringify(alice.body).includes(password));
  const bob = await request("/sign-up/email", { method: "POST", cookies: bobCookies, body: { name: "Bob", email: emails[1], password } });
  assert.equal(bob.status, 200);
  const stored = await pool.query('SELECT password FROM "account" WHERE "userId" = $1', [alice.body.user.id]);
  assert.ok(stored.rows[0].password && stored.rows[0].password !== password);
  console.log("Passed registration, password validation, hashing, and cookie flags.");

  const aliceSession = (await request("/get-session", { cookies: aliceCookies })).body;
  const bobSession = (await request("/get-session", { cookies: bobCookies })).body;
  assert.equal(aliceSession.user.id, alice.body.user.id);
  assert.equal(bobSession.user.id, bob.body.user.id);
  const listed = await request("/list-sessions", { cookies: aliceCookies });
  assert.equal(listed.status, 200);
  assert.ok(listed.body.every((session) => session.userId === alice.body.user.id));
  const revoke = await request("/revoke-session", { method: "POST", cookies: aliceCookies, body: { token: bobSession.session.token } });
  assert.equal(revoke.status, 200);
  assert.deepEqual(revoke.body, { status: true });
  assert.equal((await request("/get-session", { cookies: bobCookies })).body.user.id, bob.body.user.id);
  const forbidden = await request("/sign-out", { method: "POST", cookies: aliceCookies, body: {}, origin: "https://example.invalid" });
  assert.equal(forbidden.status, 403);
  assert.equal((await request("/get-session", { cookies: aliceCookies })).body.user.id, alice.body.user.id);
  console.log("Passed session ownership and origin checks.");

  const oldAliceCookies = new Map(aliceCookies);
  assert.equal((await request("/sign-out", { method: "POST", cookies: aliceCookies, body: {} })).status, 200);
  assert.deepEqual((await request("/get-session", { cookies: oldAliceCookies })).body, null);
  const wrong = await request("/sign-in/email", { method: "POST", body: { email: emails[0], password: "Wrong-password-123!" } });
  assert.equal(wrong.status, 401);
  const signedIn = await request("/sign-in/email", { method: "POST", cookies: aliceCookies, body: { email: emails[0], password } });
  assert.equal(signedIn.status, 200);
  await stop();
  await start();
  assert.equal((await request("/get-session", { cookies: aliceCookies })).body.user.id, alice.body.user.id);
  await pool.query('UPDATE "session" SET "expiresAt" = NOW() - INTERVAL \'1 hour\' WHERE id = $1', [bobSession.session.id]);
  assert.deepEqual((await request("/get-session", { cookies: bobCookies })).body, null);
  console.log("Passed sign-out, wrong-password rejection, sign-in, expiry, and restart persistence.");

  await stop();
  await start(true, true);
  const secure = await request("/sign-in/email", { method: "POST", origin: baseURL.replace("http:", "https:"), body: { email: emails[0], password } });
  assert.equal(secure.status, 200);
  assert.ok(secure.setCookies.some((cookie) => /httponly/i.test(cookie) && /samesite=lax/i.test(cookie) && /; secure/i.test(cookie)));
  console.log("Passed Secure cookie configuration for an HTTPS auth origin.");

  await stop();
  await start(false);
  const unavailable = await request("/get-session");
  assert.equal(unavailable.status, 503);
  assert.deepEqual(unavailable.body, { error: "Authentication is unavailable." });
  assert.equal((await fetch(`${baseURL}/shoes`)).status, 200);
  console.log("Passed missing-secret handling and public catalogue access.");
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  await stop();
  await pool.query('DELETE FROM "user" WHERE email = ANY($1::text[])', [emails]).catch(() => {});
  await pool.end();
  await rm(runtime, { recursive: true, force: true });
}
