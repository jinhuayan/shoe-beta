import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { validateFitRecord } from "@/lib/fit-records";

const headers = { "Cache-Control": "private, no-store" };
const shoeSelect = { id: true, slug: true, brand: true, model: true, isSample: true } as const;
const recordSelect = { id: true, sizeEu: true, fit: true, rating: true, notes: true, createdAt: true, shoe: { select: shoeSelect } } as const;

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
    const { data, errors } = validateFitRecord(body);
    if (!data) return Response.json({ errors }, { status: 400, headers });
    if (!await db.shoe.findUnique({ where: { id: data.shoeId }, select: { id: true } })) {
      return Response.json({ errors: { shoeId: "Choose an available climbing shoe." } }, { status: 400, headers });
    }
    const record = await db.fitRecord.create({ data: { userId, ...data }, select: recordSelect });
    return Response.json({ record }, { status: 201, headers });
  } catch {
    return Response.json({ error: "Fit records are unavailable. Please try again." }, { status: 503, headers });
  }
}

export { handleRecords as GET, handleRecords as POST };
