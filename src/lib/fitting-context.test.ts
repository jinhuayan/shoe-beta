import assert from "node:assert/strict";
import test from "node:test";
import { isFittingDate, serializeFittingDate, validateFittingContext } from "./fitting-context";
import { validateFitRecord } from "./fit-records";

test("calendar dates reject overflow, timestamps and non-leap February 29", () => {
  for (const value of ["1900-01-01", "2000-02-29", "2024-02-29", "2026-11-14", "2099-12-31"]) assert.ok(isFittingDate(value));
  for (const value of ["", "2026-02-29", "1900-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "2026-1-01", "2026-11-14T00:00:00Z", "1899-12-31", "2100-01-01"]) assert.equal(isFittingDate(value), false, value);
  assert.equal(serializeFittingDate(new Date("2026-11-14T00:00:00Z")), "2026-11-14");
  assert.equal(serializeFittingDate(null), null);
});

test("optional context preserves omitted fields and explicitly clears blank values", () => {
  assert.deepEqual(validateFittingContext({}), { data: {}, errors: {} });
  assert.deepEqual(validateFittingContext({ triedOn: "", location: "  ", shoeCondition: "UNKNOWN", durationMinutes: "" }), { data: { triedOn: null, location: "", shoeCondition: "UNKNOWN", durationMinutes: null }, errors: {} });
  const parsed = validateFittingContext({ triedOn: "2026-11-14", location: "  Demo gym 王  ", shoeCondition: "BROKEN_IN", durationMinutes: " 90 " });
  assert.deepEqual(parsed.errors, {});
  assert.equal(parsed.data.triedOn?.toISOString(), "2026-11-14T00:00:00.000Z");
  assert.equal(parsed.data.location, "Demo gym 王");
  assert.equal(parsed.data.durationMinutes, 90);
});

test("context rejects wrong types, invalid conditions, oversized locations and fractional durations", () => {
  for (const triedOn of [null, 20261114, [], "2026-02-30"]) assert.ok(validateFittingContext({ triedOn }).errors.triedOn);
  for (const location of [null, [], 12, "a".repeat(121)]) assert.ok(validateFittingContext({ location }).errors.location);
  for (const shoeCondition of [null, "", "USED", "toString", 2]) assert.ok(validateFittingContext({ shoeCondition }).errors.shoeCondition);
  for (const durationMinutes of [null, 60, "0", "-1", "1.5", "1e2", "1441", "Infinity", {}]) assert.ok(validateFittingContext({ durationMinutes }).errors.durationMinutes);
  for (const durationMinutes of ["1", "1440"]) assert.equal(validateFittingContext({ durationMinutes }).data.durationMinutes, Number(durationMinutes));
  assert.equal(validateFittingContext({ location: "a".repeat(120) }).data.location?.length, 120);
});

test("fit-record validation exposes context errors and keeps older clients valid", () => {
  const base = { shoeId: "shoe", sizeEu: "40", fit: "UNKNOWN" };
  const legacy = validateFitRecord(base);
  assert.ok(legacy.data);
  assert.ok(!Object.hasOwn(legacy.data, "triedOn"));
  const invalid = validateFitRecord({ ...base, triedOn: "2026-02-30", durationMinutes: "0" });
  assert.equal(invalid.data, null);
  assert.ok(invalid.errors.triedOn && invalid.errors.durationMinutes);
});
