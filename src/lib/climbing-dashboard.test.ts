import assert from "node:assert/strict";
import test from "node:test";
import { savedShoeProgress } from "./climbing-dashboard";

const shoes = [
  { id: "new", slug: "new", brand: "SCARPA", model: "Drago", isSample: false },
  { id: "tried", slug: "tried", brand: "SCARPA", model: "Drago", isSample: false },
  { id: "sample", slug: "sample", brand: "Sample", model: "Training", isSample: true },
];
test("joins saved shoes with exact shoe ids, preserving saved order and sample labels", () => {
  const before = structuredClone(shoes);
  const result = savedShoeProgress(shoes, [{ shoeId: "tried", count: 3 }, { shoeId: "sample", count: 1 }, { shoeId: "not-saved", count: 9 }]);
  assert.deepEqual(result.map(({ shoe, fittings }) => [shoe.id, fittings]), [["new", 0], ["tried", 3], ["sample", 1]]);
  assert.equal(result[2].shoe.isSample, true);
  assert.deepEqual(shoes, before);
});
test("handles empty saved lists and fitting history without inventing try-on results", () => {
  assert.deepEqual(savedShoeProgress([], [{ shoeId: "tried", count: 2 }]), []);
  assert.ok(savedShoeProgress(shoes, []).every(({ fittings }) => fittings === 0));
});
