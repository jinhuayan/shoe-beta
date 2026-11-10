"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

const controlClass = "w-full rounded-lg border border-stone-300 bg-white p-2 focus-visible:outline-2 focus-visible:outline-offset-2";
const linkClass = "rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2";

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
      router.replace("/shoes");
      router.refresh();
    } catch {
      setError("Couldn't connect. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 p-6 sm:p-10">
      <h1 className="text-3xl font-semibold tracking-tight">{signingUp ? "Create an account" : "Sign in"}</h1>
      {isPending ? <p role="status" className="text-stone-600">Checking your session…</p> : session ? (
        <p className="break-words text-stone-600">You’re signed in as {session.user.name}.</p>
      ) : (
        <>
          <form onSubmit={submit} aria-busy={pending}>
            <fieldset disabled={pending} className="space-y-4">
              {error && <p role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }} className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              {signingUp && (
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium">Name</label>
                  <input id="name" name="name" autoComplete="name" required maxLength={100} className={controlClass} />
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required className={controlClass} />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium">Password</label>
                <input id="password" name="password" type="password" autoComplete={signingUp ? "new-password" : "current-password"} required minLength={signingUp ? 8 : undefined} maxLength={128} aria-describedby={signingUp ? "password-hint" : undefined} className={controlClass} />
                {signingUp && <p id="password-hint" className="text-sm text-stone-500">Use 8–128 characters.</p>}
              </div>
              <button type="submit" disabled={pending} className="rounded-lg bg-stone-900 px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
                {pending ? (signingUp ? "Creating account…" : "Signing in…") : signingUp ? "Create account" : "Sign in"}
              </button>
            </fieldset>
          </form>
          <p className="text-sm text-stone-600">
            {signingUp ? "Already have an account? " : "New to Shoe Beta? "}
            <Link href={signingUp ? "/sign-in" : "/sign-up"} className={linkClass}>{signingUp ? "Sign in" : "Create an account"}</Link>
          </p>
        </>
      )}
      <Link href="/shoes" className={`inline-block text-sm ${linkClass}`}>{session ? "Back to climbing shoes" : "Browse climbing shoes as a guest"}</Link>
    </main>
  );
}
