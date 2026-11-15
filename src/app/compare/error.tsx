"use client";

import { PageHeader, PageShell } from "@/components/ui/page";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";

import Link from "next/link";

export default function ComparisonError({ reset }: { reset: () => void }) {
  return (
    <PageShell width="wide" className="space-y-4">
      <PageHeader title="Comparison is unavailable" eyebrow="Shoe Beta" />
      <Notice tone="error">We could not load the catalogue. Your selections are still in the URL.</Notice>
      <Button onClick={reset}>Try again</Button>
      <p><Link href="/shoes" className="ui-link">Back to catalogue</Link></p>
    </PageShell>
  );
}
