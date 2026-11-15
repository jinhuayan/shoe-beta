import { ClimbingDashboard } from "@/components/climbing-dashboard";

export const metadata = { title: "My climbing | Shoe Beta", robots: { index: false } };
export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6 sm:p-10">
      <header className="space-y-2"><p className="text-sm text-stone-500">Shoe Beta</p><h1 className="text-3xl font-semibold tracking-tight">My climbing</h1><p className="text-stone-600">Your saved profile, shoes to try, and recent fittings in one private place.</p></header>
      <ClimbingDashboard />
    </main>
  );
}
