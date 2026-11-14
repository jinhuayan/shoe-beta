"use client";

import { useState, type ReactNode } from "react";
import { fitLabels, type SavedFitRecord } from "@/lib/fit-records";
import { emptyJournalFilters, filterFitRecords, selectedFitRecords, summarizeFitRecords, type JournalFilters } from "@/lib/fit-journal";
import { FitRecordComparison } from "@/components/fit-record-comparison";

const controlClass = "w-full min-w-0 rounded-lg border border-stone-300 bg-white p-2";
const linkClass = "rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2";
export function FitJournal({ records, disabled, renderRecord }: { records: SavedFitRecord[]; disabled: boolean; renderRecord: (record: SavedFitRecord) => ReactNode }) {
  const [filters, setFilters] = useState<JournalFilters>(emptyJournalFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selected = selectedFitRecords(records, selectedIds);
  const visible = filterFitRecords(records, filters);
  const summary = summarizeFitRecords(records);
  const shoes = [...new Map(records.map((record) => [record.shoe.id, record.shoe])).values()].sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, "en"));
  const change = (name: keyof JournalFilters, value: string) => setFilters((previous) => ({ ...previous, [name]: value }));
  return (
    <section className="space-y-4" aria-labelledby="records-heading">
      <h2 id="records-heading" className="text-xl font-semibold">Saved records</h2>
      <dl className="grid grid-cols-3 gap-3 rounded-lg bg-stone-50 p-4 text-sm">
        <div><dt>All fittings</dt><dd className="mt-1 text-xl font-semibold">{summary.total}</dd></div>
        <div><dt>Shoe models</dt><dd className="mt-1 text-xl font-semibold">{summary.models}</dd></div>
        <div><dt>Comfortable overall</dt><dd className="mt-1 text-xl font-semibold">{summary.comfortable}</dd></div>
      </dl>
      {!records.length ? <p className="text-stone-600">No fit records yet.</p> : <>
        <div className="grid gap-4 rounded-lg border border-stone-200 p-4 sm:grid-cols-2">
          <label className="min-w-0 space-y-1 sm:col-span-2"><span className="block text-sm font-medium">Search shoe or notes</span><input type="search" maxLength={100} value={filters.query} onChange={(event) => change("query", event.target.value)} className={controlClass} /></label>
          <label className="min-w-0 space-y-1"><span className="block text-sm font-medium">Filter by shoe</span><select value={filters.shoeId} onChange={(event) => change("shoeId", event.target.value)} className={controlClass}><option value="">All shoes</option>{shoes.map((shoe) => <option key={shoe.id} value={shoe.id}>{shoe.brand} {shoe.model}</option>)}</select></label>
          <label className="min-w-0 space-y-1"><span className="block text-sm font-medium">Filter by overall fit</span><select value={filters.fit} onChange={(event) => change("fit", event.target.value)} className={controlClass}><option value="">All fits</option>{Object.entries(fitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="min-w-0 space-y-1"><span className="block text-sm font-medium">Photo filter</span><select value={filters.photo} onChange={(event) => change("photo", event.target.value)} className={controlClass}><option value="">All records</option><option value="with">With photo</option><option value="without">Without photo</option></select></label>
          <label className="min-w-0 space-y-1"><span className="block text-sm font-medium">Sort records</span><select value={filters.sort} onChange={(event) => change("sort", event.target.value)} className={controlClass}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="rating">Highest rating</option><option value="size">Smallest EU size</option></select></label>
          <button type="button" onClick={() => setFilters(emptyJournalFilters)} className={`${linkClass} justify-self-start`}>Clear filters</button>
        </div>
        <p role="status" className="text-sm text-stone-600">Showing {visible.length} of {records.length} records. {selected.length} of 3 selected for comparison.</p>
        <p className="text-sm text-stone-600">Select two or three fittings below. Selections stay when filtering; searches and selections are not saved or added to the URL.</p>
        {selected.length > 0 && <button type="button" onClick={() => setSelectedIds([])} className={linkClass}>Clear comparison selection</button>}
        <FitRecordComparison records={selected} />
        {!visible.length ? <p className="rounded-lg border border-stone-200 p-4">No fit records match these filters.</p> : <ul className="space-y-4">
          {visible.map((record) => <li key={record.id} className="space-y-4 rounded-lg border border-stone-200 p-5">
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={selected.some((item) => item.id === record.id)} disabled={disabled || (selected.length >= 3 && !selected.some((item) => item.id === record.id))} onChange={(event) => setSelectedIds(event.target.checked ? [...selected.map((item) => item.id), record.id] : selected.filter((item) => item.id !== record.id).map((item) => item.id))} />Compare {record.shoe.brand} {record.shoe.model}, EU {record.sizeEu}</label>
            {renderRecord(record)}
          </li>)}
        </ul>}
      </>}
    </section>
  );
}
