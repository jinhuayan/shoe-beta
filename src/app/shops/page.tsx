import { PageHeader, PageShell } from "@/components/ui/page";
import { ShopSearch } from "@/components/shop-search";

export const metadata = { title: "Find climbing shoe shops | Shoe Beta" };

export default function ShopsPage() {
  return (
    <PageShell className="space-y-6">
      <PageHeader title="Find climbing shoe shops" eyebrow="Shoe Beta" description="Search a city or neighbourhood for places to ask about trying climbing shoes." />
      <ShopSearch />
    </PageShell>
  );
}
