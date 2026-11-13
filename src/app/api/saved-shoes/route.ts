import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { savedShoeSlugs } from "@/lib/saved-shoes";

const headers = { "Cache-Control": "private, no-store" };
const shoeSelect = { id: true, slug: true, brand: true, model: true, isSample: true } as const;

async function savedShoes(request: Request) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
    if (!session) return Response.json({ error: "Sign in to use your saved shoes." }, { status: 401, headers });
    const userId = session.user.id;
    const db = getDb();
    if (request.method === "GET") {
      const [saved, shoes] = await Promise.all([
        db.savedShoe.findMany({ where: { userId }, select: { createdAt: true, shoe: { select: shoeSelect } }, orderBy: [{ createdAt: "desc" }, { shoeId: "asc" }] }),
        db.shoe.findMany({ where: { isSample: false }, select: shoeSelect, orderBy: [{ brand: "asc" }, { model: "asc" }] }),
      ]);
      return Response.json({ saved, shoes }, { headers });
    }
    if (request.headers.get("origin") !== auth.options.baseURL) return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
    let body: unknown;
    try { body = await request.json(); }
    catch { return Response.json({ error: "Submit saved shoes as JSON." }, { status: 400, headers }); }
    if (request.method === "DELETE") {
      const shoeId = body && typeof body === "object" && "shoeId" in body ? body.shoeId : undefined;
      if (typeof shoeId !== "string" || !shoeId.trim() || shoeId.length > 100) return Response.json({ error: "Choose a saved shoe." }, { status: 400, headers });
      const result = await db.savedShoe.deleteMany({ where: { userId, shoeId } });
      return result.count ? Response.json({ removed: true }, { headers }) : Response.json({ error: "Saved shoe not found." }, { status: 404, headers });
    }
    const slugs = savedShoeSlugs(body);
    if (!slugs) return Response.json({ error: "Choose one to three climbing shoes." }, { status: 400, headers });
    const shoes = await db.shoe.findMany({ where: { slug: { in: slugs }, isSample: false }, select: { id: true } });
    if (shoes.length !== slugs.length) return Response.json({ error: "Choose shoes currently in the public catalogue." }, { status: 400, headers });
    const result = await db.savedShoe.createMany({ data: shoes.map(({ id }) => ({ userId, shoeId: id })), skipDuplicates: true });
    return Response.json({ added: result.count }, { headers });
  } catch {
    return Response.json({ error: "Saved shoes are unavailable. Please try again." }, { status: 503, headers });
  }
}

export { savedShoes as GET, savedShoes as POST, savedShoes as DELETE };
