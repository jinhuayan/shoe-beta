import { shoeConditionLabels, type FittingContext } from "@/lib/fitting-context";

export function FittingContextDetails({ record }: { record: FittingContext }) {
  return (
    <dl className="grid gap-3 rounded-lg bg-stone-50 p-3 text-sm sm:grid-cols-2">
      <div><dt className="text-stone-500">Tried on</dt><dd>{record.triedOn ? <time dateTime={record.triedOn}>{record.triedOn}</time> : "Not recorded"}</dd></div>
      <div className="min-w-0"><dt className="text-stone-500">Location</dt><dd className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{record.location || "Not recorded"}</dd></div>
      <div><dt className="text-stone-500">Shoe condition</dt><dd>{shoeConditionLabels[record.shoeCondition]}</dd></div>
      <div><dt className="text-stone-500">Time worn</dt><dd>{record.durationMinutes === null ? "Not recorded" : `${record.durationMinutes} min`}</dd></div>
    </dl>
  );
}
