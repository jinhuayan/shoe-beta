"use client";

import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";

import { useState, type FormEvent } from "react";
import { getSizeReference } from "@/lib/shoe-sizing";
import type { QuestionnaireProfile } from "@/lib/questionnaire";
import { SizeReference } from "@/components/size-reference";

export function ShoeSizeCalculator({ slug }: { slug: string }) {
  const [reference, setReference] = useState<ReturnType<typeof getSizeReference> | null>(null);
  function calculate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const raw = String(data.get("streetSizeEu") ?? "").trim();
    setReference(getSizeReference({ slug, isSample: false }, { streetSizeEu: raw ? Number(raw) : null, fitPreference: String(data.get("fitPreference")) as QuestionnaireProfile["fitPreference"] }));
  }
  return (
    <Card as="section" className="space-y-4 p-4">
      <h2 className="text-xl font-semibold">Check a size reference</h2>
      <p className="text-sm text-stone-600">Uses this model’s verified guidance when available. Answers stay on this page and are not added to the URL or saved profile.</p>
      <form onSubmit={calculate} className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1"><span className="block text-sm font-medium">Street shoe size (EU)</span><Input name="streetSizeEu" type="number" min={20} max={55} step={0.5} className="w-full" /></label>
        <label className="space-y-1"><span className="block text-sm font-medium">Sizing fit preference</span><Select name="fitPreference" defaultValue="UNKNOWN" className="w-full"><option value="UNKNOWN">Unsure</option><option value="COMFORT">Comfort</option><option value="BALANCED">Balanced</option><option value="PERFORMANCE">Performance</option></Select></label>
        <Button className="justify-self-start">Get size reference</Button>
      </form>
      <div role="status">{reference && <SizeReference reference={reference} />}</div>
    </Card>
  );
}
