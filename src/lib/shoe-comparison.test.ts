import assert from "node:assert/strict";
import test from "node:test";
import { comparisonHref, differingAttributes, getComparisonSelection } from "./shoe-comparison";

const shoe = { downturn: "NEUTRAL", stiffness: "UNKNOWN", closure: "UNKNOWN", width: "UNKNOWN", heelVolume: "UNKNOWN" } as const;

test("keeps selection order, skips blanks and deduplicates before enforcing the limit", () => {
  assert.deepEqual(getComparisonSelection({ shoe: [" drago ", "", "drago", "helix", "solution", "fourth"] }), { slugs: ["drago", "helix", "solution"], adjusted: true, differences: false });
  assert.deepEqual(getComparisonSelection({ shoe: "drago", differences: "1" }), { slugs: ["drago"], adjusted: false, differences: true });
  assert.deepEqual(getComparisonSelection({}), { slugs: [], adjusted: false, differences: false });
});

test("rejects oversized slugs and ambiguous view flags", () => {
  assert.deepEqual(getComparisonSelection({ shoe: ["x".repeat(101), "helix"], differences: ["1", "0"] }), { slugs: ["helix"], adjusted: true, differences: false });
});

test("shared links round-trip reserved characters and include only selection and view", () => {
  const url = new URL(comparisonHref(["a&shoe=other", "b #?", "a&shoe=other"], true), "https://example.test");
  assert.deepEqual(url.searchParams.getAll("shoe"), ["a&shoe=other", "b #?"]);
  assert.deepEqual([...url.searchParams.keys()], ["shoe", "shoe", "differences"]);
  assert.equal(comparisonHref([]), "/compare");
});

test("difference view does not invent differences between equal unknown labels", () => {
  assert.deepEqual(differingAttributes([shoe, shoe]), []);
  assert.deepEqual(differingAttributes([shoe, { ...shoe, downturn: "AGGRESSIVE", stiffness: "SOFT" }]).map(({ key }) => key), ["downturn", "stiffness"]);
  assert.deepEqual(differingAttributes([shoe]), []);
  assert.deepEqual(differingAttributes([]), []);
});
