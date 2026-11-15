import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getSizeReference } from "@/lib/shoe-sizing";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
    if (!session) return Response.json({ error: "Sign in to view your shoe details." }, { status: 401, headers });
    const { slug } = await params;
    if (!slug || slug.length > 100) return Response.json({ error: "Choose a climbing shoe." }, { status: 400, headers });
    const db = getDb();
    const shoe = await db.shoe.findUnique({ where: { slug }, select: { id: true, slug: true, isSample: true } });
    if (!shoe) return Response.json({ error: "Climbing shoe not found." }, { status: 404, headers });
    const userId = session.user.id;
    const [saved, profile] = await Promise.all([
      db.savedShoe.findUnique({ where: { userId_shoeId: { userId, shoeId: shoe.id } }, select: { shoeId: true } }),
      db.climbingProfile.findUnique({ where: { userId }, select: { streetSizeEu: true, fitPreference: true, updatedAt: true } }),
    ]);
    return Response.json({ saved: !!saved, reference: profile ? getSizeReference(shoe, profile) : null, profileUpdatedAt: profile?.updatedAt ?? null }, { headers });
  } catch {
    return Response.json({ error: "Your personal shoe details are unavailable. Please try again." }, { status: 503, headers });
  }
}
