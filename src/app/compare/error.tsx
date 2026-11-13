"use client";

import Link from "next/link";

export default function ComparisonError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl space-y-4 p-6 sm:p-10">
      <h1 className="text-2xl font-semibold">Comparison is unavailable</h1>
      <p>We could not load the catalogue. Your selections are still in the URL.</p>
      <button onClick={reset} className="rounded-lg bg-stone-900 px-4 py-2 text-white">Try again</button>
      <p><Link href="/shoes" className="underline underline-offset-4">Back to catalogue</Link></p>
    </main>
  );
}
