"use client";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Card } from "@/components/ui/card";

import Link from "next/link";
import { SizeReference } from "@/components/size-reference";
import { SaveShoesButton } from "@/components/save-shoes-button";
import { useActionState } from "react";
import { heelVolumeLabels, widthLabels } from "@/lib/climbing-shoes";
import type { QuestionnaireState } from "@/lib/questionnaire";
import { comparisonHref } from "@/lib/shoe-comparison";
import type { RecommendationResponse } from "@/lib/recommendations";

type ResultState = { result: RecommendationResponse | null; error: string | null };
const initialState: ResultState = { result: null, error: null };

export function RecommendationResults({ values }: { values: QuestionnaireState["values"] }) {
  const [state, formAction, pending] = useActionState(async (): Promise<ResultState> => {
    const data = new FormData();
    for (const [name, value] of Object.entries(values)) data.set(name, value);
    try {
      const response = await fetch("/api/recommendations", { method: "POST", body: data });
      if (!response.ok) {
        return { result: null, error: response.status === 400 ? "Edit and review your answers before trying again." : "The catalogue is unavailable. Please try again." };
      }
      return { result: await response.json(), error: null };
    } catch {
      return { result: null, error: "Could not load your shortlist. Please try again." };
    }
  }, initialState);

  return (
    <div className="space-y-4 border-t border-stone-200 pt-4">
      <form action={formAction} aria-busy={pending}>
        <Button disabled={pending}>
          {pending ? "Finding climbing shoes…" : "Find climbing shoes"}
        </Button>
      </form>
      {state.error && <Notice tone="error" role="alert">{state.error}</Notice>}
      <div aria-live="polite" className="space-y-4">
        {state.result && (
          <>
            <h3 tabIndex={-1} ref={(node) => { node?.focus(); }} className="text-xl font-semibold">Your climbing shoe shortlist</h3>
            <p className="text-sm text-stone-600">This shortlist compares foot width, heel volume, downturn, and stiffness. Toe shape and measurements are not assessed yet. Try shoes on to check fit.</p>
            {state.result.status === "insufficient" && <p>We need more information to build a shortlist. Add your foot width or heel volume, or browse the catalogue.</p>}
            {state.result.status === "empty" && <p>No shortlist is available from the current catalogue for these preferences. Try adjusting your answers or browse all shoes.</p>}
            {state.result.shoes.some((shoe) => shoe.isSample) && <Notice tone="warning">Entries marked “Sample” are fictional test data, not real products.</Notice>}
            {state.result.shoes.length > 0 && <Link href={comparisonHref(state.result.shoes.map((shoe) => shoe.slug))} className="inline-block ui-link">Compare this shortlist</Link>}
            {state.result.shoes.length > 0 && <SaveShoesButton key={state.result.shoes.map((shoe) => shoe.slug).join(":")} slugs={state.result.shoes.map((shoe) => shoe.slug)} />}
            <ol className="space-y-4">
              {state.result.shoes.map((shoe) => (
                <Card as="li" key={shoe.slug} className="space-y-3 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-stone-500">{shoe.brand}</p>
                    {shoe.isSample && <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">Sample</span>}
                  </div>
                  <h4 className="text-lg font-medium">
                    <Link href={`/shoes/${encodeURIComponent(shoe.slug)}`} className="ui-link">{shoe.model}</Link>
                  </h4>
                  <p className="text-sm text-stone-500">Forefoot: {widthLabels[shoe.width]} · Heel volume: {heelVolumeLabels[shoe.heelVolume]}</p>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">Why it appears</p>
                    <ul className="list-disc space-y-1 pl-5">{shoe.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
                  </div>
                  {shoe.tradeoffs.length > 0 && (
                    <div className="space-y-1 text-sm text-stone-600">
                      <p className="font-medium">Tradeoffs</p>
                      <ul className="list-disc space-y-1 pl-5">{shoe.tradeoffs.map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul>
                    </div>
                  )}
                  <SizeReference reference={shoe.sizeReference} />
                </Card>
              ))}
            </ol>
            <Link href="/shoes" className="inline-block ui-link">Browse all climbing shoes</Link>
          </>
        )}
      </div>
    </div>
  );
}
