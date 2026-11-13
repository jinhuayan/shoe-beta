"use client";

import { useState } from "react";

export function CopyComparisonLink({ href }: { href: string }) {
  const [message, setMessage] = useState("");
  async function copy() {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).href);
      setMessage("Comparison link copied.");
    } catch {
      setMessage("Copy the comparison URL from your address bar to share it.");
    }
  }
  return (
    <div className="space-y-2">
      <button type="button" onClick={copy} className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Copy comparison link</button>
      <p role="status" className="text-sm text-stone-600">{message}</p>
    </div>
  );
}
