import { PageHeader, PageShell } from "@/components/ui/page";
import { FitRecords } from "@/components/fit-records";

export const metadata = { title: "My fit records | Shoe Beta" };

export default async function FitRecordsPage({ searchParams }: { searchParams: Promise<{ shoe?: string | string[] }> }) {
  const { shoe } = await searchParams;
  return (
    <PageShell className="space-y-6">
      <PageHeader title="My fit records" eyebrow="Shoe Beta" description="Keep track of climbing shoes you’ve tried, compare sizes, and review how each area felt." />
      <FitRecords initialShoeSlug={typeof shoe === "string" ? shoe : undefined} />
    </PageShell>
  );
}
