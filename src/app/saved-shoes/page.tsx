import { SavedShoes } from "@/components/saved-shoes";

export const metadata = { title: "My saved shoes | Shoe Beta", robots: { index: false } };
export default function SavedShoesPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">My saved shoes</h1>
        <p className="text-stone-600">Keep a private shortlist of climbing shoes to try. Select up to three to compare.</p>
      </header>
      <SavedShoes />
    </main>
  );
}
