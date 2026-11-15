"use client";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/controls";

import Link from "next/link";
import { useActionState, useState } from "react";
import { reviewAnswers } from "@/app/questionnaire/actions";
import { RecommendationResults } from "@/components/recommendation-results";
import { authClient } from "@/lib/auth-client";
import { choiceFields, measurementFields, type QuestionnaireState } from "@/lib/questionnaire";

const initialState: QuestionnaireState = { values: {}, errors: {}, profile: null };

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
            <Button variant="secondary" type="submit" name="intent" value="load" disabled={busy}>Load saved profile</Button>
          </form>
          <p className="text-sm text-stone-500">Loading replaces the current answers.</p>
        </>
      ) : <p className="text-sm text-stone-600"><Link href="/sign-in" className="ui-link">Sign in</Link> before entering answers if you want to save a profile.</p>}
      {notice && <p role="status" className="text-sm text-stone-600">{notice}</p>}
      {profileError && <Notice tone="error" role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }}>{profileError}</Notice>}
    </div>
  );

  if (state.profile && !editing) {
    const profile = state.profile;
    return (
      <div className="space-y-4" aria-busy={busy}>
        {profileControls}
        <Card as="section" className="space-y-4 p-5" aria-labelledby="profile-heading">
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
            <Button variant="secondary" type="button" disabled={busy} onClick={() => { setEditing(true); setNotice(""); }}>Edit answers</Button>
            {signedIn && (
              <form action={formAction}>
                {Object.entries(state.values).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
                <Button type="submit" name="intent" value="save" disabled={busy}>{pending ? "Please wait…" : "Save profile"}</Button>
              </form>
            )}
          </div>
          <RecommendationResults values={state.values} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-busy={busy}>
      {profileControls}
      <form key={JSON.stringify(state.values)} action={formAction} noValidate aria-busy={busy}>
        <fieldset disabled={busy} className="space-y-6">
          {Object.keys(state.errors).length > 0 && (
            <Notice tone="error" role="alert" tabIndex={-1} ref={(node) => { node?.focus(); }}>
              Check the highlighted answers below.
            </Notice>
          )}
          <Card as="fieldset" className="grid gap-4 p-5 sm:grid-cols-2">
            <legend className="px-2 text-lg font-semibold">Your feet</legend>
            <p className="text-sm text-stone-600 sm:col-span-2">Measurements are optional. Use millimetres for foot length and EU sizing for street shoes. Size references need a street size and a supported fit preference; foot length alone is not converted.</p>
            {Object.entries(measurementFields).map(([name, field]) => {
              const key = name as keyof typeof measurementFields;
              return (
                <div key={name} className="space-y-2">
                  <label htmlFor={name} className="block text-sm font-medium">{field.label} <span className="font-normal text-stone-500">(optional)</span></label>
                  <Input
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

                  />
                  {state.errors[key] && <p id={`${name}-error`} className="text-sm text-red-700">{state.errors[key]}</p>}
                </div>
              );
            })}
            {(["width", "toeShape", "heelVolume"] as const).map(renderChoice)}
          </Card>
          <Card as="fieldset" className="grid gap-4 p-5 sm:grid-cols-2">
            <legend className="px-2 text-lg font-semibold">Your climbing</legend>
            {(["experience", "discipline", "fitPreference"] as const).map(renderChoice)}
          </Card>
          <Button type="submit" disabled={busy}>
            {pending ? "Please wait…" : "Review answers"}
          </Button>
        </fieldset>
      </form>
    </div>
  );

  function renderChoice(name: keyof typeof choiceFields) {
    const field = choiceFields[name];
    return (
      <div key={name} className="space-y-2">
        <label htmlFor={name} className="block text-sm font-medium">{field.label}</label>
        <Select
          id={name}
          name={name}
          defaultValue={state.values[name] ?? "UNKNOWN"}
          aria-invalid={!!state.errors[name]}
          aria-describedby={state.errors[name] ? `${name}-error` : undefined}

        >
          {Object.entries(field.options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
        {state.errors[name] && <p id={`${name}-error`} className="text-sm text-red-700">{state.errors[name]}</p>}
      </div>
    );
  }
}
