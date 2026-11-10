import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/lib/db";
import { closureLabels, downturnLabels, getShoeFilters, heelVolumeLabels, stiffnessLabels, widthLabels, type ShoeSearchParams } from "@/lib/climbing-shoes";

export const metadata = { title: "Climbing shoe details | Shoe Beta" };

type ShoePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<ShoeSearchParams>;
};

export default async function ShoePage({ params, searchParams }: ShoePageProps) {
  await connection();
  const { slug } = await params;
  const filters = getShoeFilters(await searchParams);
  const shoe = await getDb().shoe.findUnique({ where: { slug } });

  if (!shoe) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
      <Link href={{ pathname: "/shoes", query: filters }} className="inline-block rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">
        Back to catalogue
      </Link>
      <header className="space-y-2">
        <p className="text-sm text-stone-500">{shoe.brand}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{shoe.model}</h1>
      </header>
      {shoe.isSample && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          This is a fictional sample climbing shoe, not a real product.
        </p>
      )}
      <p className="leading-7 text-stone-600">
        {shoe.description?.trim() || "No description available yet."}
      </p>
      <dl className="grid gap-4 rounded-lg border border-stone-200 p-4 sm:grid-cols-3">
        <div>
          <dt className="text-sm text-stone-500">Downturn</dt>
          <dd className="mt-1 font-medium">{downturnLabels[shoe.downturn]}</dd>
        </div>
        <div>
          <dt className="text-sm text-stone-500">Stiffness</dt>
          <dd className="mt-1 font-medium">{stiffnessLabels[shoe.stiffness]}</dd>
        </div>
        <div>
          <dt className="text-sm text-stone-500">Closure</dt>
          <dd className="mt-1 font-medium">{closureLabels[shoe.closure]}</dd>
        </div>
        <div>
          <dt className="text-sm text-stone-500">Forefoot width</dt>
          <dd className="mt-1 font-medium">{widthLabels[shoe.width]}</dd>
        </div>
        <div>
          <dt className="text-sm text-stone-500">Heel volume</dt>
          <dd className="mt-1 font-medium">{heelVolumeLabels[shoe.heelVolume]}</dd>
        </div>
      </dl>
    </main>
  );
}
