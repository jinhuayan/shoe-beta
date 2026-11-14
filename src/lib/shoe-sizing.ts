import type { QuestionnaireProfile } from "./questionnaire";

type FitPreference = QuestionnaireProfile["fitPreference"];
type SizingRule = { minDown: number; maxDown: number };
export type SizingGuide = {
  slug: string;
  sourceUrl: string;
  checkedAt: string;
  note: string;
  sizes: number[];
  rules: Partial<Record<FitPreference, SizingRule>>;
};
const halfSizes = (min: number, max: number) => Array.from({ length: (max - min) * 2 + 1 }, (_, i) => min + i / 2);
const wholeSizes = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i);
const performance = { PERFORMANCE: { minDown: 1, maxDown: 2 } };
const guides: SizingGuide[] = ([
  { slug: "scarpa-drago-lv", sourceUrl: "https://us.scarpa.com/products/drago-lv", note: "SCARPA describes a performance fit at 1–2 EU sizes below street size.", sizes: halfSizes(35, 45), rules: performance },
  { slug: "scarpa-instinct-vs-mens", sourceUrl: "https://us.scarpa.com/products/instinct-vs-mens", note: "SCARPA describes a performance fit at 1–2 EU sizes below street size.", sizes: [...halfSizes(34, 45), ...wholeSizes(46, 50)], rules: performance },
  { slug: "scarpa-instinct-vsr", sourceUrl: "https://us.scarpa.com/products/instinct-vsr", note: "SCARPA describes a performance fit at 1–2 EU sizes below street size.", sizes: halfSizes(35, 47), rules: performance },
  { slug: "scarpa-helix-mens", sourceUrl: "https://us.scarpa.com/products/helix-mens", note: "SCARPA suggests everyday sizing for long-session comfort, or about half an EU size lower for precision.", sizes: [...halfSizes(39, 47), ...wholeSizes(48, 50)], rules: { COMFORT: { minDown: 0, maxDown: 0 }, PERFORMANCE: { minDown: 0.5, maxDown: 0.5 } } },
  { slug: "scarpa-vapor-v", sourceUrl: "https://us.scarpa.com/products/vapor-v", note: "SCARPA describes everyday sizing for newer climbers and about 0.5–1 EU size lower for performance.", sizes: [...halfSizes(38, 46), ...wholeSizes(47, 50)], rules: { PERFORMANCE: { minDown: 0.5, maxDown: 1 } } },
  { slug: "scarpa-drago", sourceUrl: "https://us.scarpa.com/products/drago", note: "SCARPA describes a tighter fit using a half-to-full size reduction, but the FAQ does not name the unit. No numeric EU rule is used here.", sizes: [], rules: {} },
  { slug: "scarpa-origin-vs", sourceUrl: "https://us.scarpa.com/products/origin-vs", note: "SCARPA discusses a tighter fit than Origin and a half-EU reduction without a clear street-size baseline. No numeric rule is used here.", sizes: [], rules: {} },
] satisfies Omit<SizingGuide, "checkedAt">[]).map((guide) => ({ ...guide, checkedAt: "2026-11-13" }));

export function getSizingGuide(slug: string) { return guides.find((guide) => guide.slug === slug); }

export type SizeReference = {
  status: "available" | "unavailable";
  sizes: number[];
  explanation: string;
  guide: SizingGuide | null;
};
type SizingProfile = Pick<QuestionnaireProfile, "streetSizeEu" | "fitPreference">;

export function evaluateSizing(guide: SizingGuide | undefined, profile: SizingProfile): SizeReference {
  const unavailable = (explanation: string): SizeReference => ({ status: "unavailable", sizes: [], explanation, guide: guide ?? null });
  if (!guide) return unavailable("No verified model-specific EU sizing rule is available.");
  const street = profile.streetSizeEu;
  if (street === null) return unavailable("Add your street shoe size in EU to use this model’s guidance. Foot length alone is not converted.");
  if (!Number.isFinite(street) || street < 20 || street > 55 || !Number.isInteger(street * 2)) return unavailable("Enter an EU street size from 20 to 55 in whole or half sizes.");
  const rule = guide.rules[profile.fitPreference];
  if (!rule) return unavailable("No verified numeric rule covers this model and your chosen fit preference. Review the manufacturer note or try it on.");
  if (![rule.minDown, rule.maxDown].every((n) => Number.isFinite(n) && n >= 0 && n <= 5 && Number.isInteger(n * 2)) || rule.minDown > rule.maxDown || !guide.sizes.length) return unavailable("This sizing guidance is inconsistent and cannot be calculated.");
  const low = street - rule.maxDown;
  const high = street - rule.minDown;
  if (low < Math.min(...guide.sizes) || high > Math.max(...guide.sizes)) return unavailable("The reference falls outside the manufacturer’s listed size range. No adjusted range is invented.");
  const sizes = guide.sizes.filter((size) => size >= low && size <= high);
  if (!sizes.length) return unavailable("The reference does not include a manufacturer-listed size. No rounding is applied.");
  return { status: "available", sizes, explanation: `Street EU ${street}, minus ${rule.minDown === rule.maxDown ? rule.minDown : `${rule.minDown}–${rule.maxDown}`} EU for your ${profile.fitPreference.toLowerCase()} preference. Only manufacturer-listed sizes are shown.`, guide };
}

export function getSizeReference(shoe: { slug: string; isSample: boolean }, profile: SizingProfile) {
  return evaluateSizing(shoe.isSample ? undefined : getSizingGuide(shoe.slug), profile);
}
