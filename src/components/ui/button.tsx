import { Slot } from "@radix-ui/react-slot";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & {
  asChild?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ asChild, variant = "primary", className = "", ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component data-variant={variant} className={`ui-button ${className}`} {...props} />;
}
