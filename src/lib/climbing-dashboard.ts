import type { QuestionnaireProfile } from "./questionnaire";
import type { RecommendationResponse } from "./recommendations";
import type { RecordShoe, SavedFitRecord } from "./fit-records";

export type FittingGroup = { shoeId: string; count: number };
export type SavedProgress = { shoe: RecordShoe; fittings: number };
export type DashboardData = {
  profile: QuestionnaireProfile | null;
  profileUpdatedAt: string | null;
  summary: { fittings: number; models: number; photos: number; saved: number };
  saved: SavedProgress[];
  recent: Pick<SavedFitRecord, "id" | "shoe" | "sizeEu" | "fit" | "rating" | "triedOn" | "location" | "createdAt">[];
  recommendations: RecommendationResponse | null;
};

export function savedShoeProgress(shoes: RecordShoe[], groups: FittingGroup[]): SavedProgress[] {
  const counts = new Map(groups.map((group) => [group.shoeId, group.count]));
  return shoes.map((shoe) => ({ shoe, fittings: counts.get(shoe.id) ?? 0 }));
}
