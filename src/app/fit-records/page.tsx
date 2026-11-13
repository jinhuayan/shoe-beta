import { FitRecords } from "@/components/fit-records";

export const metadata = { title: "My fit records | Shoe Beta" };

export default async function FitRecordsPage({ searchParams }: { searchParams: Promise<{ shoe?: string | string[] }> }) {
  const { shoe } = await searchParams;
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">My fit records</h1>
        <p className="text-stone-600">Keep track of climbing shoes you’ve tried, compare sizes, and review how each area felt.</p>
      </header>
      <FitRecords initialShoeSlug={typeof shoe === "string" ? shoe : undefined} />
    </main>
  );
}
