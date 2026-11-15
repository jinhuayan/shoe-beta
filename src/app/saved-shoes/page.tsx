import { PageHeader, PageShell } from "@/components/ui/page";
import { SavedShoes } from "@/components/saved-shoes";

export const metadata = { title: "My saved shoes | Shoe Beta", robots: { index: false } };
export default function SavedShoesPage() {
  return (
    <PageShell className="space-y-6">
      <PageHeader title="My saved shoes" eyebrow="Shoe Beta" description="Keep a private shortlist of climbing shoes to try. Select up to three to compare." />
      <SavedShoes />
    </PageShell>
  );
}
