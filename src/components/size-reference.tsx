import type { SizeReference as Reference } from "@/lib/shoe-sizing";

export function SizeReference({ reference }: { reference: Reference }) {
  return (
    <section className="space-y-2 rounded-lg bg-stone-50 p-4 text-sm text-stone-600" aria-label="Size reference">
      <p className="font-medium text-stone-900">{reference.status === "available" ? `Reference to try: EU ${reference.sizes.join(", ")}` : "Size reference unavailable"}</p>
      <p>{reference.explanation}</p>
      {reference.guide && <>
        <p>{reference.guide.note}</p>
        <p><a href={reference.guide.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">Manufacturer sizing FAQ (new tab)</a> · Checked <time dateTime={reference.guide.checkedAt}>{reference.guide.checkedAt}</time></p>
      </>}
      <p>A manufacturer-based starting point, not a fit guarantee. Foot length, width, toe shape and heel volume are not used in this size calculation. Listed sizes do not confirm stock. Try shoes on; do not force a painful fit.</p>
    </section>
  );
}
