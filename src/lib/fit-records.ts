export const fitLabels = { UNKNOWN: "Unsure", TIGHT: "Too tight", COMFORTABLE: "Comfortable", LOOSE: "Too loose" };

export type FitRecordErrors = Partial<Record<"shoeId" | "sizeEu" | "fit" | "rating" | "notes", string>>;
export type RecordShoe = { id: string; slug: string; brand: string; model: string; isSample: boolean };
export type SavedFitRecord = {
  photo: { recordId: string } | null;
  id: string;
  shoe: RecordShoe;
  sizeEu: number;
  fit: keyof typeof fitLabels;
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

  return {
    errors,
    data: Object.keys(errors).length ? null : {
      shoeId, sizeEu, fit: fit as keyof typeof fitLabels, rating: rating ? Number(rating) : null, notes,
    },
  };
}
