export const shoeConditionLabels = { UNKNOWN: "Not recorded", NEW: "New / not broken in", BROKEN_IN: "Already broken in" };
export type FittingContext = { triedOn: string | null; location: string; shoeCondition: keyof typeof shoeConditionLabels; durationMinutes: number | null };
export type ContextErrors = Partial<Record<keyof FittingContext, string>>;

export function isFittingDate(value: string) {
  if (!/^(19|20)\d{2}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function serializeFittingDate(value: Date | null) { return value?.toISOString().slice(0, 10) ?? null; }

export function validateFittingContext(input: Record<string, unknown>) {
  const errors: ContextErrors = {};
  const data: Partial<Omit<FittingContext, "triedOn"> & { triedOn: Date | null }> = {};
  if (input.triedOn !== undefined) {
    if (typeof input.triedOn !== "string" || (input.triedOn !== "" && !isFittingDate(input.triedOn))) errors.triedOn = "Choose a valid date from 1900 to 2099, or leave it blank.";
    else data.triedOn = input.triedOn ? new Date(`${input.triedOn}T00:00:00.000Z`) : null;
  }
  if (input.location !== undefined) {
    if (typeof input.location !== "string" || input.location.trim().length > 120) errors.location = "Use up to 120 characters for the location.";
    else data.location = input.location.trim();
  }
  if (input.shoeCondition !== undefined) {
    if (typeof input.shoeCondition !== "string" || !Object.hasOwn(shoeConditionLabels, input.shoeCondition)) errors.shoeCondition = "Choose a shoe condition, including Not recorded.";
    else data.shoeCondition = input.shoeCondition as FittingContext["shoeCondition"];
  }
  if (input.durationMinutes !== undefined) {
    const value = typeof input.durationMinutes === "string" ? input.durationMinutes.trim() : null;
    if (value === null || (value !== "" && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 1440))) errors.durationMinutes = "Use 1–1,440 whole minutes, or leave it blank.";
    else data.durationMinutes = value ? Number(value) : null;
  }
  return { data, errors };
}
