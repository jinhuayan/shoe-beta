import assert from "node:assert/strict";
import test from "node:test";
import { getCatalogueWhere, getShoeFilters } from "./climbing-shoes";
import { catalogue } from "../../prisma/catalogue";

test("normalizes catalogue searches and ignores ambiguous or invalid filters", () => {
  assert.deepEqual(getShoeFilters({ q: "  La Sportiva Solution  ", brand: " SCARPA ", downturn: "NEUTRAL" }), { q: "La Sportiva Solution", brand: "SCARPA", downturn: "NEUTRAL" });
  assert.deepEqual(getShoeFilters({ q: ["Drago", "Solution"], brand: "x".repeat(101), closure: "invalid", stiffness: ["SOFT", "STIFF"] }), {});
  assert.deepEqual(getShoeFilters({ q: "  ", brand: "" }), {});
});

test("combines keyword tokens, brand and attributes while excluding samples", () => {
  const where = getCatalogueWhere(getShoeFilters({ q: "la   solution", brand: "La Sportiva", closure: "HOOK_AND_LOOP" }));
  assert.equal(where.isSample, false);
  assert.deepEqual(where.brand, { equals: "La Sportiva", mode: "insensitive" });
  assert.equal(where.closure, "HOOK_AND_LOOP");
  assert.deepEqual(where.AND, ["la", "solution"].map((word) => ({ OR: [{ brand: { contains: word, mode: "insensitive" } }, { model: { contains: word, mode: "insensitive" } }] })));
  assert.deepEqual(getCatalogueWhere({}), { isSample: false });
});

test("seed entries have unique identities and dated manufacturer sources without invented fit data", () => {
  assert.equal(catalogue.length, 40);
  const sources = new Map([
    ["SCARPA", "us.scarpa.com"], ["La Sportiva", "www.lasportivausa.com"],
    ["Evolv", "www.evolvsports.com"], ["Tenaya", "tenaya.net"],
    ["Mad Rock", "madrock.com"], ["Unparallel", "www.unparallelsports.com"],
  ]);
  assert.deepEqual(new Set(catalogue.map((shoe) => shoe.brand)), new Set(sources.keys()));
  assert.equal(new Set(catalogue.map((shoe) => shoe.slug)).size, catalogue.length);
  for (const shoe of catalogue) {
    const source = new URL(shoe.sourceUrl);
    assert.equal(source.protocol, "https:");
    assert.equal(source.hostname, sources.get(shoe.brand));
    assert.ok(source.pathname !== "/" && !source.search && !source.hash && !source.username && !source.password);
    assert.match(shoe.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    const date = ["SCARPA", "La Sportiva"].includes(shoe.brand) ? "2026-11-13" : "2026-11-15";
    assert.equal(shoe.sourceCheckedAt.toISOString(), `${date}T00:00:00.000Z`);
    assert.equal(shoe.isSample, false);
    assert.equal(shoe.width, "UNKNOWN");
    assert.equal(shoe.heelVolume, "UNKNOWN");
  }
});
