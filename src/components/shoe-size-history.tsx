import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fitLabels, type SavedFitRecord } from "@/lib/fit-records";
import { groupShoeFittings } from "@/lib/shoe-fittings";

export function ShoeSizeHistory({ records, shoeId, disabled, onUseSize }: { records: SavedFitRecord[]; shoeId: string; disabled: boolean; onUseSize: (size: number) => void }) {
  const sizes = groupShoeFittings(records, shoeId);
  const observations = (counts: ReturnType<typeof groupShoeFittings>[number]["overall"]) => Object.entries(fitLabels).filter(([key]) => counts[key as keyof typeof fitLabels]).map(([key, label]) => `${counts[key as keyof typeof fitLabels]} ${label.toLowerCase()}`).join(" · ");
  return (
    <section className="space-y-3" aria-labelledby="size-history-heading">
      <h2 id="size-history-heading" className="text-xl font-semibold">Sizes you have tried</h2>
      <p className="text-sm text-stone-600">Your observations for this exact shoe, grouped by EU size. Conflicting observations stay visible; these counts do not recommend a size.</p>
      {!sizes.length ? <p className="text-stone-600">No sizes recorded for this shoe yet. Add your first fitting below.</p> : <>
        <Card role="region" aria-label="Your size observations" tabIndex={0} className="overflow-x-auto focus-visible:outline-2">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Fitting counts and reported observations for each size of this shoe</caption>
            <thead className="bg-stone-50"><tr>{["EU size", "Fittings", "Overall fit", "Toe fit", "Forefoot fit", "Heel fit", "New fitting"].map((title) => <th scope="col" key={title} className="px-3 py-3 font-medium">{title}</th>)}</tr></thead>
            <tbody>{sizes.map((size) => <tr key={size.sizeEu} className="border-t border-stone-200 align-top"><th scope="row" className="px-3 py-3">{size.sizeEu}</th><td className="px-3 py-3">{size.fittings}</td>{[size.overall, size.toe, size.forefoot, size.heel].map((value, index) => <td key={index} className="px-3 py-3">{observations(value)}</td>)}<td className="px-3 py-3"><Button variant="ghost" type="button" disabled={disabled} onClick={() => onUseSize(size.sizeEu)}>Use EU {size.sizeEu}</Button></td></tr>)}</tbody>
          </table>
        </Card>
        <p className="text-sm text-stone-500">Use EU size fills only the size in the new fitting form. Enter your observations separately. Finish or cancel any edit first.</p>
      </>}
    </section>
  );
}
