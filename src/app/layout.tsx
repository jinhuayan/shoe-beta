import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <SiteHeader />
        {children}
        <footer className="site-footer"><div className="footer-inner"><p>Shoe Beta · Climbing shoes, personal fit notes.</p><nav aria-label="Footer" className="flex gap-5"><Link href="/privacy" className="ui-link">Privacy</Link><Link href="/terms" className="ui-link">Terms of use</Link></nav></div></footer>
      </body>
    </html>
  );
}
