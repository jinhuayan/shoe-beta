import assert from "node:assert/strict";
import test from "node:test";
import { parseShops, searchLocation } from "./shops";

const place = { id: "one", displayName: { text: "Sample shop" }, formattedAddress: "Sample address", googleMapsUri: "https://maps.google.com/?cid=1" };

test("normalizes an area and rejects invalid search inputs", () => {
  assert.equal(searchLocation({ location: "  North   York, ON  " }), "North York, ON");
  for (const body of [null, {}, { location: 123 }, { location: "x" }, { location: "x".repeat(101) }, { location: "ab\u0000cd" }]) assert.equal(searchLocation(body), null);
});

test("keeps valid map results and provider attribution without HTML interpretation", () => {
  const result = parseShops({ places: [{ ...place, businessStatus: "CLOSED_TEMPORARILY", attributions: [{ provider: "<b>Provider</b>", providerUri: "https://example.com/source" }] }] });
  assert.equal(result[0].temporarilyClosed, true);
  assert.deepEqual(result[0].attributions, [{ name: "<b>Provider</b>", url: "https://example.com/source" }]);
});

test("filters duplicate, closed, incomplete and unsafe map results", () => {
  const result = parseShops({ places: [place, place, { ...place, id: "closed", businessStatus: "CLOSED_PERMANENTLY" },
    { ...place, id: "missing", formattedAddress: null }, { ...place, id: "js", googleMapsUri: "javascript:alert(1)" },
    { ...place, id: "spoof", googleMapsUri: "https://maps.google.com.evil.example/" }, { ...place, id: "credentials", googleMapsUri: "https://user@maps.google.com/" }] });
  assert.deepEqual(result.map((shop) => shop.id), ["one"]);
});

test("keeps attribution names when their URL is unsafe", () => {
  assert.deepEqual(parseShops({ places: [{ ...place, attributions: [{ provider: "Provider", providerUri: "javascript:alert(1)" }] }] })[0].attributions, [{ name: "Provider", url: null }]);
});

test("handles empty results and rejects malformed responses", () => {
  assert.deepEqual(parseShops({}), []);
  assert.deepEqual(parseShops({ places: [] }), []);
  for (const value of [null, [], { places: "bad" }]) assert.throws(() => parseShops(value));
});

test("returns at most ten candidates in provider order", () => {
  assert.deepEqual(parseShops({ places: Array.from({ length: 15 }, (_, i) => ({ ...place, id: String(i) })) }).map((shop) => shop.id), Array.from({ length: 10 }, (_, i) => String(i)));
});
