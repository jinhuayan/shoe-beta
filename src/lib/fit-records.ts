export const fitLabels = { UNKNOWN: "Unsure", TIGHT: "Too tight", COMFORTABLE: "Comfortable", LOOSE: "Too loose" };

export const fitAreaLabels = { toeFit: "Toe fit", forefootFit: "Forefoot fit", heelFit: "Heel fit" };
export type FitArea = keyof typeof fitAreaLabels;

export type FitRecordErrors = Partial<Record<"shoeId" | "sizeEu" | "fit" | "rating" | "notes" | FitArea, string>>;
export type RecordShoe = { id: string; slug: string; brand: string; model: string; isSample: boolean };
export type SavedFitRecord = {
  photo: { recordId: string } | null;
  id: string;
  shoe: RecordShoe;
  sizeEu: number;
  fit: keyof typeof fitLabels;
  toeFit: keyof typeof fitLabels;
  forefootFit: keyof typeof fitLabels;
  heelFit: keyof typeof fitLabels;
  rating: number | null;
  notes: string;
  createdAt: string;
};
export type FitRecordList = { records: SavedFitRecord[]; shoes: RecordShoe[] };

export function validateFitRecord(body: unknown) {
  const input = body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : {};
  const read = (name: string) => typeof input[name] === "string" ? input[name].trim() : "";
  const shoeId = read("shoeId");
  const size = read("sizeEu");
  const sizeEu = Number(size);
  const fit = read("fit");
  const rating = read("rating");
  const notes = read("notes");
  const errors: FitRecordErrors = {};

  if (!shoeId || shoeId.length > 100) errors.shoeId = "Choose a climbing shoe.";
  if (!/^\d+(\.\d+)?$/.test(size) || sizeEu < 20 || sizeEu > 55 || !Number.isInteger(sizeEu * 2)) {
    errors.sizeEu = "Enter an EU size from 20 to 55 in whole or half sizes.";
  }
  if (!Object.hasOwn(fitLabels, fit)) errors.fit = "Choose a fit, including Unsure.";
  if ((input.rating !== undefined && typeof input.rating !== "string") || (rating && !/^[1-5]$/.test(rating))) {
    errors.rating = "Choose a rating from 1 to 5, or leave it unrated.";
  }
  if ((input.notes !== undefined && typeof input.notes !== "string") || notes.length > 1000) errors.notes = "Use up to 1,000 characters.";

  const areas: Partial<Record<FitArea, keyof typeof fitLabels>> = {};
  for (const name of Object.keys(fitAreaLabels) as FitArea[]) {
    if (input[name] === undefined) continue;
    const value = read(name);
    if (typeof input[name] !== "string" || !Object.hasOwn(fitLabels, value)) errors[name] = "Choose a fit, including Unsure.";
    else areas[name] = value as keyof typeof fitLabels;
  }

  return {
    errors,
    data: Object.keys(errors).length ? null : {
      ...areas, shoeId, sizeEu, fit: fit as keyof typeof fitLabels, rating: rating ? Number(rating) : null, notes,
    },
  };
}
