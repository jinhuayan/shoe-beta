"use client";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Card } from "@/components/ui/card";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { choiceFields } from "@/lib/questionnaire";
import { fitLabels } from "@/lib/fit-records";
import { comparisonHref } from "@/lib/shoe-comparison";
import type { DashboardData } from "@/lib/climbing-dashboard";
import { SizeReference } from "@/components/size-reference";
import { SaveShoesButton } from "@/components/save-shoes-button";

const linkClass = "ui-link";
export function ClimbingDashboard() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  if (!session && isPending) return <p role="status">Checking account…</p>;
  if (!session && error) return <p role="alert">Account service is unavailable. <Button variant="ghost" onClick={() => void refetch()}>Retry</Button></p>;
  if (!session) return <p><Link href="/sign-in" className={linkClass}>Sign in</Link> to see your climbing overview, or <Link href="/questionnaire" className={linkClass}>try the guest questionnaire</Link>.</p>;
  return <DashboardOverview key={session.user.id} onSessionExpired={refetch} />;
}

function DashboardOverview({ onSessionExpired }: { onSessionExpired: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (response.status === 401) { setData(null); onSessionExpired(); }
        if (!response.ok) throw new Error(result.error || "Could not load your overview.");
        setData(result);
      } catch (failure) { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Could not connect. Please try again."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [attempt, onSessionExpired]);
  const refresh = () => { setError(""); setLoading(true); setAttempt((value) => value + 1); };
  if (!data) return error ? <p role="alert">{error} <Button variant="ghost" onClick={refresh}>Retry</Button></p> : <p role="status">Loading your climbing overview…</p>;
  const profile = data.profile;
  const recommendations = data.recommendations;
  return (
    <div className="space-y-8" aria-busy={loading}>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-stone-600">Only your account can see this overview.</p><Button variant="ghost" disabled={loading} onClick={refresh}>{loading ? "Refreshing…" : "Refresh overview"}</Button></div>
      {error && <Notice tone="error" role="alert">{error} The last loaded overview is still shown.</Notice>}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Fittings", data.summary.fittings], ["Models tried", data.summary.models], ["Saved shoes", data.summary.saved], ["Fitting photos", data.summary.photos]].map(([label, count]) => <Card key={label} className="p-4"><dt className="text-sm text-stone-600">{label}</dt><dd className="mt-2 text-2xl font-semibold">{count}</dd></Card>)}</dl>
      <section className="space-y-3 rounded-lg bg-stone-50 p-5" aria-labelledby="next-steps-heading">
        <h2 id="next-steps-heading" className="text-xl font-semibold">Your next steps</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li><Link href="/questionnaire" className={linkClass}>{profile ? "Review or update your climbing profile" : "Create and save your climbing profile"}</Link></li>
          <li><Link href={data.summary.saved ? "/saved-shoes" : "/shoes"} className={linkClass}>{data.summary.saved ? "Choose saved shoes to compare or try" : "Browse and save shoes you want to try"}</Link></li>
          <li><Link href={data.summary.fittings ? "/fit-records" : "/shops"} className={linkClass}>{data.summary.fittings ? "Review your fitting journal or add a photo" : "Find shops and plan your first fitting"}</Link></li>
        </ul>
      </section>
      <section className="space-y-4" aria-labelledby="dashboard-profile-heading">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="dashboard-profile-heading" className="text-xl font-semibold">Saved climbing profile</h2><Link href="/questionnaire" className={linkClass}>Open questionnaire</Link></div>
        {!profile ? <p>No valid saved profile yet. Complete the questionnaire and choose Save profile to keep your answers.</p> : <>
          <dl className="grid gap-4 rounded-lg border border-stone-200 p-5 sm:grid-cols-2">
            <div><dt className="text-sm text-stone-500">Foot length</dt><dd>{profile.footLengthMm === null ? "Unsure" : `${profile.footLengthMm} mm`}</dd></div>
            <div><dt className="text-sm text-stone-500">Street size</dt><dd>{profile.streetSizeEu === null ? "Unsure" : `EU ${profile.streetSizeEu}`}</dd></div>
            {Object.entries(choiceFields).map(([name, field]) => <div key={name}><dt className="text-sm text-stone-500">{field.label}</dt><dd>{(field.options as Record<string, string>)[profile[name as keyof typeof choiceFields]]}</dd></div>)}
          </dl>
          {data.profileUpdatedAt && <p className="text-sm text-stone-500">Profile updated <time dateTime={data.profileUpdatedAt}>{new Date(data.profileUpdatedAt).toLocaleDateString("en-CA")}</time></p>}
        </>}
      </section>
      <section className="space-y-4" aria-labelledby="dashboard-recommendations-heading">
        <h2 id="dashboard-recommendations-heading" className="text-xl font-semibold">From your saved profile</h2>
        <p className="text-sm text-stone-600">Uses the same catalogue rules as the questionnaire. Fitting records do not change these rankings.</p>
        {!recommendations ? <p>Save a profile to see recommendations here.</p> : recommendations.status === "insufficient" ? <p>Your saved answers do not provide enough matching information. Review the questionnaire or browse all shoes.</p> : recommendations.status === "empty" ? <p>No shortlist is available for your saved preferences in the current catalogue. You can still browse and try shoes.</p> : <>
          <div className="flex flex-wrap items-center gap-4"><Link href={comparisonHref(recommendations.shoes.map((shoe) => shoe.slug))} className={linkClass}>Compare these recommendations</Link><SaveShoesButton slugs={recommendations.shoes.map((shoe) => shoe.slug)} onSaved={refresh} /></div>
          <ol className="grid gap-4 lg:grid-cols-3">{recommendations.shoes.map((shoe) => <Card as="li" key={shoe.slug} className="space-y-3 p-4">
            <p className="text-sm text-stone-500">{shoe.brand}</p><h3 className="text-lg font-semibold"><Link href={`/shoes/${encodeURIComponent(shoe.slug)}`} className={linkClass}>{shoe.model}</Link></h3>
            <ul className="list-disc space-y-1 pl-4 text-sm">{shoe.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
            {shoe.tradeoffs.length > 0 && <details className="text-sm text-stone-600"><summary className="cursor-pointer">Tradeoffs</summary><ul className="list-disc space-y-1 pl-4">{shoe.tradeoffs.map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul></details>}
            <SizeReference reference={shoe.sizeReference} />
          </Card>)}</ol>
        </>}
      </section>
      <section className="space-y-4" aria-labelledby="dashboard-saved-heading">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="dashboard-saved-heading" className="text-xl font-semibold">Shoes to revisit</h2><Link href="/saved-shoes" className={linkClass}>All saved shoes</Link></div>
        {!data.saved.length ? <p>No saved shoes yet. Save a shoe from its details or a recommendation shortlist.</p> : <><p className="text-sm text-stone-600">Showing {data.saved.length} of {data.summary.saved} saved shoes, newest first. Tried means you recorded a fitting, not that the shoe fits.</p><ul className="grid gap-4 sm:grid-cols-2">{data.saved.map(({ shoe, fittings }) => <Card as="li" key={shoe.id} className="space-y-2 p-4"><h3 className="font-medium"><Link href={`/shoes/${encodeURIComponent(shoe.slug)}`} className={linkClass}>{shoe.brand} {shoe.model}</Link></h3><p className="text-sm text-stone-600">{fittings ? `${fittings} fitting${fittings === 1 ? "" : "s"} recorded` : "Not tried yet"}{shoe.isSample ? " · Not in the public catalogue" : ""}</p><Link href={`/shoes/${encodeURIComponent(shoe.slug)}#my-fittings`} className={linkClass}>Open fitting workspace</Link></Card>)}</ul></>}
      </section>
      <section className="space-y-4" aria-labelledby="dashboard-recent-heading">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="dashboard-recent-heading" className="text-xl font-semibold">Recently added fittings</h2><Link href="/fit-records" className={linkClass}>Open fitting journal</Link></div>
        {!data.recent.length ? <p>No fitting records yet. Add one after trying on a shoe.</p> : <ol className="space-y-3">{data.recent.map((record) => <Card as="li" key={record.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="space-y-1"><h3 className="font-medium"><Link href={`/shoes/${encodeURIComponent(record.shoe.slug)}`} className={linkClass}>{record.shoe.brand} {record.shoe.model}</Link></h3><p className="text-sm text-stone-600">EU {record.sizeEu} · {fitLabels[record.fit]} · {record.rating === null ? "Not rated" : `${record.rating} / 5`}</p><p className="break-words text-sm text-stone-600">Tried {record.triedOn ?? "date not recorded"}{record.location ? ` · ${record.location}` : ""}</p></div><time dateTime={record.createdAt} className="text-sm text-stone-500">Added {new Date(record.createdAt).toLocaleDateString("en-CA")}</time></Card>)}</ol>}
      </section>
    </div>
  );
}
