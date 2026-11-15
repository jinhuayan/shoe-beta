import type { SavedFitRecord } from "./fit-records";
import { isFittingDate } from "./fitting-context";

export type JournalFilters = { query: string; shoeId: string; fit: string; photo: string; sort: string; dateFrom: string; dateTo: string; condition: string };
export const emptyJournalFilters: JournalFilters = { query: "", shoeId: "", fit: "", photo: "", sort: "newest", dateFrom: "", dateTo: "", condition: "" };
const newest = (a: SavedFitRecord, b: SavedFitRecord) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id);

export function journalDateError(filters: Pick<JournalFilters, "dateFrom" | "dateTo">) {
  if ((filters.dateFrom && !isFittingDate(filters.dateFrom)) || (filters.dateTo && !isFittingDate(filters.dateTo))) return "Choose valid dates from 1900 to 2099.";
  if (filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo) return "The start date must be on or before the end date.";
  return null;
}

export function filterFitRecords(records: SavedFitRecord[], filters: JournalFilters) {
  if (journalDateError(filters)) return [];
  const words = filters.query.trim().toLocaleLowerCase("en").split(/\s+/).filter(Boolean);
  return records.filter((record) => {
    const text = `${record.shoe.brand} ${record.shoe.model} ${record.notes} ${record.location}`.toLocaleLowerCase("en");
    return words.every((word) => text.includes(word))
      && (!filters.shoeId || record.shoe.id === filters.shoeId)
      && (!filters.fit || record.fit === filters.fit)
      && (!filters.condition || record.shoeCondition === filters.condition)
      && (!filters.dateFrom || (!!record.triedOn && record.triedOn >= filters.dateFrom))
      && (!filters.dateTo || (!!record.triedOn && record.triedOn <= filters.dateTo))
      && (filters.photo !== "with" || !!record.photo)
      && (filters.photo !== "without" || !record.photo);
  }).sort((a, b) => {
    if (filters.sort === "tried-newest" || filters.sort === "tried-oldest") {
      if (!a.triedOn) return b.triedOn ? 1 : newest(a, b);
      if (!b.triedOn) return -1;
      return (filters.sort === "tried-newest" ? b.triedOn.localeCompare(a.triedOn) : a.triedOn.localeCompare(b.triedOn)) || newest(a, b);
    }
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
