import Link from "next/link";

export default function ShoeNotFound() {
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6 sm:p-10">
      <h1 className="text-3xl font-semibold">Shoe not found</h1>
      <p className="text-stone-600">This shoe is not in our catalogue.</p>
      <Link href="/shoes" className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">
        Back to catalogue
      </Link>
    </main>
  );
}
