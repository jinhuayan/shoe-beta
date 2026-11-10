import Link from "next/link";
import { QuestionnaireForm } from "@/components/questionnaire-form";

export const metadata = { title: "Climbing questionnaire | Shoe Beta" };

export default function QuestionnairePage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
      <Link href="/shoes" className="inline-block rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">
        Back to catalogue
      </Link>
      <header className="space-y-2">
        <p className="text-sm font-medium text-stone-500">Shoe Beta</p>
        <h1 className="text-3xl font-semibold tracking-tight">Your feet and climbing</h1>
        <p className="text-stone-600">Review your measurements and preferences. Leave measurements blank or choose “Unsure” when needed.</p>
        <p className="text-sm text-stone-500">No account needed. Signed-in users can save and load a profile. Unsaved answers are cleared when you reload or switch accounts.</p>
      </header>
      <QuestionnaireForm />
    </main>
  );
}
