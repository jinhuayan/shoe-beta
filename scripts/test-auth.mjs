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
import { createServer as createHTTPServer } from "node:http";

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
const objects = new Map();
let storageFailure = "";
const storageServer = createHTTPServer(async (req, res) => {
  if (!req.headers.authorization?.startsWith("AWS4-HMAC-SHA256")) { res.writeHead(403).end(); return; }
  if (req.method === storageFailure) { res.writeHead(503).end("<Error><Code>ServiceUnavailable</Code></Error>"); return; }
  const key = new URL(req.url, "http://localhost").pathname;
  if (req.method === "PUT") {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    objects.set(key, Buffer.concat(chunks));
    res.writeHead(200, { ETag: '"fixture"' }).end();
  } else if (req.method === "GET") {
    const bytes = objects.get(key);
    if (!bytes) { res.writeHead(404).end("<Error><Code>NoSuchKey</Code></Error>"); return; }
    res.writeHead(200, { "Content-Type": "image/png", "Content-Length": bytes.length }).end(bytes);
  } else if (req.method === "DELETE") { objects.delete(key); res.writeHead(204).end(); }
  else res.writeHead(405).end();
});
storageServer.listen(0, "127.0.0.1");
await once(storageServer, "listening");
Object.assign(env, { SPACES_ENDPOINT: `http://127.0.0.1:${storageServer.address().port}`, SPACES_BUCKET: "photos-test", SPACES_ACCESS_KEY_ID: "local-test", SPACES_SECRET_ACCESS_KEY: "local-test-secret" });
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
const fitShoeId = `fit-${randomUUID()}`;
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

async function request(path, { method = "GET", body, cookies = new Map(), origin = baseURL, api = "/api/auth" } = {}) {
  const headers = origin ? { Origin: origin } : {};
  const form = body instanceof FormData;
  if (body && !form) headers["Content-Type"] = "application/json";
  if (cookies.size) headers.Cookie = [...cookies.values()].join("; ");
  const response = await fetch(`${baseURL}${api}${path}`, {
    method, headers, body: form ? body : body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000),
  });
  const setCookies = response.headers.getSetCookie();
  for (const cookie of setCookies) {
    const pair = cookie.split(";")[0];
    const name = pair.slice(0, pair.indexOf("="));
    if (/max-age=0/i.test(cookie) || pair.endsWith("=")) cookies.delete(name);
    else cookies.set(name, pair);
  }
  return { status: response.status, body: await response.json(), setCookies, cacheControl: response.headers.get("cache-control") };
}

const profileRequest = (options = {}) => request("", { ...options, api: "/api/profile" });
const recordsRequest = (options = {}) => request("", { ...options, api: "/api/fit-records" });
const recordAnswers = (overrides = {}) => ({ shoeId: fitShoeId, sizeEu: "40.5", fit: "COMFORTABLE", rating: "4", notes: "Heel holds well.\nToes have room.", ...overrides });
function answers(overrides = {}) {
  const data = new FormData();
  for (const [name, value] of Object.entries({
    footLengthMm: "245.1", streetSizeEu: "39.5", width: "NARROW", toeShape: "SECOND_TOE",
    heelVolume: "LOW", experience: "BEGINNER", discipline: "BOULDERING", fitPreference: "COMFORT", ...overrides,
  })) data.set(name, value);
  return data;
}

try {
  await symlink(join(project, ".next"), join(runtime, ".next"), "dir");
  await symlink(join(project, "node_modules"), join(runtime, "node_modules"), "dir");
  await writeFile(join(runtime, "package.json"), JSON.stringify({ name: "shoe-beta-auth-test", private: true }));
  const existing = await pool.query("SELECT to_regclass('public.\"Shoe\"') AS name");
  const shoesBefore = existing.rows[0].name ? (await pool.query('SELECT * FROM "Shoe" ORDER BY id')).rows : null;
  execFileSync("npm", ["run", "db:deploy"], { cwd: project, env, stdio: "inherit" });
  if (shoesBefore) {
    const after = (await pool.query('SELECT * FROM "Shoe" ORDER BY id')).rows;
    assert.deepEqual(after.map((row, i) => Object.fromEntries(Object.keys(shoesBefore[i]).map((key) => [key, row[key]]))), shoesBefore);
  }
  await pool.query('INSERT INTO "Shoe" (id, slug, brand, model, "isSample") VALUES ($1, $2, $3, $4, true)', [fitShoeId, fitShoeId, "Fit test", "Climbing shoe"]);
  const seed = () => execFileSync("npm", ["run", "db:seed"], { cwd: project, env, stdio: "inherit" });
  seed();
  const catalogueBefore = (await pool.query('SELECT * FROM "Shoe" ORDER BY id')).rows;
  const drago = catalogueBefore.find((shoe) => shoe.slug === "scarpa-drago");
  assert.ok(drago?.sourceUrl);
  await pool.query('UPDATE "Shoe" SET description = $1 WHERE id = $2', ["Edited catalogue description", drago.id]);
  seed();
  const catalogueAfter = (await pool.query('SELECT * FROM "Shoe" ORDER BY id')).rows;
  assert.deepEqual(catalogueAfter, catalogueBefore.map((shoe) => shoe.id === drago.id ? { ...shoe, description: "Edited catalogue description" } : shoe));
  await pool.query('UPDATE "Shoe" SET description = $1 WHERE id = $2', [drago.description, drago.id]);
  await start();
  const cataloguePage = await (await fetch(`${baseURL}/shoes`)).text();
  assert.ok(cataloguePage.includes("scarpa-drago"));
  assert.ok(!cataloguePage.includes(fitShoeId));
  const filteredPage = await (await fetch(`${baseURL}/shoes?q=la%20sportiva%20solution&brand=La%20Sportiva&closure=HOOK_AND_LOOP`)).text();
  assert.ok(filteredPage.includes("/shoes/la-sportiva-solution?"));
  assert.ok(!filteredPage.includes("/shoes/scarpa-drago"));
  assert.ok(!filteredPage.includes("/shoes/la-sportiva-solution-comp"));
  assert.match(await (await fetch(`${baseURL}/shoes?q=solution&brand=SCARPA`)).text(), /No climbing shoes match/);
  const detailPage = await (await fetch(`${baseURL}/shoes/scarpa-drago?q=drago&brand=SCARPA`)).text();
  assert.ok(detailPage.includes('https://us.scarpa.com/products/drago'));
  assert.ok(detailPage.includes('2026-11-13'));
  assert.ok(detailPage.includes('/shoes?q=drago&amp;brand=SCARPA'));
  const shortlist = await (await fetch(`${baseURL}/api/recommendations`, { method: "POST", body: answers() })).json();
  assert.equal(shortlist.status, "ranked");
  assert.ok(shortlist.shoes.every((shoe) => !shoe.isSample && !shoe.slug.startsWith("sample-")));
  const widthOnly = await (await fetch(`${baseURL}/api/recommendations`, { method: "POST", body: answers({ width: "WIDE", heelVolume: "UNKNOWN", experience: "UNKNOWN", discipline: "UNKNOWN", fitPreference: "UNKNOWN" }) })).json();
  assert.deepEqual(widthOnly, { status: "empty", shoes: [] });
  console.log("Passed non-destructive catalogue seeding, search, combined filters, source links, and real-shoe recommendations.");

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

  assert.equal((await profileRequest()).status, 401);
  assert.equal((await profileRequest({ method: "PUT", body: answers() })).status, 401);
  assert.deepEqual((await profileRequest({ cookies: aliceCookies })).body, null);
  const saved = await profileRequest({ method: "PUT", cookies: aliceCookies, body: answers() });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.profile.footLengthMm, 245.1);
  assert.equal(saved.body.profile.streetSizeEu, 39.5);
  const updated = await profileRequest({ method: "PUT", cookies: aliceCookies, body: answers({ width: "WIDE" }) });
  assert.equal(updated.status, 200);
  const loaded = await profileRequest({ cookies: aliceCookies });
  assert.equal(loaded.body.profile.width, "WIDE");
  assert.match(loaded.cacheControl, /private/);
  assert.match(loaded.cacheControl, /no-store/);
  const count = await pool.query('SELECT count(*)::int AS count FROM "ClimbingProfile" WHERE "userId" = $1', [alice.body.user.id]);
  assert.equal(count.rows[0].count, 1);

  const other = await request(`?userId=${alice.body.user.id}`, { api: "/api/profile", cookies: bobCookies });
  assert.deepEqual(other.body, null);
  const bobProfile = await profileRequest({ method: "PUT", cookies: bobCookies, body: answers({
    userId: alice.body.user.id, width: "REGULAR", footLengthMm: "", streetSizeEu: "",
    toeShape: "UNKNOWN", heelVolume: "UNKNOWN", experience: "UNKNOWN", discipline: "UNKNOWN", fitPreference: "UNKNOWN",
  }) });
  assert.equal(bobProfile.status, 200);
  assert.equal(bobProfile.body.profile.footLengthMm, null);
  assert.equal(bobProfile.body.profile.streetSizeEu, null);
  assert.equal(bobProfile.body.profile.toeShape, "UNKNOWN");
  assert.equal((await profileRequest({ cookies: bobCookies })).body.profile.width, "REGULAR");
  assert.equal((await profileRequest({ cookies: aliceCookies })).body.profile.width, "WIDE");

  const invalidProfile = await profileRequest({ method: "PUT", cookies: aliceCookies, body: answers({ footLengthMm: "99", width: "BROAD" }) });
  assert.equal(invalidProfile.status, 400);
  assert.ok(invalidProfile.body.errors.footLengthMm && invalidProfile.body.errors.width);
  const duplicate = answers();
  duplicate.append("discipline", "SPORT");
  assert.equal((await profileRequest({ method: "PUT", cookies: aliceCookies, body: duplicate })).status, 400);
  assert.equal((await profileRequest({ method: "PUT", cookies: aliceCookies, body: {} })).status, 400);
  assert.equal((await profileRequest({ method: "PUT", cookies: aliceCookies, body: answers(), origin: "https://example.invalid" })).status, 403);
  assert.equal((await profileRequest({ method: "PUT", cookies: aliceCookies, body: answers(), origin: null })).status, 403);
  assert.equal((await profileRequest({ cookies: aliceCookies })).body.profile.width, "WIDE");
  console.log("Passed profile creation, updates, validation, cache headers, origin checks, and account isolation.");

  assert.equal((await recordsRequest()).status, 401);
  assert.equal((await recordsRequest({ method: "POST", body: recordAnswers() })).status, 401);
  const emptyRecords = await recordsRequest({ cookies: aliceCookies });
  assert.equal(emptyRecords.status, 200);
  assert.deepEqual(emptyRecords.body.records, []);
  assert.ok(emptyRecords.body.shoes.some((shoe) => shoe.id === fitShoeId));
  const firstRecord = await recordsRequest({ method: "POST", cookies: aliceCookies, body: recordAnswers() });
  assert.equal(firstRecord.status, 201);
  assert.equal(firstRecord.body.record.sizeEu, 40.5);
  assert.equal(firstRecord.body.record.rating, 4);
  assert.equal(firstRecord.body.record.notes, recordAnswers().notes);
  assert.equal(firstRecord.body.record.shoe.id, fitShoeId);
  assert.equal(firstRecord.body.record.shoe.isSample, true);
  assert.ok(!Object.hasOwn(firstRecord.body.record, "userId"));
  const secondRecord = await recordsRequest({ method: "POST", cookies: aliceCookies, body: recordAnswers({ sizeEu: "41", fit: "UNKNOWN", rating: "", notes: "" }) });
  assert.equal(secondRecord.status, 201);
  assert.equal(secondRecord.body.record.rating, null);
  assert.notEqual(firstRecord.body.record.id, secondRecord.body.record.id);
  const aliceRecords = await recordsRequest({ cookies: aliceCookies });
  assert.equal(aliceRecords.body.records.length, 2);
  assert.match(aliceRecords.cacheControl, /private/);
  assert.match(aliceRecords.cacheControl, /no-store/);
  const hiddenRecords = await request(`?userId=${alice.body.user.id}`, { api: "/api/fit-records", cookies: bobCookies });
  assert.deepEqual(hiddenRecords.body.records, []);
  const bobRecord = await recordsRequest({ method: "POST", cookies: bobCookies, body: recordAnswers({ userId: alice.body.user.id, id: firstRecord.body.record.id, notes: "Bob's own fitting" }) });
  assert.equal(bobRecord.status, 201);
  assert.notEqual(bobRecord.body.record.id, firstRecord.body.record.id);
  assert.equal((await recordsRequest({ cookies: aliceCookies })).body.records.length, 2);
  const bobRecords = (await recordsRequest({ cookies: bobCookies })).body.records;
  assert.equal(bobRecords.length, 1);
  assert.equal(bobRecords[0].notes, "Bob's own fitting");
  for (const invalid of [
    { sizeEu: "19" }, { sizeEu: "40.25" }, { sizeEu: "4e1" }, { sizeEu: 40 },
    { rating: "6" }, { notes: "x".repeat(1001) }, { fit: "PERFECT" }, { shoeId: "missing-shoe" },
  ]) {
    const rejected = await recordsRequest({ method: "POST", cookies: aliceCookies, body: recordAnswers(invalid) });
    assert.equal(rejected.status, 400);
    assert.ok(Object.keys(rejected.body.errors).length);
  }
  assert.equal((await recordsRequest({ method: "POST", cookies: aliceCookies, body: "bad body" })).status, 400);
  assert.equal((await recordsRequest({ method: "POST", cookies: aliceCookies, body: recordAnswers(), origin: "https://example.invalid" })).status, 403);
  assert.equal((await recordsRequest({ method: "POST", cookies: aliceCookies, body: recordAnswers(), origin: null })).status, 403);
  assert.equal((await recordsRequest({ cookies: aliceCookies })).body.records.length, 2);
  console.log("Passed fit record creation, validation, multiple fittings, cache headers, origin checks, and account isolation.");

  const edited = await recordsRequest({ method: "PATCH", cookies: aliceCookies, body: recordAnswers({ id: firstRecord.body.record.id, userId: bob.body.user.id, sizeEu: "41.5", rating: "", notes: "Updated fitting" }) });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.record.id, firstRecord.body.record.id);
  assert.equal(edited.body.record.createdAt, firstRecord.body.record.createdAt);
  assert.equal(edited.body.record.sizeEu, 41.5);
  assert.equal(edited.body.record.rating, null);
  for (const method of ["PATCH", "DELETE"]) {
    assert.equal((await recordsRequest({ method, cookies: bobCookies, body: recordAnswers({ id: firstRecord.body.record.id }) })).status, 404);
    assert.equal((await recordsRequest({ method, cookies: aliceCookies, body: recordAnswers({ id: "missing-record" }) })).status, 404);
    assert.equal((await recordsRequest({ method, cookies: aliceCookies, body: recordAnswers({ id: "" }) })).status, 400);
    assert.equal((await recordsRequest({ method, body: recordAnswers({ id: firstRecord.body.record.id }) })).status, 401);
    assert.equal((await recordsRequest({ method, cookies: aliceCookies, body: recordAnswers({ id: firstRecord.body.record.id }), origin: "https://example.invalid" })).status, 403);
    assert.equal((await recordsRequest({ method, cookies: aliceCookies, body: recordAnswers({ id: firstRecord.body.record.id }), origin: null })).status, 403);
  }
  assert.equal((await recordsRequest({ method: "PATCH", cookies: aliceCookies, body: recordAnswers({ id: firstRecord.body.record.id, sizeEu: "40.25" }) })).status, 400);
  assert.equal((await recordsRequest({ cookies: aliceCookies })).body.records.find((record) => record.id === firstRecord.body.record.id).sizeEu, 41.5);
  const temporary = await recordsRequest({ method: "POST", cookies: aliceCookies, body: recordAnswers() });
  const deleted = await recordsRequest({ method: "DELETE", cookies: aliceCookies, body: { id: temporary.body.record.id } });
  assert.equal(deleted.status, 200);
  assert.deepEqual(deleted.body, { deleted: true });
  assert.equal((await recordsRequest({ method: "DELETE", cookies: aliceCookies, body: { id: temporary.body.record.id } })).status, 404);
  assert.equal((await recordsRequest({ cookies: aliceCookies })).body.records.length, 2);
  assert.equal((await recordsRequest({ cookies: bobCookies })).body.records.length, 1);
  console.log("Passed editing, deletion, ownership checks, rejected updates, and missing-record handling.");

  const photoURL = `${baseURL}/api/fit-records/${firstRecord.body.record.id}/photo`;
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1sAAAAASUVORK5CYII=", "base64");
  const photoForm = (bytes = png, type = "image/png") => {
    const form = new FormData(); form.set("photo", new Blob([bytes], { type }), "private-name.png"); return form;
  };
  const photoRequest = (method, cookies = aliceCookies, body, origin = baseURL, suffix = "") => fetch(photoURL + suffix, {
    method, headers: { Cookie: [...cookies.values()].join("; "), ...(origin ? { Origin: origin } : {}) }, body,
  });
  assert.equal((await photoRequest("GET", new Map())).status, 401);
  for (const method of ["GET", "POST", "DELETE"]) assert.equal((await photoRequest(method, bobCookies, method === "POST" ? photoForm() : undefined)).status, 404);
  assert.equal((await photoRequest("POST", aliceCookies, photoForm(), "https://example.invalid")).status, 403);
  assert.equal((await photoRequest("GET")).status, 404);
  assert.equal((await photoRequest("POST", aliceCookies, photoForm(Buffer.from("not an image")))).status, 400);
  assert.equal((await photoRequest("POST", aliceCookies, photoForm(png, "image/jpeg"))).status, 400);
  assert.equal((await photoRequest("POST", aliceCookies, photoForm(Buffer.alloc(2 * 1024 * 1024 + 1)))).status, 413);
  const multiple = photoForm(); multiple.append("photo", new Blob([png], { type: "image/png" }), "second.png");
  assert.equal((await photoRequest("POST", aliceCookies, multiple)).status, 400);
  assert.equal(objects.size, 0);
  storageFailure = "PUT";
  assert.equal((await photoRequest("POST", aliceCookies, photoForm())).status, 503);
  storageFailure = "";
  await pool.query('ALTER TABLE "FitPhoto" ADD CONSTRAINT test_reject_photo CHECK (size < 0)');
  assert.equal((await photoRequest("POST", aliceCookies, photoForm())).status, 503);
  await pool.query('ALTER TABLE "FitPhoto" DROP CONSTRAINT test_reject_photo');
  assert.equal(objects.size, 0);
  const uploads = await Promise.all([photoRequest("POST", aliceCookies, photoForm()), photoRequest("POST", aliceCookies, photoForm())]);
  assert.deepEqual(uploads.map((r) => r.status).sort(), [201, 409]);
  assert.equal(objects.size, 1);
  const photoState = (await recordsRequest({ cookies: aliceCookies })).body.records.find((record) => record.id === firstRecord.body.record.id).photo;
  assert.deepEqual(photoState, { recordId: firstRecord.body.record.id });
  const viewed = await photoRequest("GET");
  assert.equal(viewed.status, 200);
  assert.equal(viewed.headers.get("content-type"), "image/png");
  assert.match(viewed.headers.get("cache-control"), /private.*no-store/);
  assert.match(viewed.headers.get("content-disposition"), /^inline/);
  assert.deepEqual(Buffer.from(await viewed.arrayBuffer()), png);
  const download = await photoRequest("GET", aliceCookies, undefined, baseURL, "?download=1");
  assert.match(download.headers.get("content-disposition"), /^attachment/);
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), png);
  assert.equal((await recordsRequest({ method: "DELETE", cookies: aliceCookies, body: { id: firstRecord.body.record.id } })).status, 409);
  storageFailure = "DELETE";
  assert.equal((await photoRequest("DELETE")).status, 503);
  storageFailure = "";
  assert.equal((await photoRequest("GET")).status, 200);
  assert.equal((await photoRequest("DELETE")).status, 200);
  assert.equal((await photoRequest("GET")).status, 404);
  assert.equal((await recordsRequest({ cookies: aliceCookies })).body.records.find((record) => record.id === firstRecord.body.record.id).photo, null);
  assert.equal(objects.size, 0);
  assert.equal((await recordsRequest({ cookies: aliceCookies })).body.records.length, 2);
  console.log("Passed private photo uploads, download, removal, ownership, limits, concurrency, and storage/database failure cleanup.");

  const oldAliceCookies = new Map(aliceCookies);
  assert.equal((await request("/sign-out", { method: "POST", cookies: aliceCookies, body: {} })).status, 200);
  assert.deepEqual((await request("/get-session", { cookies: oldAliceCookies })).body, null);
  assert.equal((await profileRequest({ cookies: oldAliceCookies })).status, 401);
  assert.equal((await profileRequest({ method: "PUT", cookies: oldAliceCookies, body: answers() })).status, 401);
  assert.equal((await recordsRequest({ cookies: oldAliceCookies })).status, 401);
  for (const method of ["PATCH", "DELETE"]) assert.equal((await recordsRequest({ method, cookies: oldAliceCookies, body: recordAnswers({ id: firstRecord.body.record.id }) })).status, 401);
  assert.equal((await recordsRequest({ method: "POST", cookies: oldAliceCookies, body: recordAnswers() })).status, 401);
  const wrong = await request("/sign-in/email", { method: "POST", body: { email: emails[0], password: "Wrong-password-123!" } });
  assert.equal(wrong.status, 401);
  const signedIn = await request("/sign-in/email", { method: "POST", cookies: aliceCookies, body: { email: emails[0], password } });
  assert.equal(signedIn.status, 200);
  await stop();
  await start();
  assert.equal((await request("/get-session", { cookies: aliceCookies })).body.user.id, alice.body.user.id);
  assert.equal((await profileRequest({ cookies: aliceCookies })).body.profile.width, "WIDE");
  assert.equal((await recordsRequest({ cookies: aliceCookies })).body.records.length, 2);
  await pool.query('UPDATE "session" SET "expiresAt" = NOW() - INTERVAL \'1 hour\' WHERE id = $1', [bobSession.session.id]);
  assert.deepEqual((await request("/get-session", { cookies: bobCookies })).body, null);
  assert.equal((await profileRequest({ cookies: bobCookies })).status, 401);
  assert.equal((await profileRequest({ method: "PUT", cookies: bobCookies, body: answers() })).status, 401);
  assert.equal((await recordsRequest({ cookies: bobCookies })).status, 401);
  for (const method of ["PATCH", "DELETE"]) assert.equal((await recordsRequest({ method, cookies: bobCookies, body: recordAnswers({ id: firstRecord.body.record.id }) })).status, 401);
  assert.equal((await recordsRequest({ method: "POST", cookies: bobCookies, body: recordAnswers() })).status, 401);
  console.log("Passed sign-out, wrong-password rejection, sign-in, expiry, and restart persistence.");

  await stop();
  await start(true, true);
  const secure = await request("/sign-in/email", { method: "POST", origin: baseURL.replace("http:", "https:"), body: { email: emails[0], password } });
  assert.equal(secure.status, 200);
  assert.ok(secure.setCookies.some((cookie) => /httponly/i.test(cookie) && /samesite=lax/i.test(cookie) && /; secure/i.test(cookie)));
  console.log("Passed Secure cookie configuration for an HTTPS auth origin.");

  await stop();
  const bucket = env.SPACES_BUCKET;
  delete env.SPACES_BUCKET;
  await start();
  assert.equal((await photoRequest("POST", aliceCookies, photoForm())).status, 503);
  assert.equal((await fetch(`${baseURL}/shoes`)).status, 200);
  env.SPACES_BUCKET = bucket;
  await stop();
  await start(false);
  const unavailable = await request("/get-session");
  assert.equal(unavailable.status, 503);
  assert.deepEqual(unavailable.body, { error: "Authentication is unavailable." });
  assert.equal((await profileRequest()).status, 503);
  assert.equal((await recordsRequest()).status, 503);
  assert.equal((await fetch(`${baseURL}/shoes`)).status, 200);
  console.log("Passed missing-secret handling and public catalogue access.");
} catch (error) {
  console.error(logs);
  throw error;
} finally {
  await stop();
  await pool.query('DELETE FROM "user" WHERE email = ANY($1::text[])', [emails]).catch(() => {});
  await pool.query('DELETE FROM "Shoe" WHERE id = $1', [fitShoeId]).catch(() => {});
  await pool.end();
  storageServer.closeAllConnections();
  await new Promise((resolve) => storageServer.close(resolve));
  await rm(runtime, { recursive: true, force: true });
}
