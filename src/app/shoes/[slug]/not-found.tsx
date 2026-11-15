import { PageHeader, PageShell } from "@/components/ui/page";
import Link from "next/link";

export default function ShoeNotFound() {
  return (
    <PageShell className="space-y-4">
      <PageHeader title="Shoe not found" eyebrow="Shoe Beta" description="This shoe is not in our catalogue." />
      <Link href="/shoes" className="ui-link">
        Back to catalogue
      </Link>
    </PageShell>
  );
}
