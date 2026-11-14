import assert from "node:assert/strict";
import test from "node:test";
import { emptyJournalFilters, filterFitRecords, selectedFitRecords, summarizeFitRecords } from "./fit-journal";
import { validateFitRecord, type SavedFitRecord } from "./fit-records";

const shoe = { id: "a", slug: "scarpa-drago", brand: "SCARPA", model: "Drago", isSample: false };
const base: SavedFitRecord = { id: "one", shoe, sizeEu: 40, fit: "TIGHT", toeFit: "TIGHT", forefootFit: "UNKNOWN", heelFit: "COMFORTABLE", notes: "Heel secure", rating: null, photo: null, createdAt: "2026-11-01T10:00:00Z" };
const records: SavedFitRecord[] = [base, { ...base, id: "two", sizeEu: 41, fit: "COMFORTABLE", rating: 4, photo: { recordId: "two" }, createdAt: "2026-11-02T10:00:00Z" }, { ...base, id: "three", shoe: { ...shoe, id: "b", brand: "La Sportiva", model: "Solution" }, sizeEu: 39.5, fit: "LOOSE", rating: 5, notes: "Toe room", createdAt: "2026-11-03T10:00:00Z" }];
const input = { shoeId: "a", sizeEu: "40.5", fit: "COMFORTABLE", rating: "", notes: "" };

test("validates area observations while keeping legacy omitted fields absent", () => {
  const legacy = validateFitRecord(input);
  assert.ok(legacy.data);
  assert.ok(!Object.hasOwn(legacy.data, "toeFit"));
  assert.equal(validateFitRecord({ ...input, toeFit: " TIGHT ", forefootFit: "LOOSE", heelFit: "UNKNOWN" }).data?.toeFit, "TIGHT");
  for (const value of [null, 1, [], "", "PERFECT", "toString"]) assert.ok(validateFitRecord({ ...input, heelFit: value }).errors.heelFit);
});

test("combines search words with shoe, fit and photo filters", () => {
  const found = filterFitRecords(records, { ...emptyJournalFilters, query: " sCarPa secure ", shoeId: "a", fit: "COMFORTABLE", photo: "with" });
  assert.deepEqual(found.map(({ id }) => id), ["two"]);
  assert.equal(filterFitRecords(records, { ...emptyJournalFilters, query: "no match" }).length, 0);
  assert.deepEqual(filterFitRecords(records, { ...emptyJournalFilters, photo: "without" }).map(({ id }) => id), ["three", "one"]);
});

test("sorts deterministically, keeps unrated last, and never mutates records", () => {
  const before = structuredClone(records);
  assert.deepEqual(filterFitRecords(records, emptyJournalFilters).map(({ id }) => id), ["three", "two", "one"]);
  assert.deepEqual(filterFitRecords(records, { ...emptyJournalFilters, sort: "oldest" }).map(({ id }) => id), ["one", "two", "three"]);
  assert.deepEqual(filterFitRecords(records, { ...emptyJournalFilters, sort: "size" }).map(({ id }) => id), ["three", "one", "two"]);
  assert.deepEqual(filterFitRecords([records[2], { ...base, id: "latest", createdAt: "2026-11-04T10:00:00Z" }], { ...emptyJournalFilters, sort: "rating" }).map(({ id }) => id), ["three", "latest"]);
  assert.deepEqual(records, before);
});

test("summarizes exact observations without inferring fit or best sizes", () => {
  assert.deepEqual(summarizeFitRecords(records), { total: 3, models: 2, comfortable: 1 });
  assert.deepEqual(summarizeFitRecords([]), { total: 0, models: 0, comfortable: 0 });
});

test("comparison follows selected ids and live edits, excludes removed records, and caps at three", () => {
  assert.deepEqual(selectedFitRecords(records, ["two", "one", "two"]).map(({ id }) => id), ["two", "one"]);
  assert.equal(selectedFitRecords(records.map((record) => record.id === "two" ? { ...record, heelFit: "LOOSE" } : record), ["two"])[0].heelFit, "LOOSE");
  assert.deepEqual(selectedFitRecords(records.filter((record) => record.id !== "two"), ["two", "one"]).map(({ id }) => id), ["one"]);
  const fourth = { ...base, id: "four" };
  assert.equal(selectedFitRecords([...records, fourth], ["one", "two", "three", "four"]).length, 3);
});
