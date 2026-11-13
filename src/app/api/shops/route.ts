import { parseShops, searchLocation } from "@/lib/shops";

const headers = { "Cache-Control": "no-store" };
let windowStart = 0;
let searches = 0;

export async function POST(request: Request) {
  let origin: URL;
  try { origin = new URL(request.headers.get("origin") ?? ""); }
  catch { return Response.json({ error: "Invalid request origin." }, { status: 403, headers }); }
  if (!["http:", "https:"].includes(origin.protocol) || origin.host !== request.headers.get("host")) {
    return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
  }
  if (Number(request.headers.get("content-length")) > 2048) return Response.json({ error: "Search request is too large." }, { status: 413, headers });
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Enter a city or neighbourhood." }, { status: 400, headers }); }
  const location = searchLocation(body);
  if (!location) return Response.json({ error: "Enter a city or neighbourhood using 2–100 characters." }, { status: 400, headers });
  const key = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!key) return Response.json({ error: "Shop search is not configured yet. Please try again later." }, { status: 503, headers });
  if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); searches = 0; }
  if (searches >= 20) return Response.json({ error: "Shop search is busy. Please try again in a minute." }, { status: 429, headers: { ...headers, "Retry-After": "60" } });
  searches++;
  try {
    let endpoint = "https://places.googleapis.com/v1/places:searchText";
    let demo = false;
    if (process.env.PLACES_TEST_ENDPOINT && !process.env.VERCEL) {
      const test = new URL(process.env.PLACES_TEST_ENDPOINT);
      if (test.protocol !== "http:" || !["127.0.0.1", "localhost", "[::1]"].includes(test.hostname) || test.username || test.password) throw new Error("Invalid test endpoint.");
      endpoint = test.href; demo = true;
    }
    const response = await fetch(endpoint, {
      method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000),
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.googleMapsUri,places.businessStatus,places.attributions" },
      body: JSON.stringify({ textQuery: `climbing shoe retailers near ${location}`, pageSize: 10, languageCode: "en" }),
    });
    if (response.status === 429) return Response.json({ error: "The shop provider's search limit was reached. Please try again later." }, { status: 429, headers });
    if (!response.ok) return Response.json({ error: "Shop search is unavailable. Please try again later." }, { status: 503, headers });
    const shops = parseShops(await response.json());
    return Response.json({ location, shops, demo }, { headers });
  } catch (error) {
    const timeout = error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name);
    return Response.json({ error: timeout ? "Shop search took too long. Please try again." : "Shop search is unavailable. Please try again later." }, { status: timeout ? 504 : 503, headers });
  }
}
