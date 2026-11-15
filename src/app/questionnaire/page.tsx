import { PageHeader, PageShell } from "@/components/ui/page";
import Link from "next/link";
import { QuestionnaireForm } from "@/components/questionnaire-form";

export const metadata = { title: "Climbing questionnaire | Shoe Beta" };

export default function QuestionnairePage() {
  return (
    <PageShell className="space-y-6">
      <Link href="/shoes" className="inline-block ui-link">
        Back to catalogue
      </Link>
      <PageHeader title="Your feet and climbing" eyebrow="Shoe Beta" description="Review your measurements and preferences. Leave measurements blank or choose “Unsure” when needed."><p className="text-sm text-stone-500">No account needed. Signed-in users can save and load a profile. Unsaved answers are cleared when you reload or switch accounts.</p></PageHeader>
      <QuestionnaireForm />
    </PageShell>
  );
}
