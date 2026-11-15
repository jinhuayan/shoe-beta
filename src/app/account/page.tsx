import { PageHeader, PageShell } from "@/components/ui/page";
import { AccountSettings } from "@/components/account-settings";

export const metadata = { title: "Account | Shoe Beta", robots: { index: false } };

export default function AccountPage() {
  return (
    <PageShell className="space-y-6">
      <PageHeader title="Account" eyebrow="Shoe Beta" description="Manage your name, password, signed-in devices, and personal data." />
      <AccountSettings />
    </PageShell>
  );
}
