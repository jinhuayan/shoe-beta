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
      <PageHeader title="Climbing shoe catalogue" eyebrow="Shoe Beta" description="Search by brand or model, then narrow down the shoe attributes."><Link href="/questionnaire" className="inline-block ui-link">Review your feet and climbing preferences</Link></PageHeader>

      <Card as="form"
        key={JSON.stringify(filters)}
        action="/shoes"
        method="get"
        className="grid gap-4 p-4 sm:grid-cols-3"
      >
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
              <Link href={{ pathname: "/compare", query: { shoe: shoe.slug } }} aria-label={`Compare ${shoe.brand} ${shoe.model}`} className="catalogue-action ui-link">Compare this shoe</Link>
            </Card>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
