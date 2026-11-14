import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSizing, getSizeReference, getSizingGuide } from "./shoe-sizing";

const profile = { streetSizeEu: 40, fitPreference: "PERFORMANCE" } as const;
const shoe = { slug: "scarpa-instinct-vsr", isSample: false };

test("uses the correct model-specific offset and preserves half sizes", () => {
  assert.deepEqual(getSizeReference(shoe, profile).sizes, [38, 38.5, 39]);
  assert.deepEqual(getSizeReference({ ...shoe, slug: "scarpa-vapor-v" }, profile).sizes, [39, 39.5]);
  assert.deepEqual(getSizeReference(shoe, { ...profile, streetSizeEu: 40.5 }).sizes, [38.5, 39, 39.5]);
});

test("keeps comfort, performance and unverified preferences separate", () => {
  const helix = { slug: "scarpa-helix-mens", isSample: false };
  assert.deepEqual(getSizeReference(helix, { ...profile, fitPreference: "COMFORT" }).sizes, [40]);
  assert.deepEqual(getSizeReference(helix, profile).sizes, [39.5]);
  for (const fitPreference of ["BALANCED", "UNKNOWN", "COMFORT"] as const) assert.equal(getSizeReference(shoe, { ...profile, fitPreference }).status, "unavailable");
});

test("does not invent rules for samples, unknown models or ambiguous source units", () => {
  for (const candidate of [{ ...shoe, isSample: true }, { ...shoe, slug: "la-sportiva-solution" }, { ...shoe, slug: "scarpa-drago" }, { ...shoe, slug: "scarpa-origin-vs" }]) {
    const result = getSizeReference(candidate, profile);
    assert.equal(result.status, "unavailable"); assert.deepEqual(result.sizes, []);
  }
  assert.ok(getSizeReference({ ...shoe, slug: "scarpa-drago" }, profile).guide);
});

test("requires a valid EU baseline instead of converting foot length or rounding inputs", () => {
  for (const streetSizeEu of [null, NaN, Infinity, 19.5, 55.5, 40.25]) assert.equal(getSizeReference(shoe, { ...profile, streetSizeEu }).status, "unavailable");
  assert.match(getSizeReference(shoe, { ...profile, streetSizeEu: null }).explanation, /Foot length alone/);
});

test("respects offered size bounds and whole-size-only sections without clamping", () => {
  assert.equal(getSizeReference(shoe, { ...profile, streetSizeEu: 36 }).status, "unavailable");
  assert.equal(getSizeReference(shoe, { ...profile, streetSizeEu: 49.5 }).status, "unavailable");
  assert.deepEqual(getSizeReference({ ...shoe, slug: "scarpa-instinct-vs-mens" }, { ...profile, streetSizeEu: 49.5 }).sizes, [48]);
  assert.equal(getSizeReference({ ...shoe, slug: "scarpa-helix-mens" }, { ...profile, streetSizeEu: 48 }).status, "unavailable");
});

test("rejects contradictory and malformed sizing rules", () => {
  const guide = getSizingGuide(shoe.slug)!;
  for (const rule of [{ minDown: 2, maxDown: 1 }, { minDown: -1, maxDown: 1 }, { minDown: 0.25, maxDown: 1 }, { minDown: NaN, maxDown: 1 }]) {
    assert.equal(evaluateSizing({ ...guide, rules: { PERFORMANCE: rule } }, profile).status, "unavailable");
  }
});

test("includes exact-variant sources and a fixed review date", () => {
  const guide = getSizeReference(shoe, profile).guide!;
  assert.equal(guide.sourceUrl, "https://us.scarpa.com/products/instinct-vsr");
  assert.equal(guide.checkedAt, "2026-11-13");
  assert.notDeepEqual(getSizeReference({ ...shoe, slug: "scarpa-drago" }, profile), getSizeReference({ ...shoe, slug: "scarpa-drago-lv" }, profile));
});

test("verified guides list unique half/whole sizes and do not use foot length", () => {
  for (const slug of ["scarpa-drago-lv", "scarpa-instinct-vs-mens", "scarpa-instinct-vsr", "scarpa-helix-mens", "scarpa-vapor-v"]) {
    const guide = getSizingGuide(slug)!;
    assert.equal(new Set(guide.sizes).size, guide.sizes.length);
    assert.ok(guide.sizes.every((size) => Number.isInteger(size * 2) && size >= 20 && size <= 55));
    assert.deepEqual(guide.sizes, [...guide.sizes].sort((a, b) => a - b));
  }
  const shortFoot = { ...profile, footLengthMm: 200 };
  const longFoot = { ...profile, footLengthMm: 300 };
  assert.deepEqual(getSizeReference(shoe, shortFoot), getSizeReference(shoe, longFoot));
});
