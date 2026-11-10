"use client";

import { useActionState, useState } from "react";
import { reviewAnswers } from "@/app/questionnaire/actions";
import { choiceFields, measurementFields, type QuestionnaireState } from "@/lib/questionnaire";

const initialState: QuestionnaireState = { values: {}, errors: {}, profile: null };
const controlClass = "w-full rounded-lg border border-stone-300 bg-white p-2 focus-visible:outline-2 focus-visible:outline-offset-2";

export function QuestionnaireForm() {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(async (previous: QuestionnaireState, data: FormData) => {
    const result = await reviewAnswers(previous, data);
    if (result.profile) setEditing(false);
    return result;
  }, initialState);

  if (state.profile && !editing) {
    const profile = state.profile;
    return (
      <section className="space-y-4 rounded-lg border border-stone-200 p-5" aria-labelledby="profile-heading">
        <h2 id="profile-heading" tabIndex={-1} ref={(node) => { node?.focus(); }} className="text-xl font-semibold">Your climbing profile</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-stone-500">Foot length</dt>
            <dd>{profile.footLengthMm === null ? "Unsure" : `${profile.footLengthMm} mm`}</dd>
          </div>
          <div>
            <dt className="text-sm text-stone-500">Street shoe size</dt>
            <dd>{profile.streetSizeEu === null ? "Unsure" : `EU ${profile.streetSizeEu}`}</dd>
          </div>
          {Object.entries(choiceFields).map(([name, field]) => (
            <div key={name}>
              <dt className="text-sm text-stone-500">{field.label}</dt>
              <dd>{(field.options as Record<string, string>)[profile[name as keyof typeof choiceFields]]}</dd>
            </div>
          ))}
        </dl>
        <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-stone-300 px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2">Edit answers</button>
      </section>
    );
  }

  return (
    <form key={JSON.stringify(state.values)} action={formAction} noValidate aria-busy={pending}>
      <fieldset disabled={pending} className="space-y-6">
        {Object.keys(state.errors).length > 0 && (
          <p role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }} className="rounded-lg bg-red-50 p-3 text-red-800">
            Check the highlighted answers below.
          </p>
        )}
        <fieldset className="grid gap-4 rounded-lg border border-stone-200 p-5 sm:grid-cols-2">
          <legend className="px-2 text-lg font-semibold">Your feet</legend>
          <p className="text-sm text-stone-600 sm:col-span-2">Measurements are optional. Use millimetres for foot length and EU sizing for street shoes.</p>
          {Object.entries(measurementFields).map(([name, field]) => {
            const key = name as keyof typeof measurementFields;
            return (
              <div key={name} className="space-y-2">
                <label htmlFor={name} className="block text-sm font-medium">{field.label} <span className="font-normal text-stone-500">(optional)</span></label>
                <input
                  id={name}
                  name={name}
                  type="number"
                  inputMode="decimal"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  defaultValue={state.values[key] ?? ""}
                  aria-invalid={!!state.errors[key]}
                  aria-describedby={state.errors[key] ? `${name}-error` : undefined}
                  className={controlClass}
                />
                {state.errors[key] && <p id={`${name}-error`} className="text-sm text-red-700">{state.errors[key]}</p>}
              </div>
            );
          })}
          {(["width", "toeShape", "heelVolume"] as const).map(renderChoice)}
        </fieldset>
        <fieldset className="grid gap-4 rounded-lg border border-stone-200 p-5 sm:grid-cols-2">
          <legend className="px-2 text-lg font-semibold">Your climbing</legend>
          {(["experience", "discipline", "fitPreference"] as const).map(renderChoice)}
        </fieldset>
        <button type="submit" disabled={pending} className="rounded-lg bg-stone-900 px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
          {pending ? "Checking answers…" : "Review answers"}
        </button>
      </fieldset>
    </form>
  );

  function renderChoice(name: keyof typeof choiceFields) {
    const field = choiceFields[name];
    return (
      <div key={name} className="space-y-2">
        <label htmlFor={name} className="block text-sm font-medium">{field.label}</label>
        <select
          id={name}
          name={name}
          defaultValue={state.values[name] ?? "UNKNOWN"}
          aria-invalid={!!state.errors[name]}
          aria-describedby={state.errors[name] ? `${name}-error` : undefined}
          className={controlClass}
        >
          {Object.entries(field.options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {state.errors[name] && <p id={`${name}-error`} className="text-sm text-red-700">{state.errors[name]}</p>}
      </div>
    );
  }
}
