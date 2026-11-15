import { PageHeader, PageShell } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { ShoeFilter } from "@/components/shoe-filter";
import { closureLabels, downturnLabels, getShoeFilters, getCatalogueWhere, stiffnessLabels, type ShoeSearchParams } from "@/lib/climbing-shoes";

export const metadata = { title: "Climbing shoe catalogue | Shoe Beta" };

export default async function ShoesPage({ searchParams }: { searchParams: Promise<ShoeSearchParams> }) {
  await connection();
  const filters = getShoeFilters(await searchParams);
  const hasFilters = Object.keys(filters).length > 0;
  const [shoes, brands] = await Promise.all([
    getDb().shoe.findMany({ where: getCatalogueWhere(filters), orderBy: [{ brand: "asc" }, { model: "asc" }] }),
    getDb().shoe.findMany({ where: { isSample: false }, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
  ]);

  return (
    <PageShell className="space-y-6">
      <section className="catalogue-hero" aria-label="Climbing shoe field guide">
        <PageHeader title="Climbing shoe catalogue" eyebrow="Shoe Beta / Field guide" description="Explore the details. Compare your options. Find your next pair to try on."><Button asChild><Link href="/questionnaire">Take the fit questionnaire <span aria-hidden="true">↗</span></Link></Button></PageHeader>
        <div className="catalogue-art" aria-hidden="true">
          <svg viewBox="0 0 440 320" fill="none">
            <g stroke="currentColor" strokeWidth="1"><path d="M-30 250C40 110 120 330 190 180S310 30 480 110" /><path d="M-20 275C60 130 130 350 210 200S330 50 480 140" /><path d="M-20 220C20 70 100 300 170 155S290 0 480 80" /><path d="M-20 190C20 40 90 260 150 130S270-30 470 50" /><path d="M-20 305C80 160 150 380 230 225S350 80 490 170" /></g>
            <path className="route-line" d="m83 259 76-72 68 16 35-93 84-55" strokeWidth="2" strokeDasharray="5 7" />
            <g className="route-holds" strokeWidth="2"><path d="m65 259 18-17 23 7-4 23-25 6-12-19Z" /><path d="m140 181 24-13 17 16-6 19-27 2-8-24Z" /><path d="m210 198 23-12 17 19-12 18-24-5-4-20Z" /><path d="m247 104 20-15 18 15-2 20-25 3-11-23Z" /><path d="m328 50 21-11 18 17-12 20-24-7-3-19Z" /></g>
            <g className="route-dots"><circle cx="83" cy="259" r="4" /><circle cx="159" cy="187" r="4" /><circle cx="227" cy="203" r="4" /><circle cx="262" cy="110" r="4" /><circle cx="346" cy="55" r="4" /></g>
          </svg>
          <p>Every foothold<br /><strong>starts with fit.</strong></p>
        </div>
      </section>

      <Card as="form"
        key={JSON.stringify(filters)}
        action="/shoes"
        method="get"
        className="catalogue-filters grid gap-4 p-5 sm:grid-cols-3"
      >
        <p className="filter-caption sm:col-span-3">Narrow the field <span>Search &amp; filter</span></p>
        <label className="space-y-1 sm:col-span-2">
          <span className="block text-sm font-medium">Brand or model</span>
          <Input name="q" type="search" maxLength={100} defaultValue={filters.q} placeholder="e.g. La Sportiva Solution" className="w-full" />
        </label>
        <ShoeFilter name="brand" label="Brand" value={filters.brand} options={Object.fromEntries(brands.map(({ brand }) => [brand, brand]))} />
        <ShoeFilter name="downturn" label="Downturn" value={filters.downturn} options={downturnLabels} />
        <ShoeFilter name="stiffness" label="Stiffness" value={filters.stiffness} options={stiffnessLabels} />
        <ShoeFilter name="closure" label="Closure" value={filters.closure} options={closureLabels} />
        <div className="flex items-center gap-4 sm:col-span-3">
          <Button type="submit">
            Apply filters
          </Button>
          <Link href="/shoes" className="ui-link">Clear filters</Link>
        </div>
      </Card>

      <p className="text-sm text-stone-600">{shoes.length} {shoes.length === 1 ? "shoe" : "shoes"} found. Unknown attributes have not been confirmed from manufacturer information.</p>

      {shoes.length === 0 ? (
        <p className="rounded-lg border border-stone-200 p-6 text-stone-600">
          {hasFilters ? "No climbing shoes match these filters." : "No climbing shoes have been added yet."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {shoes.map((shoe) => (
            <Card as="li" key={shoe.id} className="catalogue-card">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold tracking-wide text-stone-500">{shoe.brand}</p>
              </div>
              <h2 className="text-xl font-medium">
                <Link
                  href={{ pathname: `/shoes/${encodeURIComponent(shoe.slug)}`, query: filters }}
                  className="ui-link"
                >
                  {shoe.model}
                </Link>
              </h2>
              <ul className="shoe-attributes" aria-label="Shoe attributes">{[downturnLabels[shoe.downturn], stiffnessLabels[shoe.stiffness], closureLabels[shoe.closure]].map((label, index) => <li key={index} className="attribute-tag">{label}</li>)}</ul>
              {shoe.description && <p className="text-sm leading-6 text-stone-600">{shoe.description}</p>}
              <Link href={{ pathname: "/compare", query: { shoe: shoe.slug } }} aria-label={`Compare ${shoe.brand} ${shoe.model}`} className="catalogue-action ui-link">Compare this shoe <span aria-hidden="true">↗</span></Link>
            </Card>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
