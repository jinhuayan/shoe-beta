"use client";

export default function CatalogueError({ retry }: { retry: () => void }) {
  return (
    <main className="mx-auto max-w-4xl space-y-4 p-6 sm:p-10">
      <h1 className="text-3xl font-semibold">Climbing shoe catalogue</h1>
      <p role="alert">The catalogue is unavailable right now. Please try again.</p>
      <button onClick={() => retry()} className="rounded-lg border border-stone-300 px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2">
        Try again
      </button>
    </main>
  );
}
