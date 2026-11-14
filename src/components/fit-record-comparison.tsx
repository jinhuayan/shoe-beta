import { fitAreaLabels, fitLabels, type SavedFitRecord } from "@/lib/fit-records";

export function FitRecordComparison({ records }: { records: SavedFitRecord[] }) {
  if (records.length < 2) return null;
  const rows = [
    { label: "Size worn", value: (record: SavedFitRecord) => `EU ${record.sizeEu}` },
    { label: "Overall fit", value: (record: SavedFitRecord) => fitLabels[record.fit] },
    ...Object.entries(fitAreaLabels).map(([key, label]) => ({ label, value: (record: SavedFitRecord) => fitLabels[record[key as keyof typeof fitAreaLabels]] })),
    { label: "Rating", value: (record: SavedFitRecord) => record.rating === null ? "Not rated" : `${record.rating} / 5` },
    { label: "Notes", value: (record: SavedFitRecord) => record.notes || "No notes" },
    { label: "Photo", value: (record: SavedFitRecord) => record.photo ? "Attached to record" : "No photo" },
  ];
  return (
    <section className="space-y-3" aria-labelledby="fit-comparison-heading">
      <h3 id="fit-comparison-heading" className="text-lg font-semibold">Compare your fittings</h3>
      <p id="fit-comparison-help" className="text-sm text-stone-600">Your own observations only, not a size prediction. Comparison stays private on this page. On small screens, scroll the table sideways.</p>
      <div role="region" aria-label="Private fitting comparison" aria-describedby="fit-comparison-help" tabIndex={0} className="overflow-x-auto rounded-lg border border-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2">
        <table className="w-full min-w-[40rem] table-fixed text-left text-sm">
          <caption className="sr-only">Comparison of your selected fit records</caption>
          <thead><tr className="bg-stone-50 align-top"><th scope="col" className="w-36 p-4">Observation</th>{records.map((record) => <th scope="col" key={record.id} className="space-y-1 break-words p-4"><p>{record.shoe.brand} {record.shoe.model}</p><p className="font-normal">EU {record.sizeEu} · <time dateTime={record.createdAt}>{new Date(record.createdAt).toLocaleDateString("en-CA")}</time></p></th>)}</tr></thead>
          <tbody>{rows.map(({ label, value }) => <tr key={label} className="border-t border-stone-200 align-top"><th scope="row" className="p-4 font-medium">{label}</th>{records.map((record) => <td key={record.id} className="whitespace-pre-wrap break-words p-4">{value(record)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
