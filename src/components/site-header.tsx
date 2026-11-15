"use client";

import * as Collapsible from "@radix-ui/react-collapsible";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

const links = [
  ["/shoes", "Catalogue"], ["/questionnaire", "Questionnaire"], ["/compare", "Compare shoes"],
  ["/shops", "Find shops"], ["/dashboard", "My climbing"], ["/saved-shoes", "Saved shoes"], ["/fit-records", "Fit records"],
];

export function SiteHeader() {
  const { data: session, isPending, error, refetch } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    setSignOutError("");
    try {
      const result = await authClient.signOut();
      if (result.error) setSignOutError("Couldn't sign out. Please try again.");
      else { setMenuOpen(false); router.refresh(); }
    } catch {
      setSignOutError("Couldn't connect. Please try again.");
    } finally { setSigningOut(false); }
  }

  function navigation() {
    return <div className="header-links">{links.map(([href, label]) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="header-link" aria-current={pathname === href ? "page" : pathname.startsWith(`${href}/`) ? "location" : undefined}>{label}</Link>)}</div>;
  }
  function account() {
    return isPending ? <span className="text-sm text-stone-500">Checking account…</span> : session ? <>
      <span className="account-name" title={session.user.name}>Signed in as {session.user.name}</span>
      <Link href="/account" onClick={() => setMenuOpen(false)} className="header-link" aria-current={pathname === "/account" ? "page" : undefined}>Account</Link>
      <Button type="button" variant="secondary" disabled={signingOut} onClick={signOut}>{signingOut ? "Signing out…" : "Sign out"}</Button>
    </> : <>
      <Button asChild variant="ghost"><Link href="/sign-in" onClick={() => setMenuOpen(false)}>Sign in</Link></Button>
      <Button asChild><Link href="/sign-up" onClick={() => setMenuOpen(false)}>Create account</Link></Button>
    </>;
  }

  return (
    <Collapsible.Root asChild open={menuOpen} onOpenChange={setMenuOpen}>
      <header className="site-header" onKeyDown={(event) => {
        if (event.key === "Escape" && menuOpen) { setMenuOpen(false); trigger.current?.focus(); }
      }}>
        <div className="header-inner">
          <div className="header-top">
            <Link href="/shoes" aria-label="Shoe Beta" className="brand" onClick={() => setMenuOpen(false)}>
              <svg className="brand-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#c9ee62" /><path d="M9 29 19 11l12 18H9Z" stroke="#17231c" strokeWidth="2" strokeLinejoin="round" /><path d="m15 21 4 3 4-4" stroke="#17231c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span><span className="brand-name">Shoe Beta</span><span className="brand-caption">Climb / Fit / Repeat</span></span>
            </Link>
            <div className="desktop-auth">{account()}</div>
            <Collapsible.Trigger asChild><Button ref={trigger} type="button" variant="secondary" className="mobile-toggle" aria-label={menuOpen ? "Close menu" : "Open menu"}><svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">{menuOpen ? <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.5" /> : <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" />}</svg>{menuOpen ? "Close" : "Menu"}</Button></Collapsible.Trigger>
          </div>
          <nav aria-label="Main" className="desktop-nav">{navigation()}</nav>
          <Collapsible.Content className="mobile-content"><nav aria-label="Main">{navigation()}</nav><div className="mobile-auth">{account()}</div></Collapsible.Content>
          {error && !isPending && <Notice className="mb-4">Account service is unavailable. <Button type="button" variant="ghost" onClick={() => void refetch()}>Retry</Button></Notice>}
          {signOutError && <Notice tone="error" className="mb-4">{signOutError}</Notice>}
        </div>
      </header>
    </Collapsible.Root>
  );
}
