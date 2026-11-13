"use client";

import Link from "next/link";
import { useState } from "react";

export function SaveShoesButton({ slugs }: { slugs: string[] }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [signIn, setSignIn] = useState(false);
  async function save() {
    if (pending) return;
    setPending(true); setMessage(""); setSignIn(false);
    try {
      const response = await fetch("/api/saved-shoes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slugs }) });
      const result = await response.json();
      if (response.status === 401) setSignIn(true);
      if (!response.ok) throw new Error(result.error || "Could not save shoes.");
      setMessage(result.added ? "Saved to your shoes." : "These shoes are already saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not connect. Please try again."); }
    finally { setPending(false); }
  }
  return (
    <div className="space-y-2">
      <button type="button" disabled={pending} onClick={save} className="rounded-lg border border-stone-300 px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">{pending ? "Saving…" : slugs.length === 1 ? "Save to my shoes" : "Save this shortlist"}</button>
      <p role="status" className="text-sm text-stone-600">{message} {signIn ? <Link href="/sign-in" className="underline">Sign in</Link> : message && <Link href="/saved-shoes" className="underline">View saved shoes</Link>}</p>
    </div>
  );
}
