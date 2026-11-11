export type Shop = {
  id: string;
  name: string;
  address: string;
  mapsUrl: string;
  temporarilyClosed: boolean;
  attributions: { name: string; url: string | null }[];
};
export type ShopResults = { location: string; shops: Shop[]; demo: boolean };

export function searchLocation(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("location" in body) || typeof body.location !== "string") return null;
  const text = body.location.trim().replace(/\s+/g, " ");
  return text.length >= 2 && text.length <= 100 && !/[\x00-\x1f\x7f]/.test(text) ? text : null;
}

function httpsUrl(value: unknown): URL | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url : null;
  } catch { return null; }
}

export function parseShops(payload: unknown): Shop[] {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid Places response.");
  if (!("places" in payload)) return [];
  if (!Array.isArray(payload.places)) throw new Error("Invalid Places response.");
  const seen = new Set<string>();
  const shops: Shop[] = [];
  for (const place of payload.places) {
    if (!place || typeof place !== "object") continue;
    const url = httpsUrl(place.googleMapsUri);
    const mapHost = url && (url.hostname === "maps.google.com" || url.hostname === "maps.app.goo.gl" || (url.hostname === "www.google.com" && url.pathname.startsWith("/maps")));
    if (typeof place.id !== "string" || !place.id || seen.has(place.id) || typeof place.displayName?.text !== "string"
      || !place.displayName.text.trim() || typeof place.formattedAddress !== "string" || !place.formattedAddress.trim()
      || !mapHost || place.businessStatus === "CLOSED_PERMANENTLY") continue;
    seen.add(place.id);
    const attributions: Shop["attributions"] = [];
    if (Array.isArray(place.attributions)) for (const attribution of place.attributions) {
      if (typeof attribution?.provider === "string" && attribution.provider.trim()) {
        attributions.push({ name: attribution.provider, url: httpsUrl(attribution.providerUri)?.href ?? null });
      }
    }
    shops.push({ id: place.id, name: place.displayName.text, address: place.formattedAddress, mapsUrl: url!.href,
      temporarilyClosed: place.businessStatus === "CLOSED_TEMPORARILY", attributions });
    if (shops.length === 10) break;
  }
  return shops;
}
