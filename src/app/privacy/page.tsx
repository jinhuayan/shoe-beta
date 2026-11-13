import Link from "next/link";

export const metadata = { title: "Privacy | Shoe Beta" };

export default function PrivacyPage() {
  return <main className="mx-auto max-w-4xl space-y-4 p-6 sm:p-10">
    <h1 className="text-3xl font-semibold">Privacy</h1>
    <p>Shoe Beta is a student project. Accounts, saved profiles, and fit records are stored in PostgreSQL. Attached photos are stored privately in DigitalOcean Spaces. You can remove your own records and photos from the fit records page.</p>
    <p>Shop searches send the area you enter to Google Maps through our server. Search terms and shop results are not saved in our database or browser storage. Hosting and API providers may process request data under their own policies.</p>
    <p>Google handles search data under its <a href="https://policies.google.com/privacy" className="underline">Privacy Policy</a>. Using Google Maps links opens a separate service.</p>
    <p>Unsaved questionnaire answers stay in page state and are cleared on reload or account changes. Signing in uses session cookies. Contact the project team for questions about stored account data.</p>
    <Link href="/shops" className="inline-block underline">Back to shop search</Link>
  </main>;
}
