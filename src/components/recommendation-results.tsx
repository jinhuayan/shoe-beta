"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { QuestionnaireState } from "@/lib/questionnaire";
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
        <button disabled={pending} className="rounded-lg bg-stone-900 px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
          {pending ? "Finding climbing shoes…" : "Find climbing shoes"}
        </button>
      </form>
      {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{state.error}</p>}
      <div aria-live="polite" className="space-y-4">
        {state.result && (
          <>
            <h3 tabIndex={-1} ref={(node) => { node?.focus(); }} className="text-xl font-semibold">Your climbing shoe shortlist</h3>
            <p className="text-sm text-stone-600">This shortlist uses downturn and stiffness preferences. Foot width, toe shape, heel fit, and measurements are not assessed yet. Try shoes on to check fit.</p>
            {state.result.status === "insufficient" && <p>There is not enough information for these rules. Edit your experience, climbing style, or comfort preference, or browse the catalogue.</p>}
            {state.result.status === "empty" && <p>No shortlist is available from the current catalogue for these preferences. Try adjusting your answers or browse all shoes.</p>}
            {state.result.shoes.some((shoe) => shoe.isSample) && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Entries marked “Sample” are fictional test data, not real products.</p>}
            <ol className="space-y-4">
              {state.result.shoes.map((shoe) => (
                <li key={shoe.slug} className="space-y-3 rounded-lg border border-stone-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-stone-500">{shoe.brand}</p>
                    {shoe.isSample && <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">Sample</span>}
                  </div>
                  <h4 className="text-lg font-medium">
                    <Link href={`/shoes/${encodeURIComponent(shoe.slug)}`} className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">{shoe.model}</Link>
                  </h4>
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
                  <p className="text-sm text-stone-500">Size estimate unavailable. Model-specific sizing notes are missing.</p>
                </li>
              ))}
            </ol>
            <Link href="/shoes" className="inline-block rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Browse all climbing shoes</Link>
          </>
        )}
      </div>
    </div>
  );
}
