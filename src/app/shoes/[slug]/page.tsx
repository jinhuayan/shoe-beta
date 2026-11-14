import Link from "next/link";
import { ShoeSizeCalculator } from "@/components/shoe-size-calculator";
import { getSizingGuide } from "@/lib/shoe-sizing";
import { SaveShoesButton } from "@/components/save-shoes-button";
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
      {shoe.sourceUrl?.startsWith("https://") && (
        <section className="space-y-2 rounded-lg bg-stone-50 p-4 text-sm text-stone-600">
          <h2 className="font-medium text-stone-900">Manufacturer information</h2>
          <p><a href={shoe.sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">View {shoe.brand} product page (opens a new tab)</a></p>
          {shoe.sourceCheckedAt && <p>Checked <time dateTime={shoe.sourceCheckedAt.toISOString().slice(0, 10)}>{shoe.sourceCheckedAt.toLocaleDateString("en-CA", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })}</time>.</p>}
          <p>Unknown means the attribute has not been confirmed. Overall shoe volume does not establish forefoot width or heel volume. These details do not predict your shoe size.</p>
        </section>
      )}
      {!shoe.isSample && <section className="space-y-3">
        <h2 className="text-xl font-semibold">Model-specific sizing notes</h2>
        <p className="text-stone-600">{getSizingGuide(shoe.slug)?.note ?? "No verified model-specific sizing guidance is available yet."}</p>
        <ShoeSizeCalculator slug={shoe.slug} />
      </section>}
      {!shoe.isSample && <SaveShoesButton slugs={[shoe.slug]} />}
      {!shoe.isSample && <p><Link href={{ pathname: "/compare", query: { shoe: shoe.slug } }} className="underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Compare with other shoes</Link></p>}
      <Link href={{ pathname: "/fit-records", query: { shoe: shoe.slug } }} className="inline-block rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Record a fitting</Link>
      <p><Link href="/shops" className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Find shops to ask about trying climbing shoes</Link></p>
    </main>
  );
}
