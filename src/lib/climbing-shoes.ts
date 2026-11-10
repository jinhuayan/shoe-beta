import { Closure, Downturn, Stiffness } from "@/generated/prisma/enums";

export const downturnLabels: Record<Downturn, string> = {
  NEUTRAL: "Neutral",
  MODERATE: "Moderate",
  AGGRESSIVE: "Aggressive",
  UNKNOWN: "Unknown",
};

export const stiffnessLabels: Record<Stiffness, string> = {
  SOFT: "Soft",
  MEDIUM: "Medium",
  STIFF: "Stiff",
  UNKNOWN: "Unknown",
};

export const closureLabels: Record<Closure, string> = {
  LACE_UP: "Lace-up",
  HOOK_AND_LOOP: "Hook and loop",
  SLIPPER: "Slipper",
  UNKNOWN: "Unknown",
};

export type ShoeSearchParams = {
  downturn?: string | string[];
  stiffness?: string | string[];
  closure?: string | string[];
};

export function getShoeFilters(search: ShoeSearchParams) {
  const downturn = Object.values(Downturn).find((value) => value === search.downturn);
  const stiffness = Object.values(Stiffness).find((value) => value === search.stiffness);
  const closure = Object.values(Closure).find((value) => value === search.closure);

  return {
    ...(downturn ? { downturn } : {}),
    ...(stiffness ? { stiffness } : {}),
    ...(closure ? { closure } : {}),
  };
}
