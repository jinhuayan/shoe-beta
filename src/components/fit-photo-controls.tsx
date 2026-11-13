"use client";

import { useState, type FormEvent } from "react";
import { maxPhotoSize } from "@/lib/photo-validation";

type Props = { recordId: string; hasPhoto: boolean; disabled: boolean; onChange: (hasPhoto: boolean) => void; onSessionExpired: () => void };
const linkClass = "rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60";

export function FitPhotoControls({ recordId, hasPhoto, disabled, onChange, onSessionExpired }: Props) {
  const [pending, setPending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const url = `/api/fit-records/${encodeURIComponent(recordId)}/photo`;
  const busy = pending || disabled;

  async function transfer(method: "POST" | "DELETE", body?: FormData) {
    setPending(true); setError(""); setNotice("");
    try {
      const response = await fetch(url, { method, body });
      const result = await response.json();
      if (response.status === 401) onSessionExpired();
      if (!response.ok) throw new Error(result.error || "Couldn't update the photo. Please try again.");
      onChange(method === "POST");
      setConfirming(false);
      setNotice(method === "POST" ? "Photo uploaded." : "Photo removed.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Couldn't connect. Please try again.");
    } finally { setPending(false); }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const file = data.get("photo");
    if (!(file instanceof File) || !file.size || !["image/jpeg", "image/png"].includes(file.type)) {
      setError("Choose a JPEG or PNG photo."); return;
    }
    if (file.size > maxPhotoSize) { setError("Use a photo up to 2 MiB."); return; }
    await transfer("POST", data);
  }

  return (
    <div className="space-y-2 border-t border-stone-200 pt-3" aria-busy={pending}>
      {hasPhoto ? (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <a href={url} target="_blank" rel="noopener noreferrer" className={linkClass}>View photo</a>
          <a href={`${url}?download=1`} className={linkClass}>Download photo</a>
          {confirming ? <>
            <span>Remove this photo? This cannot be undone.</span>
            <button type="button" disabled={busy} onClick={() => { if (!busy) void transfer("DELETE"); }} className={`${linkClass} text-red-700`}>Confirm removal</button>
            <button type="button" disabled={busy} onClick={() => setConfirming(false)} className={linkClass}>Cancel removal</button>
          </> : <button type="button" disabled={busy} onClick={() => { setConfirming(true); setNotice(""); }} className={linkClass}>Remove photo</button>}
        </div>
      ) : (
        <form onSubmit={upload} className="space-y-2">
          <label htmlFor={`photo-${recordId}`} className="block text-sm font-medium">Photo (optional)</label>
          <input id={`photo-${recordId}`} type="file" name="photo" accept="image/jpeg,image/png" disabled={busy} aria-describedby={`photo-hint-${recordId}`} className="block w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:border file:border-stone-300 file:bg-white file:px-3 file:py-2" />
          <p id={`photo-hint-${recordId}`} className="text-sm text-stone-500">One JPEG or PNG, up to 2 MiB.</p>
          <button type="submit" disabled={busy} className={linkClass}>Upload photo</button>
        </form>
      )}
      {pending && <p role="status" className="text-sm text-stone-500">Updating photo…</p>}
      {notice && <p role="status" className="text-sm text-stone-600">{notice}</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
