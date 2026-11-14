"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { reviewAnswers } from "@/app/questionnaire/actions";
import { RecommendationResults } from "@/components/recommendation-results";
import { authClient } from "@/lib/auth-client";
import { choiceFields, measurementFields, type QuestionnaireState } from "@/lib/questionnaire";

const initialState: QuestionnaireState = { values: {}, errors: {}, profile: null };
const controlClass = "w-full rounded-lg border border-stone-300 bg-white p-2 focus-visible:outline-2 focus-visible:outline-offset-2";

export function QuestionnaireForm() {
  const { data: session, isPending, refetch } = authClient.useSession();
  return <ProfileForm key={session?.user.id ?? "guest"} signedIn={!!session} checkingAccount={isPending} onSessionExpired={() => void refetch()} />;
}

function ProfileForm({ signedIn, checkingAccount, onSessionExpired }: { signedIn: boolean; checkingAccount: boolean; onSessionExpired: () => void }) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [profileError, setProfileError] = useState("");
  const [state, formAction, pending] = useActionState(async (previous: QuestionnaireState, data: FormData) => {
    setNotice("");
    setProfileError("");
    const intent = data.get("intent");
    if (intent === "load" || intent === "save") {
      try {
        const response = await fetch("/api/profile", {
          method: intent === "load" ? "GET" : "PUT",
          body: intent === "save" ? data : undefined,
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok) {
          if (response.status === 401) onSessionExpired();
          if (response.status === 400 && result.errors) {
            setEditing(true);
            return result as QuestionnaireState;
          }
          setProfileError(result.error || "Couldn't use your saved profile. Please try again.");
          return previous;
        }
        if (!result) {
          setNotice("No saved profile yet. Review and save your answers first.");
          return previous;
        }
        setNotice(intent === "load" ? "Saved profile loaded." : "Profile saved.");
        setEditing(false);
        return result as QuestionnaireState;
      } catch {
        setProfileError("Couldn't connect. Please try again.");
        return previous;
      }
    }
    const result = await reviewAnswers(previous, data);
    if (result.profile) setEditing(false);
    return result;
  }, initialState);
  const busy = pending || checkingAccount;

  const profileControls = (
    <div className="space-y-2">
      {checkingAccount ? <p role="status" className="text-sm text-stone-500">Checking account…</p> : signedIn ? (
        <>
          <form action={formAction}>
            <button type="submit" name="intent" value="load" disabled={busy} className="rounded-lg border border-stone-300 px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">Load saved profile</button>
          </form>
          <p className="text-sm text-stone-500">Loading replaces the current answers.</p>
        </>
      ) : <p className="text-sm text-stone-600"><Link href="/sign-in" className="rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2">Sign in</Link> before entering answers if you want to save a profile.</p>}
      {notice && <p role="status" className="text-sm text-stone-600">{notice}</p>}
      {profileError && <p role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }} className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{profileError}</p>}
    </div>
  );

  if (state.profile && !editing) {
    const profile = state.profile;
    return (
      <div className="space-y-4" aria-busy={busy}>
        {profileControls}
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
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={busy} onClick={() => { setEditing(true); setNotice(""); }} className="rounded-lg border border-stone-300 px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">Edit answers</button>
            {signedIn && (
              <form action={formAction}>
                {Object.entries(state.values).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
                <button type="submit" name="intent" value="save" disabled={busy} className="rounded-lg bg-stone-900 px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">{pending ? "Please wait…" : "Save profile"}</button>
              </form>
            )}
          </div>
          <RecommendationResults values={state.values} />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-busy={busy}>
      {profileControls}
      <form key={JSON.stringify(state.values)} action={formAction} noValidate aria-busy={busy}>
        <fieldset disabled={busy} className="space-y-6">
          {Object.keys(state.errors).length > 0 && (
            <p role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }} className="rounded-lg bg-red-50 p-3 text-red-800">
              Check the highlighted answers below.
            </p>
          )}
          <fieldset className="grid gap-4 rounded-lg border border-stone-200 p-5 sm:grid-cols-2">
            <legend className="px-2 text-lg font-semibold">Your feet</legend>
            <p className="text-sm text-stone-600 sm:col-span-2">Measurements are optional. Use millimetres for foot length and EU sizing for street shoes. Size references need a street size and a supported fit preference; foot length alone is not converted.</p>
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
          <button type="submit" disabled={busy} className="rounded-lg bg-stone-900 px-4 py-2 text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60">
            {pending ? "Please wait…" : "Review answers"}
          </button>
        </fieldset>
      </form>
    </div>
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
