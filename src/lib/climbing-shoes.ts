import type { Prisma } from "@/generated/prisma/client";
import { Closure, Downturn, FootWidth, HeelVolume, Stiffness } from "@/generated/prisma/enums";

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

export const widthLabels: Record<FootWidth, string> = {
  NARROW: "Narrow",
  REGULAR: "Regular",
  WIDE: "Wide",
  UNKNOWN: "Unknown",
};

export const heelVolumeLabels: Record<HeelVolume, string> = {
  LOW: "Low",
  REGULAR: "Regular",
  HIGH: "High",
  UNKNOWN: "Unknown",
};

export type ShoeSearchParams = {
  q?: string | string[];
  brand?: string | string[];
  downturn?: string | string[];
  stiffness?: string | string[];
  closure?: string | string[];
};

export function getShoeFilters(search: ShoeSearchParams) {
  const downturn = Object.values(Downturn).find((value) => value === search.downturn);
  const stiffness = Object.values(Stiffness).find((value) => value === search.stiffness);
  const closure = Object.values(Closure).find((value) => value === search.closure);

  const text = (value: string | string[] | undefined) =>
    typeof value === "string" && value.trim().length <= 100 ? value.trim() : "";
  const q = text(search.q);
  const brand = text(search.brand);

  return {
    ...(q ? { q } : {}),
    ...(brand ? { brand } : {}),
    ...(downturn ? { downturn } : {}),
    ...(stiffness ? { stiffness } : {}),
    ...(closure ? { closure } : {}),
  };
}

export function getCatalogueWhere(filters: ReturnType<typeof getShoeFilters>): Prisma.ShoeWhereInput {
  const { q, brand, ...attributes } = filters;
  return {
    isSample: false,
    ...attributes,
    ...(brand ? { brand: { equals: brand, mode: "insensitive" } } : {}),
    ...(q ? {
      AND: q.split(/\s+/).map((word) => ({
        OR: [
          { brand: { contains: word, mode: "insensitive" } },
          { model: { contains: word, mode: "insensitive" } },
        ],
      })),
    } : {}),
  };
}
