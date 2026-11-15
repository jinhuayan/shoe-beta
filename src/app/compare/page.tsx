import { PageHeader, PageShell } from "@/components/ui/page";
import { Notice } from "@/components/ui/notice";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSizingGuide } from "@/lib/shoe-sizing";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { comparisonAttributes, comparisonHref, comparisonLimit, differingAttributes, getComparisonSelection, type ComparisonSearch } from "@/lib/shoe-comparison";
import { CopyComparisonLink } from "@/components/copy-comparison-link";

export const metadata = { title: "Compare climbing shoes | Shoe Beta", robots: { index: false } };
const linkClass = "ui-link";

export default async function ComparePage({ searchParams }: { searchParams: Promise<ComparisonSearch> }) {
  await connection();
  const selection = getComparisonSelection(await searchParams);
  const catalogue = await getDb().shoe.findMany({ where: { isSample: false }, orderBy: [{ brand: "asc" }, { model: "asc" }] });
  const shoes = selection.slugs.flatMap((slug) => catalogue.find((shoe) => shoe.slug === slug) ?? []);
  const slugs = shoes.map((shoe) => shoe.slug);
  const href = comparisonHref(slugs, selection.differences);
  const attributes = selection.differences ? differingAttributes(shoes) : comparisonAttributes;

  return (
    <PageShell width="wide" className="space-y-6">
      <PageHeader title="Compare climbing shoes" eyebrow="Shoe Beta" description="Choose up to three shoes to compare their catalogue details. Try them on to check fit."><Link href="/shoes" className={linkClass}>Browse the catalogue</Link></PageHeader>
      {(selection.adjusted || shoes.length !== selection.slugs.length) && <Notice tone="warning" role="status">Some selections were skipped. Choose up to three different shoes currently in the public catalogue.</Notice>}
      <Card as="form" key={href} action="/compare" method="get" className="grid gap-4 p-4 sm:grid-cols-3">
        {Array.from({ length: comparisonLimit }, (_, i) => (
          <label key={i} className="min-w-0 space-y-1">
            <span className="block text-sm font-medium">Shoe {i + 1}</span>
            <Select name="shoe" defaultValue={slugs[i] ?? ""} className="w-full min-w-0">
              <option value="">Choose a shoe</option>
              {catalogue.map((shoe) => <option key={shoe.slug} value={shoe.slug}>{shoe.brand} {shoe.model}</option>)}
            </Select>
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm sm:col-span-3">
          <input type="checkbox" name="differences" value="1" defaultChecked={selection.differences} /> Show only differing attributes
        </label>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-3">
          <Button disabled={!catalogue.length}>Compare shoes</Button>
          <Link href="/compare" className={linkClass}>Clear comparison</Link>
        </div>
      </Card>
      {!catalogue.length ? <p>No climbing shoes have been added yet.</p> : shoes.length < 2 ? <p role="status">Choose at least two different shoes to see a comparison.</p> : null}
      {shoes.length > 0 && (
        <>
          <p id="comparison-help" className="text-sm text-stone-600">Unknown means unverified, not a match. Identical labels do not guarantee identical fit. These details do not estimate shoe size. On smaller screens, scroll the table sideways.</p>
          <Card tabIndex={0} role="region" aria-label="Shoe comparison table" aria-describedby="comparison-help" className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <caption className="sr-only">Catalogue attributes for {shoes.map((shoe) => `${shoe.brand} ${shoe.model}`).join(", ")}</caption>
              <thead>
                <tr className="bg-stone-50 align-top">
                  <th scope="col" className="w-40 p-4">Attribute</th>
                  {shoes.map((shoe) => <th key={shoe.slug} scope="col" className="min-w-44 space-y-2 p-4">
                    <p className="font-normal text-stone-600">{shoe.brand}</p>
                    <Link href={`/shoes/${encodeURIComponent(shoe.slug)}`} className={linkClass}>{shoe.model}</Link>
                    <p className="font-normal"><Link href={comparisonHref(slugs.filter((slug) => slug !== shoe.slug), selection.differences)} aria-label={`Remove ${shoe.brand} ${shoe.model}`} className={linkClass}>Remove</Link></p>
                  </th>)}
                </tr>
              </thead>
              <tbody>
                {attributes.map(({ key, label, labels }) => <tr key={key} className="border-t border-stone-200">
                  <th scope="row" className="p-4 font-medium">{label}</th>
                  {shoes.map((shoe) => <td key={shoe.slug} className="p-4">{(labels as Record<string, string>)[shoe[key]]}</td>)}
                </tr>)}
                <tr className="border-t border-stone-200 align-top">
                  <th scope="row" className="p-4 font-medium">Manufacturer source</th>
                  {shoes.map((shoe) => <td key={shoe.slug} className="space-y-2 p-4">
                    {shoe.sourceUrl?.startsWith("https://") ? <a href={shoe.sourceUrl} target="_blank" rel="noreferrer" className={linkClass}>Product page (new tab)</a> : <p>Source unavailable</p>}
                    {shoe.sourceCheckedAt && <p className="text-stone-600">Checked <time dateTime={shoe.sourceCheckedAt.toISOString().slice(0, 10)}>{shoe.sourceCheckedAt.toISOString().slice(0, 10)}</time></p>}
                  </td>)}
                </tr>
                <tr className="border-t border-stone-200 align-top">
                  <th scope="row" className="p-4 font-medium">Sizing guidance</th>
                  {shoes.map((shoe) => <td key={shoe.slug} className="space-y-2 p-4"><p>{getSizingGuide(shoe.slug)?.note ?? "No verified model-specific sizing guidance."}</p><Link href={`/shoes/${encodeURIComponent(shoe.slug)}`} className={linkClass}>Check size reference</Link></td>)}
                </tr>
                <tr className="border-t border-stone-200">
                  <th scope="row" className="p-4 font-medium">Your fitting</th>
                  {shoes.map((shoe) => <td key={shoe.slug} className="p-4"><Link href={{ pathname: "/fit-records", query: { shoe: shoe.slug } }} className={linkClass}>Record a fitting</Link></td>)}
                </tr>
              </tbody>
            </table>
          </Card>
          {selection.differences && !attributes.length && <p role="status">No differing catalogue attributes are listed for these selections. Unknown values may hide real differences.</p>}
          <CopyComparisonLink key={href} href={href} />
          <p className="text-sm text-stone-600">The shared link includes shoe selections and the table view only. Your profile and private fit records are not included.</p>
        </>
      )}
    </PageShell>
  );
}
