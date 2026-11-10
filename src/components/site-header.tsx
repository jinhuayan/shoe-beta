"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const linkClass = "rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2";

export function SiteHeader() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const router = useRouter();

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      const result = await authClient.signOut();
      if (result.error) setSignOutError("Couldn't sign out. Please try again.");
      else router.refresh();
    } catch {
      setSignOutError("Couldn't connect. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="border-b border-stone-200">
      <nav aria-label="Main" className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4 text-sm sm:px-10">
        <div className="flex items-center gap-4">
          <Link href="/shoes" className={`${linkClass} font-semibold`}>Shoe Beta</Link>
          <Link href="/questionnaire" className={linkClass}>Questionnaire</Link>
        </div>
        <div className="flex flex-wrap items-center gap-4" aria-live="polite">
          {isPending ? <span className="text-stone-500">Checking account…</span> : session ? (
            <>
              <span className="max-w-48 truncate" title={session.user.name}>Signed in as {session.user.name}</span>
              <button type="button" disabled={signingOut} onClick={signOut} className={`${linkClass} disabled:opacity-60`}>
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className={linkClass}>Sign in</Link>
              <Link href="/sign-up" className={linkClass}>Create account</Link>
            </>
          )}
        </div>
      </nav>
      {error && !isPending && (
        <p role="status" className="mx-auto max-w-4xl px-6 pb-4 text-sm text-stone-600 sm:px-10">
          Account service is unavailable. <button type="button" onClick={() => void refetch()} className={linkClass}>Retry</button>
        </p>
      )}
      {signOutError && <p role="alert" className="mx-auto max-w-4xl px-6 pb-4 text-sm text-red-700 sm:px-10">{signOutError}</p>}
    </header>
  );
}
