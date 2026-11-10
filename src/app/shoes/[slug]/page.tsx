import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getDb } from "@/lib/db";

export const metadata = { title: "Shoe details | Shoe Beta" };

export default async function ShoePage({ params }: { params: Promise<{ slug: string }> }) {
  await connection();
  const { slug } = await params;
  const shoe = await getDb().shoe.findUnique({ where: { slug } });

  if (!shoe) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
      <Link href="/shoes" className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">
        Back to catalogue
      </Link>
      <header className="space-y-2">
        <p className="text-sm text-stone-500">{shoe.brand}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{shoe.model}</h1>
      </header>
      {shoe.isSample && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          This is a fictional sample shoe, not a real product.
        </p>
      )}
      <p className="leading-7 text-stone-600">
        {shoe.description?.trim() || "No description available yet."}
      </p>
    </main>
  );
}
