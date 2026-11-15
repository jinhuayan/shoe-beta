import { AccountSettings } from "@/components/account-settings";

export const metadata = { title: "Account | Shoe Beta", robots: { index: false } };

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 sm:p-10">
      <header className="space-y-2"><h1 className="text-3xl font-semibold tracking-tight">Account</h1><p className="text-stone-600">Manage your name, password, signed-in devices, and personal data.</p></header>
      <AccountSettings />
    </main>
  );
}
