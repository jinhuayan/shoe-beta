import type { Shoe } from "@/generated/prisma/client";
import { closureLabels, downturnLabels, heelVolumeLabels, stiffnessLabels, widthLabels } from "./climbing-shoes";

export const comparisonLimit = 3;
export type ComparisonSearch = { shoe?: string | string[]; differences?: string | string[] };

export function getComparisonSelection(search: ComparisonSearch) {
  const values = typeof search.shoe === "string" ? [search.shoe] : search.shoe ?? [];
  const slugs: string[] = [];
  let adjusted = false;
  for (const value of values) {
    const slug = value.trim();
    if (!slug) continue;
    if (slug.length > 100 || slugs.includes(slug) || slugs.length === comparisonLimit) {
      adjusted = true;
    } else slugs.push(slug);
  }
  return { slugs, adjusted, differences: search.differences === "1" };
}

export function comparisonHref(slugs: string[], differences = false) {
  const query = new URLSearchParams();
  for (const slug of getComparisonSelection({ shoe: slugs }).slugs) query.append("shoe", slug);
  if (differences) query.set("differences", "1");
  return `/compare${query.size ? `?${query}` : ""}`;
}

export const comparisonAttributes = [
  { key: "downturn", label: "Downturn", labels: downturnLabels },
  { key: "stiffness", label: "Stiffness", labels: stiffnessLabels },
  { key: "closure", label: "Closure", labels: closureLabels },
  { key: "width", label: "Forefoot width", labels: widthLabels },
  { key: "heelVolume", label: "Heel volume", labels: heelVolumeLabels },
] as const;

type ComparedShoe = Pick<Shoe, "downturn" | "stiffness" | "closure" | "width" | "heelVolume">;
export function differingAttributes(shoes: ComparedShoe[]) {
  return comparisonAttributes.filter(({ key }) => new Set(shoes.map((shoe) => shoe[key])).size > 1);
}
