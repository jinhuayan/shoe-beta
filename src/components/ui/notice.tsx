import type { ComponentProps } from "react";

export function Notice({ tone = "info", role, className = "", ...props }: ComponentProps<"p"> & { tone?: "info" | "error" | "warning" }) {
  return <p role={role ?? (tone === "error" ? "alert" : "status")} data-tone={tone} className={`ui-notice ${className}`} {...props} />;
}
