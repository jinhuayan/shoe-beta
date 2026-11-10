import type { Shoe } from "@/generated/prisma/client";
import type { QuestionnaireProfile } from "./questionnaire";

export type RecommendationShoe = Pick<Shoe, "slug" | "brand" | "model" | "isSample" | "downturn" | "stiffness">;
export type RankedShoe = RecommendationShoe & { score: number; reasons: string[]; tradeoffs: string[] };
export type RecommendationResponse = { status: "ranked" | "insufficient" | "empty"; shoes: RankedShoe[] };

type Rule = {
  attribute: "downturn" | "stiffness";
  values: string[];
  points: number;
  mismatchPoints: number;
  reason: string;
  tradeoff: string;
};

export function getRecommendationRules(profile: QuestionnaireProfile): Rule[] {
  const rules: Rule[] = [];
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
        tradeoffs.push(`${rule.attribute === "downturn" ? "Downturn" : "Stiffness"} is unknown and was not scored.`);
      } else if (rule.values.includes(value)) {
        score += rule.points;
        reasons.push(rule.reason);
      } else {
        score += rule.mismatchPoints;
        tradeoffs.push(rule.tradeoff);
      }
    }
    return { ...shoe, score, reasons, tradeoffs };
  }).filter((shoe) => shoe.score > 0)
    .sort((a, b) => b.score - a.score || a.brand.localeCompare(b.brand, "en") || a.model.localeCompare(b.model, "en") || a.slug.localeCompare(b.slug, "en"))
    .slice(0, 3);

  return { status: ranked.length ? "ranked" : "empty", shoes: ranked };
}
