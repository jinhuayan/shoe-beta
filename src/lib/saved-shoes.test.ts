import assert from "node:assert/strict";
import test from "node:test";
import { savedShoeSlugs } from "./saved-shoes";

test("accepts one to three shoes, trims slugs and deduplicates", () => {
  assert.deepEqual(savedShoeSlugs({ slugs: [" drago ", "helix", "drago"], userId: "ignored" }), ["drago", "helix"]);
  assert.deepEqual(savedShoeSlugs({ slugs: ["one", "two", "three"] }), ["one", "two", "three"]);
});

test("rejects malformed, empty, oversized and non-string selections", () => {
  for (const body of [null, [], {}, { slugs: "one" }, { slugs: [] }, { slugs: [" "] }, { slugs: [null] }, { slugs: [1] }, { slugs: ["x".repeat(101)] }, { slugs: ["a", "b", "c", "d"] }]) assert.equal(savedShoeSlugs(body), null);
});
