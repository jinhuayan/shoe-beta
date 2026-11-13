"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { comparisonHref } from "@/lib/shoe-comparison";
import type { SavedShoesData } from "@/lib/saved-shoes";

const linkClass = "rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2";
export function SavedShoes() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  if (!session && isPending) return <p role="status">Checking account…</p>;
  if (!session && error) return <p role="alert">Account service is unavailable. <button onClick={() => void refetch()} className={linkClass}>Retry</button></p>;
  if (!session) return <p><Link href="/sign-in" className={linkClass}>Sign in</Link> to save and view your shoes.</p>;
  return <SavedList key={session.user.id} onSessionExpired={refetch} />;
}

function SavedList({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [data, setData] = useState<SavedShoesData | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/saved-shoes", { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (response.status === 401) onSessionExpired();
        if (!response.ok) throw new Error(result.error || "Could not load saved shoes.");
        setData(result);
      } catch (failure) { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not connect."); }
    }
    void load();
    return () => controller.abort();
  }, [attempt, onSessionExpired]);

  async function mutate(method: "POST" | "DELETE", body: object) {
    if (pending) return;
    setPending(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/saved-shoes", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (response.status === 401) onSessionExpired();
      if (!response.ok) throw new Error(result.error || "Could not update saved shoes.");
      const refreshed = await fetch("/api/saved-shoes", { cache: "no-store" });
      const latest = await refreshed.json();
      if (refreshed.status === 401) onSessionExpired();
      if (!refreshed.ok) throw new Error("Change saved. Reload the list to see the latest shoes.");
      setData(latest);
      setSelected((previous) => previous.filter((slug) => latest.saved.some((item: SavedShoesData["saved"][number]) => item.shoe.slug === slug && !item.shoe.isSample)));
      setNotice(method === "DELETE" ? "Shoe removed. You can save it again." : result.added ? "Shoe saved." : "This shoe is already saved.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Could not connect. Please try again."); }
    finally { setPending(false); }
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug = new FormData(event.currentTarget).get("shoe");
    void mutate("POST", { slugs: [slug] });
  }
  const retry = () => { setError(""); setAttempt((value) => value + 1); };
  if (!data) return error ? <p role="alert">{error} <button onClick={retry} className={linkClass}>Retry</button></p> : <p role="status">Loading saved shoes…</p>;
  return (
    <div className="space-y-6" aria-busy={pending}>
      {error && <p role="alert">{error} <button disabled={pending} onClick={retry} className={linkClass}>Reload list</button></p>}
      {notice && <p role="status">{notice}</p>}
      <form onSubmit={save} className="flex flex-wrap items-end gap-3 rounded-lg border border-stone-200 p-4">
        <label className="min-w-0 basis-full space-y-1 sm:flex-1 sm:basis-0"><span className="block text-sm font-medium">Climbing shoe</span>
          <select name="shoe" required defaultValue="" disabled={pending} className="w-full rounded-lg border border-stone-300 p-2">
            <option value="" disabled>Choose a shoe to save</option>
            {data.shoes.map((shoe) => <option key={shoe.id} value={shoe.slug}>{shoe.brand} {shoe.model}</option>)}
          </select>
        </label>
        <button disabled={pending || !data.shoes.length} className="rounded-lg bg-stone-900 px-4 py-2 text-white disabled:opacity-60">Save shoe</button>
      </form>
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-stone-600">{selected.length} of 3 selected</p>
        {selected.length >= 2 ? <Link href={comparisonHref(selected)} className={linkClass}>Compare selected shoes</Link> : <p className="text-sm text-stone-600">Select at least two to compare.</p>}
        {selected.length > 0 && <button onClick={() => setSelected([])} className={linkClass}>Clear selection</button>}
      </div>
      {!data.saved.length ? <p>No saved shoes yet. <Link href="/shoes" className={linkClass}>Browse climbing shoes</Link></p> : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.saved.map(({ shoe }) => <li key={shoe.id} className="space-y-3 rounded-lg border border-stone-200 p-4">
            <p className="text-sm text-stone-600">{shoe.brand}</p>
            <h2 className="text-xl font-medium"><Link href={`/shoes/${encodeURIComponent(shoe.slug)}`} className={linkClass}>{shoe.model}</Link></h2>
            {shoe.isSample ? <p className="text-sm text-stone-600">This shoe is no longer in the public catalogue.</p> : <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selected.includes(shoe.slug)} disabled={pending || (!selected.includes(shoe.slug) && selected.length >= 3)} onChange={(event) => setSelected((previous) => event.target.checked ? [...previous, shoe.slug] : previous.filter((slug) => slug !== shoe.slug))} />Select {shoe.brand} {shoe.model} for comparison
            </label>}
            <p><Link href={{ pathname: "/fit-records", query: { shoe: shoe.slug } }} className={linkClass}>Record a fitting</Link></p>
            <button disabled={pending} onClick={() => void mutate("DELETE", { shoeId: shoe.id })} aria-label={`Remove ${shoe.brand} ${shoe.model} from saved shoes`} className={`${linkClass} text-sm disabled:opacity-60`}>Remove from saved shoes</button>
          </li>)}
        </ul>
      )}
    </div>
  );
}
