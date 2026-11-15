"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { accountName, passwordError, type AccountSession } from "@/lib/account";

const linkClass = "rounded-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2";
const inputClass = "mt-1 block w-full rounded-md border border-stone-300 px-3 py-2 disabled:opacity-60";
const buttonClass = "rounded-md bg-stone-900 px-4 py-2 text-sm text-white disabled:opacity-60";
const sectionClass = "space-y-4 rounded-lg border border-stone-200 p-5";

export function AccountSettings() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  if (!session && isPending) return <p role="status">Checking account…</p>;
  if (!session && error) return <p role="alert">Account service is unavailable. <button onClick={() => void refetch()} className={linkClass}>Retry</button></p>;
  if (!session) return <p><Link href="/sign-in" className={linkClass}>Sign in</Link> to manage your account.</p>;
  return <Settings key={session.user.id} user={session.user} refetch={refetch} />;
}

function Settings({ user, refetch }: { user: { name: string; email: string }; refetch: () => void }) {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ area: string; text: string; error: boolean } | null>(null);
  const [sessions, setSessions] = useState<AccountSession[] | null>(null);
  const [sessionError, setSessionError] = useState("");
  const [sessionLoading, setSessionLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [confirmSession, setConfirmSession] = useState<string | null>(null);
  const lifecycle = useRef<AbortController | null>(null);
  const actionPending = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    lifecycle.current = controller;
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/account/sessions", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (response.status === 401) { setSessions(null); refetch(); }
        if (!response.ok) throw new Error(data.error || "Couldn't load your sessions.");
        setSessions(data.sessions);
      } catch (failure) {
        if (!controller.signal.aborted) setSessionError(failure instanceof Error ? failure.message : "Couldn't connect. Please try again.");
      } finally { if (!controller.signal.aborted) setSessionLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [attempt, refetch]);

  function reloadSessions() { setSessionLoading(true); setSessionError(""); setSessions(null); setConfirmSession(null); setAttempt((value) => value + 1); }
  async function act(area: string, action: (signal: AbortSignal) => Promise<string>) {
    if (actionPending.current || !lifecycle.current) return;
    const signal = lifecycle.current.signal;
    actionPending.current = true;
    setBusy(area);
    setMessage(null);
    try {
      const text = await action(signal);
      if (!signal.aborted) setMessage({ area, text, error: false });
    } catch (failure) {
      if (!signal.aborted) setMessage({ area, text: failure instanceof Error ? failure.message : "Couldn't connect. Please try again.", error: true });
    } finally {
      actionPending.current = false;
      if (!signal.aborted) setBusy("");
    }
  }
  async function send(path: string, body: object, signal: AbortSignal, method = "POST") {
    const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
    const data = await response.json();
    if (response.status === 401) refetch();
    if (!response.ok) throw new Error(data.error || data.message || "Couldn't save your changes.");
    return data;
  }
  function status(area: string) {
    if (message?.area !== area) return null;
    return <p role={message.error ? "alert" : "status"} className={message.error ? "text-sm text-red-700" : "text-sm text-green-800"}>{message.text}</p>;
  }
  function revoke(sessionId: string) {
    void act("sessions", async (signal) => {
      await send("/api/account/sessions", sessionId === "all" ? { allOthers: true } : { sessionId }, signal);
      if (!signal.aborted) reloadSessions();
      return sessionId === "all" ? "Other sessions signed out." : "Session signed out.";
    });
  }

  return (
    <div className="space-y-6">
      <section className={sectionClass} aria-labelledby="account-name-heading">
        <h2 id="account-name-heading" className="text-xl font-semibold">Your details</h2>
        <p className="break-all text-sm text-stone-600">Email: {user.email}</p>
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          void act("name", async (signal) => {
            const trimmed = accountName(name);
            if (!trimmed) throw new Error("Use 1–100 characters for your name.");
            await send("/api/account", { name: trimmed }, signal, "PATCH");
            if (!signal.aborted) { setName(trimmed); refetch(); }
            return "Name updated.";
          });
        }}>
          <label className="block text-sm font-medium" htmlFor="account-name">Display name<input id="account-name" autoComplete="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} disabled={!!busy} className={inputClass} /></label>
          <button disabled={!!busy} className={buttonClass}>{busy === "name" ? "Saving…" : "Save name"}</button>
          {status("name")}
        </form>
      </section>
      <section className={sectionClass} aria-labelledby="account-password-heading">
        <h2 id="account-password-heading" className="text-xl font-semibold">Change password</h2>
        <p className="text-sm text-stone-600">Use 8–128 characters. Changing your password signs out your other sessions.</p>
        <form className="space-y-4" onSubmit={(event) => {
          event.preventDefault();
          void act("password", async (signal) => {
            const error = passwordError(currentPassword, newPassword, confirmation);
            if (error) throw new Error(error);
            const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true }, { signal });
            if (result.error) {
              if (result.error.status === 401) refetch();
              if (result.error.status === 429) throw new Error("Too many attempts. Wait a moment and try again.");
              throw new Error(result.error.code === "INVALID_PASSWORD" ? "Your current password is incorrect." : "Couldn't change your password. Check your current password and try again.");
            }
            if (!signal.aborted) { setCurrentPassword(""); setNewPassword(""); setConfirmation(""); refetch(); reloadSessions(); }
            return "Password changed. Your other sessions are signed out.";
          });
        }}>
          <label className="block text-sm font-medium" htmlFor="current-password">Current password<input id="current-password" type="password" autoComplete="current-password" required maxLength={128} value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} disabled={!!busy} className={inputClass} /></label>
          <label className="block text-sm font-medium" htmlFor="new-password">New password<input id="new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} disabled={!!busy} className={inputClass} /></label>
          <label className="block text-sm font-medium" htmlFor="confirm-password">Confirm new password<input id="confirm-password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} disabled={!!busy} className={inputClass} /></label>
          <button disabled={!!busy} className={buttonClass}>{busy === "password" ? "Changing password…" : "Change password"}</button>
          {status("password")}
        </form>
      </section>
      <section className={sectionClass} aria-labelledby="account-sessions-heading">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="account-sessions-heading" className="text-xl font-semibold">Signed-in sessions</h2><button type="button" disabled={!!busy || sessionLoading} onClick={reloadSessions} className={`${linkClass} text-sm disabled:opacity-60`}>Refresh sessions</button></div>
        <p className="text-sm text-stone-600">One device may have several sessions. Browser details are reported by the device.</p>
        {sessionLoading && <p role="status">Loading sessions…</p>}
        {sessionError && <p role="alert" className="text-sm text-red-700">{sessionError} <button type="button" disabled={!!busy} onClick={reloadSessions} className={linkClass}>Retry</button></p>}
        {sessions && <>
          {!sessions.length ? <p>No active sessions found. Refresh or sign in again.</p> : <ul className="space-y-3">{sessions.map((session) => <li key={session.id} className="space-y-2 rounded-md bg-stone-50 p-4">
            <h3 className="font-medium">{session.current ? "Current session" : "Other session"}</h3>
            <p className="break-words text-sm text-stone-600 [overflow-wrap:anywhere]">{session.userAgent || "Browser details unavailable"}</p>
            <p className="text-sm text-stone-600">Signed in <time dateTime={session.createdAt}>{new Date(session.createdAt).toLocaleString()}</time></p>
            <p className="text-sm text-stone-600">Expires <time dateTime={session.expiresAt}>{new Date(session.expiresAt).toLocaleString()}</time></p>
            {!session.current && <button type="button" disabled={!!busy} onClick={() => setConfirmSession(session.id)} className={`${linkClass} text-sm disabled:opacity-60`}>Sign out this session</button>}
            {confirmSession === session.id && <div className="space-y-2"><p className="text-sm">Sign out this session? That device will need to sign in again.</p><div className="flex flex-wrap gap-4"><button type="button" disabled={!!busy} onClick={() => revoke(session.id)} className={buttonClass}>Confirm sign out</button><button type="button" disabled={!!busy} onClick={() => setConfirmSession(null)} className={linkClass}>Cancel</button></div></div>}
          </li>)}</ul>}
          {sessions.some((session) => !session.current) && <button type="button" disabled={!!busy} onClick={() => setConfirmSession("all")} className={`${linkClass} text-sm disabled:opacity-60`}>Sign out all other sessions</button>}
          {confirmSession === "all" && <div className="space-y-2"><p className="text-sm">Sign out every session except this one?</p><div className="flex flex-wrap gap-4"><button type="button" disabled={!!busy} onClick={() => revoke("all")} className={buttonClass}>Confirm sign out</button><button type="button" disabled={!!busy} onClick={() => setConfirmSession(null)} className={linkClass}>Cancel</button></div></div>}
        </>}
        {status("sessions")}
      </section>
      <section className={sectionClass} aria-labelledby="account-export-heading">
        <h2 id="account-export-heading" className="text-xl font-semibold">Download your data</h2>
        <p className="text-sm text-stone-600">Download your account details, climbing profile, saved shoes, and fitting records as JSON. Photo files are not included; download them from your fitting journal. Keep this file private.</p>
        <button type="button" disabled={!!busy} className={buttonClass} onClick={() => void act("export", async (signal) => {
          const response = await fetch("/api/account/export", { cache: "no-store", signal });
          if (response.status === 401) refetch();
          if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Couldn't download your data."); }
          const blob = await response.blob();
          if (signal.aborted) return "";
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = "shoe-beta-backup.json";
          document.body.append(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          return "Your data download is ready.";
        })}>{busy === "export" ? "Preparing download…" : "Download my data"}</button>
        {status("export")}
      </section>
    </div>
  );
}
