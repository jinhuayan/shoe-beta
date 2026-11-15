import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

const headers = { "Cache-Control": "private, no-store" };
const shoe = { select: { slug: true, brand: true, model: true } } as const;

export async function GET(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
    if (!session) return Response.json({ error: "Sign in to download your data." }, { status: 401, headers });
    const userId = session.user.id;
    const [profile, savedShoes, records] = await getDb().$transaction([
      getDb().climbingProfile.findUnique({ where: { userId }, select: { footLengthMm: true, streetSizeEu: true, width: true, toeShape: true, heelVolume: true, experience: true, discipline: true, fitPreference: true, updatedAt: true } }),
      getDb().savedShoe.findMany({ where: { userId }, orderBy: [{ createdAt: "asc" }, { shoeId: "asc" }], select: { createdAt: true, shoe } }),
      getDb().fitRecord.findMany({ where: { userId }, orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { sizeEu: true, fit: true, toeFit: true, forefootFit: true, heelFit: true, rating: true, notes: true, createdAt: true, updatedAt: true, shoe, photo: { select: { recordId: true } } } }),
    ]);
    return Response.json({
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      account: { name: session.user.name, email: session.user.email, createdAt: session.user.createdAt },
      profile,
      savedShoes,
      fitRecords: records.map(({ photo, ...record }) => ({ ...record, photoAttached: photo !== null })),
    }, { headers: { ...headers, "Content-Disposition": 'attachment; filename="shoe-beta-backup.json"', "X-Content-Type-Options": "nosniff" } });
  } catch {
    return Response.json({ error: "Couldn't download your data. Please try again." }, { status: 503, headers });
  }
}
