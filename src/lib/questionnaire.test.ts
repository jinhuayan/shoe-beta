import assert from "node:assert/strict";
import test from "node:test";
import { choiceFields, validateQuestionnaire } from "./questionnaire";

function answers(overrides: Record<string, string> = {}) {
  const data = new FormData();
  data.set("footLengthMm", "");
  data.set("streetSizeEu", "");
  for (const name of Object.keys(choiceFields)) data.set(name, "UNKNOWN");
  for (const [name, value] of Object.entries(overrides)) data.set(name, value);
  return data;
}

test("accepts an unsure profile without inventing measurements", () => {
  const result = validateQuestionnaire(answers());
  assert.deepEqual(result.errors, {});
  assert.equal(result.profile?.footLengthMm, null);
  assert.equal(result.profile?.streetSizeEu, null);
  assert.equal(result.profile?.width, "UNKNOWN");
});

test("parses measurements and keeps contrasting climbing preferences", () => {
  const result = validateQuestionnaire(answers({ footLengthMm: " 250.1 ", streetSizeEu: "40.5", width: "WIDE", toeShape: "SECOND_TOE", heelVolume: "LOW", experience: "BEGINNER", discipline: "BOULDERING", fitPreference: "COMFORT" }));
  assert.deepEqual(result.profile, { footLengthMm: 250.1, streetSizeEu: 40.5, width: "WIDE", toeShape: "SECOND_TOE", heelVolume: "LOW", experience: "BEGINNER", discipline: "BOULDERING", fitPreference: "COMFORT" });
  assert.equal(result.values.footLengthMm, "250.1");
});

test("accepts the supported measurement boundaries", () => {
  for (const [length, size] of [["100", "20"], ["400", "55"]]) {
    assert.ok(validateQuestionnaire(answers({ footLengthMm: length, streetSizeEu: size })).profile);
  }
});

test("rejects invalid measurements and unsupported precision", () => {
  for (const value of ["0", "-250", "99.9", "400.1", "NaN", "Infinity", "0xff", "2.5e2", "250.11"]) {
    const result = validateQuestionnaire(answers({ footLengthMm: value }));
    assert.equal(result.profile, null, value);
    assert.ok(result.errors.footLengthMm, value);
  }
  for (const value of ["19.5", "55.5", "40.25"]) {
    assert.ok(validateQuestionnaire(answers({ streetSizeEu: value })).errors.streetSizeEu);
  }
});

test("rejects unknown, inherited, and missing options", () => {
  for (const value of ["wide", "toString", "__proto__", ""]) {
    assert.ok(validateQuestionnaire(answers({ width: value })).errors.width);
  }
  const data = answers();
  data.delete("experience");
  assert.ok(validateQuestionnaire(data).errors.experience);
});

test("rejects duplicate fields and files", () => {
  const data = answers({ footLengthMm: "250", streetSizeEu: "40" });
  data.append("width", "WIDE");
  data.set("footLengthMm", new Blob(["250"]), "length.txt");
  const result = validateQuestionnaire(data);
  assert.equal(result.profile, null);
  assert.ok(result.errors.width);
  assert.ok(result.errors.footLengthMm);
  assert.equal(result.values.streetSizeEu, "40");
});

test("rejects oversized answers instead of accepting a truncated value", () => {
  const result = validateQuestionnaire(answers({ footLengthMm: `250.${"0".repeat(101)}` }));
  assert.equal(result.profile, null);
  assert.ok(result.errors.footLengthMm);
});
