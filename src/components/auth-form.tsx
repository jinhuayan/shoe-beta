"use client";

import { PageHeader, PageShell } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { Input } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

const linkClass = "ui-link";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const signingUp = mode === "sign-up";
  const { data: session, isPending } = authClient.useSession();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (signingUp && !name) {
      setError("Enter your name.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const credentials = { email: String(data.get("email")).trim(), password: String(data.get("password")) };
      const result = signingUp
        ? await authClient.signUp.email({ ...credentials, name })
        : await authClient.signIn.email(credentials);
      if (result.error) {
        setError(result.error.status === 429 ? "Too many attempts. Please try again shortly."
          : result.error.status >= 500 ? "Account service is unavailable. Please try again."
          : result.error.message || "Check your details and try again.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell width="narrow" className="space-y-6">
      <PageHeader title={signingUp ? "Create an account" : "Sign in"} eyebrow="Your climbing notebook" description={signingUp ? "Keep your climbing profile, saved shoes and fit notes together." : "Welcome back to your shoes and fit notes."} />
      {isPending ? <p role="status" className="text-stone-600">Checking your session…</p> : session ? (
        <p className="break-words text-stone-600">You’re signed in as {session.user.name}.</p>
      ) : (
        <>
          <Card as="form" onSubmit={submit} aria-busy={pending} className="p-5 sm:p-6">
            <fieldset disabled={pending} className="space-y-4">
              {error && <Notice tone="error" role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }}>{error}</Notice>}
              {signingUp && (
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium">Name</label>
                  <Input id="name" name="name" autoComplete="name" required maxLength={100} />
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <Input id="email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                <Input id="password" name="password" type="password" autoComplete={signingUp ? "new-password" : "current-password"} required minLength={signingUp ? 8 : undefined} maxLength={128} aria-describedby={signingUp ? "password-hint" : undefined} />
                {signingUp && <p id="password-hint" className="text-sm text-stone-500">Use 8–128 characters.</p>}
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? (signingUp ? "Creating account…" : "Signing in…") : signingUp ? "Create account" : "Sign in"}
              </Button>
            </fieldset>
          </Card>
          <p className="text-sm text-stone-600">
            {signingUp ? "Already have an account? " : "New to Shoe Beta? "}
            <Link href={signingUp ? "/sign-in" : "/sign-up"} className={linkClass}>{signingUp ? "Sign in" : "Create an account"}</Link>
          </p>
        </>
      )}
      <Link href="/shoes" className={`inline-block text-sm ${linkClass}`}>{session ? "Back to climbing shoes" : "Browse climbing shoes as a guest"}</Link>
    </PageShell>
  );
}
