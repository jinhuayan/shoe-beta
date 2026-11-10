import Link from "next/link";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { ShoeFilter } from "@/components/shoe-filter";
import { closureLabels, downturnLabels, getShoeFilters, stiffnessLabels, type ShoeSearchParams } from "@/lib/climbing-shoes";

export const metadata = { title: "Climbing shoe catalogue | Shoe Beta" };

export default async function ShoesPage({ searchParams }: { searchParams: Promise<ShoeSearchParams> }) {
  await connection();
  const filters = getShoeFilters(await searchParams);
  const hasFilters = Object.keys(filters).length > 0;
  const shoes = await getDb().shoe.findMany({
    where: filters,
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-stone-500">Shoe Beta</p>
        <h1 className="text-3xl font-semibold tracking-tight">Climbing shoe catalogue</h1>
        <p className="text-stone-600">Browse climbing shoes by downturn, stiffness, and closure.</p>
        <Link href="/questionnaire" className="inline-block rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Review your feet and climbing preferences</Link>
      </header>

      <form
        key={`${filters.downturn ?? ""}:${filters.stiffness ?? ""}:${filters.closure ?? ""}`}
        action="/shoes"
        method="get"
        className="grid gap-4 rounded-lg border border-stone-200 p-4 sm:grid-cols-3"
      >
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

      {shoes.some((shoe) => shoe.isSample) && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Entries marked “Sample” are fictional test data, not real products.
        </p>
      )}

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
                {shoe.isSample && <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">Sample</span>}
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
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
