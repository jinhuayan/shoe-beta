"use client";

import { PageHeader, PageShell } from "@/components/ui/page";
import { Notice } from "@/components/ui/notice";
import { Button } from "@/components/ui/button";

export default function CatalogueError({ retry }: { retry: () => void }) {
  return (
    <PageShell className="space-y-4">
      <PageHeader title="Climbing shoe catalogue" eyebrow="Shoe Beta" />
      <Notice tone="error">The catalogue is unavailable right now. Please try again.</Notice>
      <Button variant="secondary" onClick={() => retry()}>
        Try again
      </Button>
    </PageShell>
  );
}
