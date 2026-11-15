import assert from "node:assert/strict";

const [target, ...options] = process.argv.slice(2);
assert.ok(target, "Usage: npm run test:smoke -- https://your-deployment.example [--shops]");
const base = new URL(target);
assert.ok(!base.username && !base.password && base.pathname === "/" && !base.search && !base.hash, "Use the deployment origin without credentials, a path or query.");
assert.ok(base.protocol === "https:" || (base.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)), "Use HTTPS, or HTTP on localhost.");
assert.ok(options.every((option) => option === "--shops"), "Only --shops is supported.");
const origin = base.origin;

async function request(path, options = {}) {
  try {
    return await fetch(origin + path, { ...options, redirect: "error", signal: AbortSignal.timeout(20000) });
  } catch (error) {
    throw new Error(`${path}: request failed (${error.name}).`, { cause: error });
  }
}

for (const [path, heading] of [["/shoes", "Climbing shoe catalogue"], ["/questionnaire", "Your feet and climbing"], ["/compare", "Compare climbing shoes"], ["/sign-in", "Sign in"]]) {
  const response = await request(path);
  assert.equal(response.status, 200, `${path} must load.`);
  const html = await response.text();
  assert.ok(html.includes(heading), `${path} is missing its heading.`);
  assert.ok(!html.includes("The catalogue is unavailable right now.") && !html.includes("Comparison is unavailable"), `${path} rendered an error boundary.`);
  console.log(`Passed page: ${path}`);
}

for (const path of ["/api/profile", "/api/fit-records", "/api/saved-shoes", "/api/dashboard", "/api/account/export", "/api/account/sessions", "/api/shoes/scarpa-helix-mens/personal"]) {
  const response = await request(path);
  assert.equal(response.status, 401, `${path} must reject a guest.`);
  assert.match(response.headers.get("cache-control") ?? "", /private.*no-store/, `${path} must not be shared or cached.`);
  await response.body.cancel();
}
console.log("Passed guest access and private cache controls.");

const session = await request("/api/auth/get-session");
assert.equal(session.status, 200, "Authentication must be configured.");
assert.equal(await session.json(), null, "A guest must have no session.");

const answers = new URLSearchParams({ footLengthMm: "", streetSizeEu: "39.5", width: "UNKNOWN", toeShape: "UNKNOWN", heelVolume: "UNKNOWN", experience: "BEGINNER", discipline: "UNKNOWN", fitPreference: "COMFORT" });
const recommendations = await request("/api/recommendations", { method: "POST", headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" }, body: answers });
assert.equal(recommendations.status, 200, "Guest recommendations must work.");
assert.match(recommendations.headers.get("cache-control") ?? "", /no-store/);
const shortlist = await recommendations.json();
assert.equal(shortlist.status, "ranked");
assert.ok(Array.isArray(shortlist.shoes) && shortlist.shoes.length > 0 && shortlist.shoes.length <= 3);
assert.ok(shortlist.shoes.every((shoe) => typeof shoe.slug === "string" && !shoe.isSample));
console.log("Passed guest recommendations from the live catalogue.");

if (options.includes("--shops")) {
  const response = await request("/api/shops", { method: "POST", headers: { Origin: origin, "Content-Type": "application/json" }, body: JSON.stringify({ location: "Toronto, ON" }) });
  assert.equal(response.status, 200, "Shop search must be configured and reachable.");
  const result = await response.json();
  assert.ok(Array.isArray(result.shops));
  assert.equal(result.demo, false, "Production must use the real Places provider.");
  console.log(`Passed real Places search: ${result.shops.length} matches.`);
} else console.log("Real Places search skipped; use --shops for one provider request.");

console.log(`Read-only smoke checks passed for ${origin}. No accounts or records were created.`);
