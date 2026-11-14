import { getAuth } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";
import { validateFitRecord } from "@/lib/fit-records";

const headers = { "Cache-Control": "private, no-store" };
const shoeSelect = { id: true, slug: true, brand: true, model: true, isSample: true } as const;
const recordSelect = { photo: { select: { recordId: true } }, id: true, sizeEu: true, fit: true, toeFit: true, forefootFit: true, heelFit: true, rating: true, notes: true, createdAt: true, shoe: { select: shoeSelect } } as const;

async function handleRecords(request: Request) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
    if (!session) return Response.json({ error: "Sign in to use your fit records." }, { status: 401, headers });
    const userId = session.user.id;
    const db = getDb();

    if (request.method === "GET") {
      const [records, shoes] = await Promise.all([
        db.fitRecord.findMany({ where: { userId }, select: recordSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }] }),
        db.shoe.findMany({ select: shoeSelect, orderBy: [{ brand: "asc" }, { model: "asc" }, { slug: "asc" }] }),
      ]);
      return Response.json({ records, shoes }, { headers });
    }

    if (request.headers.get("origin") !== auth.options.baseURL) {
      return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Submit fit record details as JSON." }, { status: 400, headers });
    }
    const id = body && typeof body === "object" && "id" in body ? body.id : undefined;
    if (request.method === "PATCH" || request.method === "DELETE") {
      if (typeof id !== "string" || !id.trim() || id.length > 100) {
        return Response.json({ error: "Choose a fit record." }, { status: 400, headers });
      }
      if (request.method === "DELETE") {
        const owned = await db.fitRecord.findFirst({ where: { id, userId }, select: { photo: { select: { recordId: true } } } });
        if (owned?.photo) return Response.json({ error: "Remove the photo before deleting this fit record." }, { status: 409, headers });
        const deleted = await db.fitRecord.deleteMany({ where: { id, userId } });
        return deleted.count ? Response.json({ deleted: true }, { headers })
          : Response.json({ error: "Fit record not found." }, { status: 404, headers });
      }
    }
    const { data, errors } = validateFitRecord(body);
    if (!data) return Response.json({ errors }, { status: 400, headers });
    if (!await db.shoe.findUnique({ where: { id: data.shoeId }, select: { id: true } })) {
      return Response.json({ errors: { shoeId: "Choose an available climbing shoe." } }, { status: 400, headers });
    }
    if (request.method === "PATCH") {
      const record = await db.fitRecord.update({ where: { id: id as string, userId }, data, select: recordSelect });
      return Response.json({ record }, { headers });
    }
    const record = await db.fitRecord.create({ data: { userId, ...data }, select: recordSelect });
    return Response.json({ record }, { status: 201, headers });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025" && request.method === "PATCH") {
      return Response.json({ error: "Fit record not found." }, { status: 404, headers });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003" && request.method === "DELETE") {
      return Response.json({ error: "Remove the photo before deleting this fit record." }, { status: 409, headers });
    }
    return Response.json({ error: "Fit records are unavailable. Please try again." }, { status: 503, headers });
  }
}

export { handleRecords as GET, handleRecords as POST, handleRecords as PATCH, handleRecords as DELETE };
