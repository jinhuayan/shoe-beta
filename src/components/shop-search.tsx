"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { ShopResults } from "@/lib/shops";

const linkClass = "rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2";

export function ShopSearch() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<ShopResults | null>(null);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const location = new FormData(event.currentTarget).get("location");
    setPending(true); setError(""); setResults(null);
    try {
      const response = await fetch("/api/shops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Couldn't search for shops. Please try again.");
      setResults(result as ShopResults);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn't connect. Please try again.");
    } finally { setPending(false); }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={search} noValidate aria-busy={pending} className="space-y-3 rounded-lg border border-stone-200 p-5">
        <label htmlFor="shop-location" className="block text-sm font-medium">City or neighbourhood</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input id="shop-location" name="location" required minLength={2} maxLength={100} autoComplete="off" placeholder="Toronto, ON" disabled={pending} aria-describedby="shop-location-hint" className="min-w-0 flex-1 rounded-lg border border-stone-300 p-2 focus-visible:outline-2 focus-visible:outline-offset-2" />
          <button type="submit" disabled={pending} className="rounded-lg bg-stone-900 px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">{pending ? "Searching…" : "Search shops"}</button>
        </div>
        <p id="shop-location-hint" className="text-sm text-stone-500">Your search is sent to Google Maps. Use a city or neighbourhood rather than a home address.</p>
        <p className="flex flex-wrap gap-4 text-sm"><Link href="/privacy" className={linkClass}>Privacy</Link><Link href="/terms" className={linkClass}>Terms of use</Link></p>
      </form>
      {pending && <p role="status" className="text-stone-600">Finding places near your search area…</p>}
      {error && <p role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }} className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
      {results && (
        <section className="space-y-4 rounded-lg border border-stone-200 p-5" aria-labelledby="shop-results-heading">
          <h2 id="shop-results-heading" tabIndex={-1} ref={(node) => { node?.focus(); }} className="break-words text-xl font-semibold">Shop matches near {results.location}</h2>
          {results.demo ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Demo results: fictional test data from a local service.</p> : <div className="px-2.5 pb-1.5 pt-2.5"><Image src="/google-maps-attribution.svg" alt="Google Maps" width={98} height={18} unoptimized className="h-[18px] w-auto" /></div>}
          <p className="text-sm text-stone-600">Search matches may include general sports shops. Call ahead to confirm climbing shoes, sizes, and stock.</p>
          {results.shops.length === 0 ? <p role="status">No shop matches found. Try a nearby city or a broader area.</p> : (
            <ul className="space-y-4">
              {results.shops.map((shop) => (
                <li key={shop.id} className="space-y-2 border-t border-stone-200 pt-4">
                  <h3 className="break-words text-lg font-medium">{shop.name}</h3>
                  <p className="break-words text-stone-600">{shop.address}</p>
                  {shop.temporarilyClosed && <p className="text-sm text-amber-900">Listed as temporarily closed.</p>}
                  <a href={shop.mapsUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>Open in Google Maps</a>
                  {shop.attributions.map((attribution, index) => <p key={index} className="text-xs text-stone-600">Source: {attribution.url ? <a href={attribution.url} target="_blank" rel="noopener noreferrer" className={linkClass}>{attribution.name}</a> : attribution.name}</p>)}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
