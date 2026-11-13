import { getSizeReference, type SizeReference } from "./shoe-sizing";
import type { Shoe } from "@/generated/prisma/client";
import { heelVolumeLabels, widthLabels } from "./climbing-shoes";
import type { QuestionnaireProfile } from "./questionnaire";

export type RecommendationShoe = Pick<Shoe, "slug" | "brand" | "model" | "isSample" | "downturn" | "stiffness" | "width" | "heelVolume">;
export type RankedShoe = RecommendationShoe & { score: number; reasons: string[]; tradeoffs: string[]; sizeReference: SizeReference };
export type RecommendationResponse = { status: "ranked" | "insufficient" | "empty"; shoes: RankedShoe[] };

type Rule = {
  attribute: "downturn" | "stiffness" | "width" | "heelVolume";
  values: string[];
  points: number;
  mismatchPoints: number;
  reason: string;
  tradeoff: string;
};

const attributeLabels: Record<Rule["attribute"], string> = {
  downturn: "Downturn", stiffness: "Stiffness", width: "Forefoot width", heelVolume: "Heel volume",
};

export function getRecommendationRules(profile: QuestionnaireProfile): Rule[] {
  const rules: Rule[] = [];
  if (profile.width !== "UNKNOWN") {
    rules.push({
      attribute: "width", values: [profile.width], points: 3, mismatchPoints: -3,
      reason: `Forefoot width matches your answer: ${widthLabels[profile.width].toLowerCase()}.`,
      tradeoff: `Listed forefoot width differs from your answer (${widthLabels[profile.width].toLowerCase()}).`,
    });
  }
  if (profile.heelVolume !== "UNKNOWN") {
    rules.push({
      attribute: "heelVolume", values: [profile.heelVolume], points: 2, mismatchPoints: -2,
      reason: `Heel volume matches your answer: ${heelVolumeLabels[profile.heelVolume].toLowerCase()}.`,
      tradeoff: `Listed heel volume differs from your answer (${heelVolumeLabels[profile.heelVolume].toLowerCase()}).`,
    });
  }
  if (profile.experience === "BEGINNER" || profile.fitPreference === "COMFORT") {
    rules.push({
      attribute: "downturn", values: ["NEUTRAL"], points: 2, mismatchPoints: -2,
      reason: profile.fitPreference === "COMFORT"
        ? "Neutral downturn aligns with your comfort priority."
        : "Neutral downturn is favoured by our beginner rule.",
      tradeoff: "A downturned shape is a tradeoff for your beginner or comfort preference.",
    });
  }
  if (profile.discipline === "BOULDERING") {
    rules.push({
      attribute: "stiffness", values: ["SOFT"], points: 1, mismatchPoints: 0,
      reason: "Soft construction favours sensitivity for bouldering.",
      tradeoff: "This construction offers less flex than our bouldering rule favours.",
    });
  } else if (profile.discipline === "SPORT" || profile.discipline === "TRAD") {
    rules.push({
      attribute: "stiffness", values: profile.discipline === "SPORT" ? ["MEDIUM", "STIFF"] : ["STIFF"],
      points: 1, mismatchPoints: 0,
      reason: "Supportive construction aligns with our route-climbing rule.",
      tradeoff: "This construction offers less support than our route-climbing rule favours.",
    });
  }
  return rules;
}

export function recommendShoes(profile: QuestionnaireProfile, shoes: readonly RecommendationShoe[]): RecommendationResponse {
  const rules = getRecommendationRules(profile);
  if (!rules.length) return { status: "insufficient", shoes: [] };

  const ranked = shoes.map((shoe): RankedShoe => {
    let score = 0;
    const reasons: string[] = [];
    const tradeoffs: string[] = [];
    for (const rule of rules) {
      const value = shoe[rule.attribute];
      if (value === "UNKNOWN") {
        tradeoffs.push(`${attributeLabels[rule.attribute]} is unknown and was not scored.`);
      } else if (rule.values.includes(value)) {
        score += rule.points;
        reasons.push(rule.reason);
      } else {
        score += rule.mismatchPoints;
        tradeoffs.push(rule.tradeoff);
      }
    }
    return { ...shoe, score, reasons, tradeoffs, sizeReference: getSizeReference(shoe, profile) };
  }).filter((shoe) => shoe.score > 0)
    .sort((a, b) => b.score - a.score || a.brand.localeCompare(b.brand, "en") || a.model.localeCompare(b.model, "en") || a.slug.localeCompare(b.slug, "en"))
    .slice(0, 3);

  return { status: ranked.length ? "ranked" : "empty", shoes: ranked };
}
