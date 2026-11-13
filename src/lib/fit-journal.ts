import type { SavedFitRecord } from "./fit-records";

export type JournalFilters = { query: string; shoeId: string; fit: string; photo: string; sort: string };
export const emptyJournalFilters: JournalFilters = { query: "", shoeId: "", fit: "", photo: "", sort: "newest" };
const newest = (a: SavedFitRecord, b: SavedFitRecord) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id);

export function filterFitRecords(records: SavedFitRecord[], filters: JournalFilters) {
  const words = filters.query.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
  return records.filter((record) => {
    const text = `${record.shoe.brand} ${record.shoe.model} ${record.notes}`.toLocaleLowerCase("en");
    return words.every((word) => text.includes(word))
      && (!filters.shoeId || record.shoe.id === filters.shoeId)
      && (!filters.fit || record.fit === filters.fit)
      && (filters.photo !== "with" || !!record.photo)
      && (filters.photo !== "without" || !record.photo);
  }).sort((a, b) => {
    if (filters.sort === "rating") return (b.rating ?? -1) - (a.rating ?? -1) || newest(a, b);
    if (filters.sort === "size") return a.sizeEu - b.sizeEu || newest(a, b);
    if (filters.sort === "oldest") return -newest(a, b);
    return newest(a, b);
  });
}

export function summarizeFitRecords(records: SavedFitRecord[]) {
  return { total: records.length, models: new Set(records.map((record) => record.shoe.id)).size, comfortable: records.filter((record) => record.fit === "COMFORTABLE").length };
}

export function selectedFitRecords(records: SavedFitRecord[], ids: string[]) {
  return [...new Set(ids)].slice(0, 3).flatMap((id) => records.find((record) => record.id === id) ?? []);
}
