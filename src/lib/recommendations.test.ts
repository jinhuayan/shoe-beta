import assert from "node:assert/strict";
import test from "node:test";
import { recommendShoes, type RecommendationShoe } from "./recommendations";
import type { QuestionnaireProfile } from "./questionnaire";

const profile: QuestionnaireProfile = {
  footLengthMm: null, streetSizeEu: null, width: "UNKNOWN", toeShape: "UNKNOWN",
  heelVolume: "UNKNOWN", experience: "UNKNOWN", discipline: "UNKNOWN", fitPreference: "UNKNOWN",
};
const shoes: RecommendationShoe[] = [
  { slug: "precision", brand: "Sample", model: "Precision", isSample: true, downturn: "AGGRESSIVE", stiffness: "SOFT" },
  { slug: "training", brand: "Sample", model: "Training", isSample: true, downturn: "NEUTRAL", stiffness: "STIFF" },
  { slug: "everyday", brand: "Sample", model: "Everyday", isSample: true, downturn: "MODERATE", stiffness: "MEDIUM" },
];

test("does not rank unsure answers or infer aggression from experience", () => {
  for (const input of [profile, { ...profile, experience: "ADVANCED", fitPreference: "PERFORMANCE" } as const]) {
    assert.deepEqual(recommendShoes(input, shoes), { status: "insufficient", shoes: [] });
  }
});

test("favours neutral shoes for beginners and applies comfort only once", () => {
  const beginner = recommendShoes({ ...profile, experience: "BEGINNER" }, shoes);
  const comfort = recommendShoes({ ...profile, experience: "BEGINNER", fitPreference: "COMFORT" }, shoes);
  assert.deepEqual(beginner.shoes.map((shoe) => shoe.slug), ["training"]);
  assert.equal(comfort.shoes[0].score, 2);
  assert.match(comfort.shoes[0].reasons[0], /comfort/);
});

test("contrasting climbing styles produce different shortlists", () => {
  assert.deepEqual(recommendShoes({ ...profile, discipline: "BOULDERING" }, shoes).shoes.map((shoe) => shoe.slug), ["precision"]);
  assert.deepEqual(recommendShoes({ ...profile, discipline: "SPORT" }, shoes).shoes.map((shoe) => shoe.slug), ["everyday", "training"]);
  assert.deepEqual(recommendShoes({ ...profile, discipline: "TRAD" }, shoes).shoes.map((shoe) => shoe.slug), ["training"]);
});

test("reports the tradeoff between comfort and bouldering sensitivity", () => {
  const result = recommendShoes({ ...profile, fitPreference: "COMFORT", discipline: "BOULDERING" }, shoes);
  assert.deepEqual(result.shoes.map((shoe) => shoe.slug), ["training"]);
  assert.match(result.shoes[0].tradeoffs[0], /less flex/);
});

test("unknown attributes do not become positive evidence", () => {
  const unknown = { ...shoes[0], downturn: "UNKNOWN", stiffness: "UNKNOWN" } as const;
  assert.deepEqual(recommendShoes({ ...profile, experience: "BEGINNER" }, [unknown]), { status: "empty", shoes: [] });
  const partial = { ...unknown, downturn: "NEUTRAL" } as const;
  const result = recommendShoes({ ...profile, experience: "BEGINNER", discipline: "SPORT" }, [partial]);
  assert.equal(result.shoes[0].score, 2);
  assert.match(result.shoes[0].tradeoffs[0], /Stiffness is unknown/);
});

test("returns an empty result for an empty catalogue", () => {
  assert.deepEqual(recommendShoes({ ...profile, discipline: "BOULDERING" }, []), { status: "empty", shoes: [] });
});

test("keeps ties deterministic, limits results, and leaves input untouched", () => {
  const candidates = ["d", "c", "b", "a"].map((slug) => ({ ...shoes[1], slug, model: "Same" }));
  const original = structuredClone(candidates);
  const result = recommendShoes({ ...profile, experience: "BEGINNER" }, candidates);
  assert.deepEqual(result.shoes.map((shoe) => shoe.slug), ["a", "b", "c"]);
  assert.deepEqual(candidates, original);
});

test("does not use unsupported foot data or invent size estimates", () => {
  const base = { ...profile, discipline: "SPORT" } as const;
  const measured = { ...base, footLengthMm: 250, streetSizeEu: 40, width: "WIDE", toeShape: "SECOND_TOE", heelVolume: "LOW" } as const;
  assert.deepEqual(recommendShoes(base, shoes), recommendShoes(measured, shoes));
  assert.ok(recommendShoes(measured, shoes).shoes.every((shoe) => !("size" in shoe)));
});
