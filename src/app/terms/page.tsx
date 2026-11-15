import { PageHeader, PageShell } from "@/components/ui/page";
import Link from "next/link";

export const metadata = { title: "Terms of use | Shoe Beta" };

export default function TermsPage() {
  return <PageShell className="space-y-4">
    <PageHeader title="Terms of use" eyebrow="Project information" />
    <p>Shoe Beta is a student project providing climbing shoe browsing, personal fitting notes, and shop search. Recommendations are general guidance; try shoes on and use your own judgement about fit.</p>
    <p>Shop results are search matches, and do not establish that a shop sells a particular model or has stock. Contact the shop before visiting. Only upload photos you have permission to use.</p>
    <p>Google Maps content and services are subject to the <a href="https://cloud.google.com/maps-platform/terms" className="ui-link">Google Maps Platform Terms of Service</a> and <a href="https://policies.google.com/privacy" className="ui-link">Google Privacy Policy</a>, which are incorporated for the shop search feature.</p>
    <Link href="/shops" className="inline-block underline">Back to shop search</Link>
  </PageShell>;
}
