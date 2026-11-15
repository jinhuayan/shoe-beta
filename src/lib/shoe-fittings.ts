import { fitLabels, type SavedFitRecord } from "./fit-records";
import type { SizeReference } from "./shoe-sizing";

export type PersonalShoeData = { saved: boolean; reference: SizeReference | null; profileUpdatedAt: string | null };
type Counts = Record<keyof typeof fitLabels, number>;
const counts = (): Counts => ({ UNKNOWN: 0, TIGHT: 0, COMFORTABLE: 0, LOOSE: 0 });

export function readShoeScope(params: URLSearchParams) {
  const values = params.getAll("shoe");
  if (!values.length) return { valid: true, slug: null };
  const slug = values[0].trim();
  return { valid: values.length === 1 && slug.length > 0 && slug.length <= 100, slug };
}

export function groupShoeFittings(records: SavedFitRecord[], shoeId: string) {
  const sizes = new Map<number, { sizeEu: number; fittings: number; overall: Counts; toe: Counts; forefoot: Counts; heel: Counts }>();
  for (const record of records) {
    if (record.shoe.id !== shoeId) continue;
    const group = sizes.get(record.sizeEu) ?? { sizeEu: record.sizeEu, fittings: 0, overall: counts(), toe: counts(), forefoot: counts(), heel: counts() };
    group.fittings++;
    group.overall[record.fit]++;
    group.toe[record.toeFit]++;
    group.forefoot[record.forefootFit]++;
    group.heel[record.heelFit]++;
    sizes.set(record.sizeEu, group);
  }
  return [...sizes.values()].sort((a, b) => a.sizeEu - b.sizeEu);
}
