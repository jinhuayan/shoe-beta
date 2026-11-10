"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { fitLabels, type FitRecordErrors, type FitRecordList, type SavedFitRecord } from "@/lib/fit-records";

const controlClass = "w-full rounded-lg border border-stone-300 bg-white p-2 focus-visible:outline-2 focus-visible:outline-offset-2";
const linkClass = "rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2";

export function FitRecords({ initialShoeSlug }: { initialShoeSlug?: string }) {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  if (!session && isPending) return <p role="status">Checking account…</p>;
  if (!session && error) return <p role="alert">Account service is unavailable. <button type="button" onClick={() => void refetch()} className={linkClass}>Retry</button></p>;
  if (!session) return <p><Link href="/sign-in" className={linkClass}>Sign in</Link> to save and view your fit records.</p>;
  return <RecordList key={session.user.id} initialShoeSlug={initialShoeSlug} onSessionExpired={refetch} />;
}

function RecordList({ initialShoeSlug, onSessionExpired }: { initialShoeSlug?: string; onSessionExpired: () => void }) {
  const [data, setData] = useState<FitRecordList | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<FitRecordErrors>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/fit-records", { cache: "no-store", signal: controller.signal });
        const result = await response.json();
        if (controller.signal.aborted) return;
        if (response.status === 401) onSessionExpired();
        if (!response.ok) throw new Error(result.error || "Couldn't load your fit records.");
        setData(result as FitRecordList);
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Couldn't connect. Please try again.");
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt, onSessionExpired]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setSaving(true);
    setError("");
    setErrors({});
    setNotice("");
    try {
      const response = await fetch("/api/fit-records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json();
      if (response.status === 401) onSessionExpired();
      if (response.status === 400 && result.errors) {
        setErrors(result.errors);
        return;
      }
      if (!response.ok) throw new Error(result.error || "Couldn't save your fit record.");
      const record = result.record as SavedFitRecord;
      setData((previous) => previous ? { ...previous, records: [record, ...previous.records] } : previous);
      form.reset();
      setNotice("Fit record saved.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn't connect. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!data) return error ? (
    <p role="alert">{error} <button type="button" onClick={() => { setError(""); setAttempt((value) => value + 1); }} className={linkClass}>Retry</button></p>
  ) : <p role="status">Loading your fit records…</p>;

  const selectedShoe = data.shoes.find((shoe) => shoe.slug === initialShoeSlug)?.id ?? "";
  return (
    <div className="space-y-6">
      {error && <p role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }} className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
      {notice && <p role="status" className="text-sm text-stone-600">{notice}</p>}
      {data.shoes.length === 0 ? <p className="text-stone-600">No climbing shoes are available to record yet.</p> : (
        <form key={initialShoeSlug ?? "new"} onSubmit={save} noValidate aria-busy={saving} className="rounded-lg border border-stone-200 p-5">
          <h2 className="mb-4 text-xl font-semibold">Add a fit record</h2>
          <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
            {Object.keys(errors).length > 0 && <p role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }} className="rounded-lg bg-red-50 p-3 text-red-800 sm:col-span-2">Check the highlighted fields.</p>}
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="shoeId" className="block text-sm font-medium">Climbing shoe</label>
              <select id="shoeId" name="shoeId" required defaultValue={selectedShoe} {...fieldProps("shoeId")}>
                <option value="">Choose a shoe</option>
                {data.shoes.map((shoe) => <option key={shoe.id} value={shoe.id}>{shoe.brand} {shoe.model}{shoe.isSample ? " (sample)" : ""}</option>)}
              </select>
              {fieldError("shoeId")}
            </div>
            <div className="space-y-2">
              <label htmlFor="sizeEu" className="block text-sm font-medium">EU size worn</label>
              <input id="sizeEu" name="sizeEu" type="number" min={20} max={55} step={0.5} required {...fieldProps("sizeEu")} />
              <p className="text-sm text-stone-500">Use whole or half sizes, from 20 to 55.</p>
              {fieldError("sizeEu")}
            </div>
            <div className="space-y-2">
              <label htmlFor="fit" className="block text-sm font-medium">Overall fit</label>
              <select id="fit" name="fit" defaultValue="UNKNOWN" {...fieldProps("fit")}>
                {Object.entries(fitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              {fieldError("fit")}
            </div>
            <div className="space-y-2">
              <label htmlFor="rating" className="block text-sm font-medium">Rating (optional)</label>
              <select id="rating" name="rating" defaultValue="" {...fieldProps("rating")}>
                <option value="">Not rated</option>
                {[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} / 5</option>)}
              </select>
              {fieldError("rating")}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium">Notes (optional)</label>
              <textarea id="notes" name="notes" rows={3} maxLength={1000} {...fieldProps("notes")} />
              <p className="text-sm text-stone-500">Up to 1,000 characters.</p>
              {fieldError("notes")}
            </div>
            <button type="submit" disabled={saving} className="justify-self-start rounded-lg bg-stone-900 px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">{saving ? "Saving…" : "Save fit record"}</button>
          </fieldset>
        </form>
      )}
      <section className="space-y-4" aria-labelledby="records-heading">
        <h2 id="records-heading" className="text-xl font-semibold">Saved records</h2>
        {data.records.length === 0 ? <p className="text-stone-600">No fit records yet.</p> : (
          <ul className="space-y-4">
            {data.records.map((record) => (
              <li key={record.id} className="space-y-3 rounded-lg border border-stone-200 p-5">
                <h3 className="text-lg font-medium"><Link href={`/shoes/${encodeURIComponent(record.shoe.slug)}`} className={linkClass}>{record.shoe.brand} {record.shoe.model}</Link></h3>
                {record.shoe.isSample && <p className="text-sm text-amber-900">Fictional sample climbing shoe.</p>}
                <dl className="grid gap-3 sm:grid-cols-3">
                  <div><dt className="text-sm text-stone-500">Size worn</dt><dd>EU {record.sizeEu}</dd></div>
                  <div><dt className="text-sm text-stone-500">Overall fit</dt><dd>{fitLabels[record.fit]}</dd></div>
                  <div><dt className="text-sm text-stone-500">Rating</dt><dd>{record.rating === null ? "Not rated" : `${record.rating} / 5`}</dd></div>
                </dl>
                {record.notes && <p className="whitespace-pre-wrap break-words text-stone-600">{record.notes}</p>}
                <p className="text-sm text-stone-500">Added <time dateTime={record.createdAt}>{new Date(record.createdAt).toLocaleDateString("en-CA")}</time></p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  function fieldProps(name: keyof FitRecordErrors) {
    return { className: controlClass, "aria-invalid": !!errors[name], "aria-describedby": errors[name] ? `${name}-error` : undefined };
  }
  function fieldError(name: keyof FitRecordErrors) {
    return errors[name] && <p id={`${name}-error`} className="text-sm text-red-700">{errors[name]}</p>;
  }
}
