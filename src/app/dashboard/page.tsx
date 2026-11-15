import { PageHeader, PageShell } from "@/components/ui/page";
import { ClimbingDashboard } from "@/components/climbing-dashboard";

export const metadata = { title: "My climbing | Shoe Beta", robots: { index: false } };
export default function DashboardPage() {
  return (
    <PageShell className="space-y-6">
      <PageHeader title="My climbing" eyebrow="Shoe Beta" description="Your saved profile, shoes to try, and recent fittings in one private place." />
      <ClimbingDashboard />
    </PageShell>
  );
}
