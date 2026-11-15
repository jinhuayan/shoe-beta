import type { ComponentProps, ReactNode } from "react";

export function PageShell({ width = "default", className = "", ...props }: ComponentProps<"main"> & { width?: "default" | "wide" | "narrow" }) {
  return <main id="main-content" tabIndex={-1} data-width={width} className={`page-shell ${className}`} {...props} />;
}

export function PageHeader({ title, description, eyebrow, children }: { title: ReactNode; description?: ReactNode; eyebrow?: ReactNode; children?: ReactNode }) {
  return <header className="page-heading">{eyebrow && <p className="page-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-description">{description}</p>}{children && <div className="page-heading-extra">{children}</div>}</header>;
}
