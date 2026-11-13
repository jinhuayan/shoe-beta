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
    <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-stone-500">Shoe Beta</p>
        <h1 className="text-3xl font-semibold tracking-tight">Climbing shoe catalogue</h1>
        <p className="text-stone-600">Search by brand or model, then narrow down the shoe attributes.</p>
        <Link href="/questionnaire" className="inline-block rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Review your feet and climbing preferences</Link>
      </header>

      <form
        key={JSON.stringify(filters)}
        action="/shoes"
        method="get"
        className="grid gap-4 rounded-lg border border-stone-200 p-4 sm:grid-cols-3"
      >
        <label className="space-y-1 sm:col-span-2">
          <span className="block text-sm font-medium">Brand or model</span>
          <input name="q" type="search" maxLength={100} defaultValue={filters.q} placeholder="e.g. La Sportiva Solution" className="w-full rounded-lg border border-stone-300 px-3 py-2" />
        </label>
        <ShoeFilter name="brand" label="Brand" value={filters.brand} options={Object.fromEntries(brands.map(({ brand }) => [brand, brand]))} />
        <ShoeFilter name="downturn" label="Downturn" value={filters.downturn} options={downturnLabels} />
        <ShoeFilter name="stiffness" label="Stiffness" value={filters.stiffness} options={stiffnessLabels} />
        <ShoeFilter name="closure" label="Closure" value={filters.closure} options={closureLabels} />
        <div className="flex items-center gap-4 sm:col-span-3">
          <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2">
            Apply filters
          </button>
          <Link href="/shoes" className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Clear filters</Link>
        </div>
      </form>

      <p className="text-sm text-stone-600">{shoes.length} {shoes.length === 1 ? "shoe" : "shoes"} found. Unknown attributes have not been confirmed from manufacturer information.</p>

      {shoes.length === 0 ? (
        <p className="rounded-lg border border-stone-200 p-6 text-stone-600">
          {hasFilters ? "No climbing shoes match these filters." : "No climbing shoes have been added yet."}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {shoes.map((shoe) => (
            <li key={shoe.id} className="space-y-3 rounded-lg border border-stone-200 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-stone-500">{shoe.brand}</p>
              </div>
              <h2 className="text-xl font-medium">
                <Link
                  href={{ pathname: `/shoes/${encodeURIComponent(shoe.slug)}`, query: filters }}
                  className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {shoe.model}
                </Link>
              </h2>
              <p className="text-sm text-stone-500">
                {[downturnLabels[shoe.downturn], stiffnessLabels[shoe.stiffness], closureLabels[shoe.closure]].join(" · ")}
              </p>
              {shoe.description && <p className="text-sm leading-6 text-stone-600">{shoe.description}</p>}
              <Link href={{ pathname: "/compare", query: { shoe: shoe.slug } }} aria-label={`Compare ${shoe.brand} ${shoe.model}`} className="inline-block text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Compare this shoe</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
