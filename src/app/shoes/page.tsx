import { connection } from "next/server";
import { getDb } from "@/lib/db";

export const metadata = { title: "Shoe catalogue | Shoe Beta" };

export default async function ShoesPage() {
  await connection();
  const shoes = await getDb().shoe.findMany({
    orderBy: [{ brand: "asc" }, { model: "asc" }],
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
      <header className="space-y-2">
        <p className="text-sm font-medium text-stone-500">Shoe Beta</p>
        <h1 className="text-3xl font-semibold tracking-tight">Shoe catalogue</h1>
        <p className="text-stone-600">Browse the shoes in our catalogue.</p>
      </header>

      {shoes.some((shoe) => shoe.isSample) && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Entries marked “Sample” are fictional test data, not real products.
        </p>
      )}

      {shoes.length === 0 ? (
        <p className="rounded-lg border border-stone-200 p-6 text-stone-600">
          No shoes have been added yet.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {shoes.map((shoe) => (
            <li key={shoe.id} className="space-y-3 rounded-lg border border-stone-200 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-stone-500">{shoe.brand}</p>
                {shoe.isSample && <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">Sample</span>}
              </div>
              <h2 className="text-xl font-medium">{shoe.model}</h2>
              {shoe.description && <p className="text-sm leading-6 text-stone-600">{shoe.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
