"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { RecordShoe } from "@/lib/fit-records";
import type { PersonalShoeData } from "@/lib/shoe-fittings";
import { FitRecords } from "@/components/fit-records";
import { SizeReference } from "@/components/size-reference";

const linkClass = "rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2";

export function ShoePersonalDetails({ shoe }: { shoe: RecordShoe }) {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  return (
    <section id="my-fittings" className="space-y-5 border-t border-stone-200 pt-6" aria-labelledby="my-shoe-heading">
      <h2 id="my-shoe-heading" className="text-2xl font-semibold">Your fitting workspace</h2>
      {!session && isPending ? <p role="status">Checking account…</p> : !session && error ? <p role="alert">Account service is unavailable. <button type="button" onClick={() => void refetch()} className={linkClass}>Retry</button></p> : !session ? <p><Link href="/sign-in" className={linkClass}>Sign in</Link> to save this shoe and manage its fitting records, size observations, and photos here.</p> : <div key={`${session.user.id}:${shoe.id}`} className="space-y-6">
        <p className="text-sm text-stone-600">Only your account can see these fittings and saved-profile details.</p>
        <PersonalSummary shoe={shoe} onSessionExpired={refetch} />
        <FitRecords shoe={shoe} />
      </div>}
    </section>
  );
}

function PersonalSummary({ shoe, onSessionExpired }: { shoe: RecordShoe; onSessionExpired: () => void }) {
  const [data, setData] = useState<PersonalShoeData | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const lifecycle = useRef<AbortController | null>(null);
  const pending = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/shoes/${encodeURIComponent(shoe.slug)}/personal`, { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (response.status === 401) { setData(null); onSessionExpired(); }
        if (!response.ok) throw new Error(result.error || "Couldn't load your shoe details.");
        setData(result);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Couldn't connect. Please try again.");
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [attempt, shoe.slug, onSessionExpired]);
  const refresh = () => { setLoading(true); setError(""); setMessage(""); setConfirmRemove(false); setAttempt((value) => value + 1); };
  async function toggleSaved() {
    if (!data || pending.current || !lifecycle.current || loading) return;
    pending.current = true;
    const wasSaved = data.saved;
    const signal = lifecycle.current.signal;
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/saved-shoes", { method: wasSaved ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(wasSaved ? { shoeId: shoe.id } : { slugs: [shoe.slug] }), signal });
      const result = await response.json();
      if (signal.aborted) return;
      if (response.status === 401) { setData(null); onSessionExpired(); }
      if (response.status === 404 && wasSaved) { refresh(); return; }
      if (!response.ok) throw new Error(result.error || "Couldn't update your saved shoe.");
      setData((previous) => previous ? { ...previous, saved: !wasSaved } : previous);
      setConfirmRemove(false);
      setMessage(wasSaved ? "Removed from saved shoes. Your fittings are kept." : "Saved to your shoes.");
    } catch (failure) {
      if (!signal.aborted) setError(failure instanceof Error ? failure.message : "Couldn't connect. Please try again.");
    } finally { pending.current = false; if (!signal.aborted) setSaving(false); }
  }
  return (
    <section className="space-y-4 rounded-lg border border-stone-200 p-5" aria-labelledby="personal-shoe-heading" aria-busy={loading || saving}>
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 id="personal-shoe-heading" className="text-lg font-semibold">Saved shoe and profile reference</h3><button type="button" disabled={loading || saving} onClick={refresh} className={`${linkClass} text-sm disabled:opacity-50`}>Refresh shoe details</button></div>
      {loading && <p role="status">Loading your shoe details…</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error} <button type="button" disabled={loading || saving} onClick={refresh} className={linkClass}>Reload details</button></p>}
      {message && <p role="status" className="text-sm text-green-800">{message}</p>}
      {data && <>
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm font-medium">{data.saved ? "In your saved shoes" : "Not saved yet"}</p>
          {(data.saved || !shoe.isSample) && <button type="button" disabled={loading || saving} onClick={() => data.saved ? setConfirmRemove(true) : void toggleSaved()} className={`${linkClass} text-sm disabled:opacity-50`}>{saving ? "Please wait…" : data.saved ? "Remove from saved shoes" : "Save to my shoes"}</button>}
          <Link href="/saved-shoes" className={`${linkClass} text-sm`}>All saved shoes</Link>
        </div>
        {confirmRemove && <div className="flex flex-wrap items-center gap-3 text-sm"><p>Remove this shoe from your saved list? Your fitting records stay.</p><button type="button" disabled={saving || loading} onClick={() => void toggleSaved()} className={`${linkClass} text-red-700`}>Confirm removal</button><button type="button" disabled={saving || loading} onClick={() => setConfirmRemove(false)} className={linkClass}>Cancel removal</button></div>}
        {!data.reference ? <p className="text-sm text-stone-600"><Link href="/questionnaire" className={linkClass}>Save a climbing profile</Link> to see this shoe’s sizing reference from your saved answers.</p> : <div className="space-y-3">
          <p className="text-sm text-stone-600">From your saved street size and fit preference{data.profileUpdatedAt && <> · Profile updated <time dateTime={data.profileUpdatedAt}>{new Date(data.profileUpdatedAt).toLocaleDateString("en-CA")}</time></>}. <Link href="/questionnaire" className={linkClass}>Review profile</Link></p>
          <SizeReference reference={data.reference} />
          <p className="text-sm text-stone-500">Fitting observations below do not change this manufacturer-based reference. No size is automatically entered in a new fitting.</p>
        </div>}
      </>}
    </section>
  );
}
