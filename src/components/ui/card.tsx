import { createElement, type ComponentProps, type ElementType } from "react";

export function Card<T extends ElementType = "div">({ as, className = "", ...props }: { as?: T; className?: string } & ComponentProps<T>) {
  return createElement(as ?? "div", { ...props, className: `ui-card ${className}` });
}
