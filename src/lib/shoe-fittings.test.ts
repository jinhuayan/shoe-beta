import assert from "node:assert/strict";
import test from "node:test";
import type { SavedFitRecord } from "./fit-records";
import { groupShoeFittings, readShoeScope } from "./shoe-fittings";

const shoe = { id: "drago", slug: "scarpa-drago", brand: "SCARPA", model: "Drago", isSample: false };
const base: SavedFitRecord = { triedOn: null, location: "", shoeCondition: "UNKNOWN", durationMinutes: null, id: "one", shoe, sizeEu: 40, fit: "TIGHT", toeFit: "TIGHT", forefootFit: "UNKNOWN", heelFit: "COMFORTABLE", notes: "Personal observation", rating: 5, photo: null, createdAt: "2026-11-14T12:00:00Z" };

test("shoe scope accepts one explicit slug and rejects ambiguous or blank queries", () => {
  assert.deepEqual(readShoeScope(new URLSearchParams()), { valid: true, slug: null });
  assert.deepEqual(readShoeScope(new URLSearchParams("shoe=scarpa-drago&userId=other")), { valid: true, slug: "scarpa-drago" });
  for (const query of ["shoe=", "shoe=+", "shoe=a&shoe=a", `shoe=${"a".repeat(101)}`]) assert.equal(readShoeScope(new URLSearchParams(query)).valid, false);
});

test("size history groups exact models and EU sizes without merging conflicting observations", () => {
  const records: SavedFitRecord[] = [
    base,
    { ...base, id: "two", fit: "COMFORTABLE", toeFit: "UNKNOWN", heelFit: "LOOSE" },
    { ...base, id: "three", sizeEu: 39.5, fit: "UNKNOWN" },
    { ...base, id: "four", shoe: { ...shoe, id: "different-variant" }, sizeEu: 40, fit: "LOOSE" },
  ];
  const before = structuredClone(records);
  const sizes = groupShoeFittings(records, shoe.id);
  assert.deepEqual(sizes.map(({ sizeEu, fittings }) => [sizeEu, fittings]), [[39.5, 1], [40, 2]]);
  assert.deepEqual(sizes[1].overall, { UNKNOWN: 0, TIGHT: 1, COMFORTABLE: 1, LOOSE: 0 });
  assert.equal(sizes[0].overall.UNKNOWN, 1);
  assert.equal(sizes[1].toe.UNKNOWN, 1);
  assert.equal(sizes[1].heel.LOOSE, 1);
  assert.equal(sizes[1].forefoot.UNKNOWN, 2);
  assert.deepEqual(records, before);
});

test("size history reflects edited, deleted and empty records without deriving a preferred size", () => {
  assert.deepEqual(groupShoeFittings([], shoe.id), []);
  assert.deepEqual(groupShoeFittings([base], "missing"), []);
  const updated = groupShoeFittings([{ ...base, sizeEu: 41, fit: "LOOSE" }], shoe.id);
  assert.equal(updated[0].sizeEu, 41);
  assert.equal(updated[0].overall.TIGHT, 0);
  assert.equal(updated[0].overall.LOOSE, 1);
  assert.deepEqual(Object.keys(updated[0]).sort(), ["fittings", "forefoot", "heel", "overall", "sizeEu", "toe"]);
});
