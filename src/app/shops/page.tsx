import { ShopSearch } from "@/components/shop-search";

export const metadata = { title: "Find climbing shoe shops | Shoe Beta" };

export default function ShopsPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Find climbing shoe shops</h1>
        <p className="text-stone-600">Search a city or neighbourhood for places to ask about trying climbing shoes.</p>
      </header>
      <ShopSearch />
    </main>
  );
}
