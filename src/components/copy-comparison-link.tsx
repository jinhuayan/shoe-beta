"use client";

import { Button } from "@/components/ui/button";

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
      <Button variant="ghost" type="button" onClick={copy}>Copy comparison link</Button>
      <p role="status" className="text-sm text-stone-600">{message}</p>
    </div>
  );
}
