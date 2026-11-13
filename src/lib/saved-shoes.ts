export type SavedShoeChoice = { id: string; slug: string; brand: string; model: string; isSample: boolean };
export type SavedShoesData = { saved: { shoe: SavedShoeChoice; createdAt: string }[]; shoes: SavedShoeChoice[] };

export function savedShoeSlugs(body: unknown): string[] | null {
  if (!body || typeof body !== "object" || !("slugs" in body) || !Array.isArray(body.slugs)
    || body.slugs.length < 1 || body.slugs.length > 3) return null;
  if (body.slugs.some((value) => typeof value !== "string" || !value.trim() || value.trim().length > 100)) return null;
  return [...new Set((body.slugs as string[]).map((value) => value.trim()))];
}
