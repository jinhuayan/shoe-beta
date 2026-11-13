import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, symlink, writeFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

const project = fileURLToPath(new URL("..", import.meta.url));
let calls = 0;
const place = { id: "sample", displayName: { text: "Sample climbing shop" }, formattedAddress: "1 Sample Street", googleMapsUri: "https://maps.google.com/?cid=1", attributions: [{ provider: "Fixture provider", providerUri: "https://example.com/source" }] };
const mock = createServer(async (req, res) => {
  let text = "";
  for await (const chunk of req) text += chunk;
  calls++;
  assert.equal(req.headers["x-goog-api-key"], "shops-test-key");
  assert.equal(req.headers["x-goog-fieldmask"], "places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.businessStatus,places.attributions");
  const query = JSON.parse(text);
  assert.equal(query.pageSize, 10);
  assert.match(query.textQuery, /^climbing shoe retailers near /);
  const area = query.textQuery;
  if (area.includes("Slow")) { setTimeout(() => { if (!res.destroyed) res.end("{}"); }, 9000).unref(); return; }
  if (area.includes("Limited")) { res.writeHead(429).end(JSON.stringify({ error: "provider-secret-error" })); return; }
  if (area.includes("Broken")) { res.writeHead(500).end("provider-secret-error"); return; }
  res.setHeader("Content-Type", "application/json");
  if (area.includes("Malformed")) { res.end("bad json"); return; }
  if (area.includes("Empty")) { res.end("{}"); return; }
  res.end(JSON.stringify({ places: [place, place, { ...place, id: "unsafe", googleMapsUri: "javascript:alert(1)" }] }));
});
mock.listen(0, "127.0.0.1"); await once(mock, "listening");
const reserve = createServer(); reserve.listen(0, "127.0.0.1"); await once(reserve, "listening");
const port = reserve.address().port; await new Promise((resolve) => reserve.close(resolve));
const origin = `http://127.0.0.1:${port}`;
const runtime = await mkdtemp(join(tmpdir(), "shoe-beta-shops-"));
let app, logs = "";
async function stop() {
  if (!app || app.exitCode !== null || app.signalCode !== null) return;
  const timer = setTimeout(() => app.kill("SIGKILL"), 5000); timer.unref();
  app.kill("SIGTERM"); await once(app, "exit"); clearTimeout(timer);
}
async function start(configured = true) {
  const env = { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1", PLACES_TEST_ENDPOINT: `http://127.0.0.1:${mock.address().port}` };
  for (const name of ["GOOGLE_PLACES_API_KEY", "VERCEL", "BETTER_AUTH_SECRET", "DOTENV_CONFIG_PATH"]) delete env[name];
  if (configured) env.GOOGLE_PLACES_API_KEY = "shops-test-key";
  app = spawn(process.execPath, [join(project, "node_modules/next/dist/bin/next"), "start", runtime, "--hostname", "127.0.0.1", "--port", String(port)], { cwd: runtime, env, stdio: ["ignore", "pipe", "pipe"] });
  for (const stream of [app.stdout, app.stderr]) stream.on("data", (chunk) => { logs = (logs + chunk).slice(-16000); });
  for (let i = 0; i < 150; i++) {
    if (app.exitCode !== null) throw new Error("Shop test server exited.");
    try { if ((await fetch(`${origin}/shops`)).ok) return; } catch {}
    await delay(100);
  }
  throw new Error("Shop test server did not become ready.");
}
const search = (body, requestOrigin = origin) => fetch(`${origin}/api/shops`, { method: "POST", headers: { "Content-Type": "application/json", ...(requestOrigin ? { Origin: requestOrigin } : {}) }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
try {
  await symlink(join(project, ".next"), join(runtime, ".next"), "dir");
  await symlink(join(project, "node_modules"), join(runtime, "node_modules"), "dir");
  await writeFile(join(runtime, "package.json"), '{"name":"shops-test","private":true}');
  await start();
  for (const path of ["/shops", "/privacy", "/terms"]) assert.equal((await fetch(origin + path)).status, 200);
  for (const body of [{}, { location: "x" }, { location: "x".repeat(101) }]) assert.equal((await search(body)).status, 400);
  assert.equal((await search({ location: "Toronto" }, null)).status, 403);
  assert.equal((await search({ location: "Toronto" }, "https://example.invalid")).status, 403);
  assert.equal(calls, 0);
  const success = await search({ location: " Toronto " });
  assert.equal(success.status, 200); assert.match(success.headers.get("cache-control"), /no-store/);
  const body = await success.json(); assert.equal(body.location, "Toronto"); assert.equal(body.demo, true); assert.equal(body.shops.length, 1);
  assert.equal(body.shops[0].name, place.displayName.text); assert.equal(body.shops[0].attributions[0].name, "Fixture provider");
  assert.ok(!JSON.stringify(body).includes("shops-test-key"));
  assert.deepEqual((await (await search({ location: "Empty" })).json()).shops, []);
  for (const [area, status] of [["Limited", 429], ["Broken", 503], ["Malformed", 503], ["Slow", 504]]) {
    const response = await search({ location: area }); assert.equal(response.status, status);
    assert.ok(!JSON.stringify(await response.json()).includes("provider-secret-error"));
  }
  let limited = false;
  for (let i = 0; i < 21; i++) if ((await search({ location: "Toronto" })).status === 429) limited = true;
  assert.ok(limited); assert.equal(calls, 20);
  await stop(); await start(false);
  assert.equal((await search({ location: "Toronto" })).status, 503);
  assert.equal(calls, 20);
  console.log("Passed shop search, validation, attribution, safe links, empty/error/timeout/quota states, local budget, and missing configuration.");
} catch (error) { console.error(logs); throw error; }
finally { await stop(); mock.closeAllConnections(); await new Promise((resolve) => mock.close(resolve)); await rm(runtime, { recursive: true, force: true }); }
