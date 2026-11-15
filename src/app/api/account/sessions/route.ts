import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";

const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
    if (!session) return Response.json({ error: "Sign in to view your sessions." }, { status: 401, headers });
    const sessions = await getDb().session.findMany({
      where: { userId: session.user.id, expiresAt: { gt: new Date() } },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: { id: true, createdAt: true, expiresAt: true, userAgent: true },
    });
    return Response.json({ sessions: sessions.map((item) => ({ ...item, current: item.id === session.session.id })) }, { headers });
  } catch {
    return Response.json({ error: "Couldn't load your sessions. Please try again." }, { status: 503, headers });
  }
}

export async function POST(request: Request) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
    if (!session) return Response.json({ error: "Sign in to manage your sessions." }, { status: 401, headers });
    if (request.headers.get("origin") !== auth.options.baseURL) return Response.json({ error: "This request is not allowed." }, { status: 403, headers });
    const body = await request.json().catch(() => null);
    if (body?.allOthers === true && body.sessionId === undefined) {
      const response = await auth.api.revokeOtherSessions({ headers: request.headers, asResponse: true });
      response.headers.set("Cache-Control", headers["Cache-Control"]);
      return response;
    }
    if (typeof body?.sessionId !== "string" || body.allOthers !== undefined) return Response.json({ error: "Choose a session to sign out." }, { status: 400, headers });
    if (body.sessionId === session.session.id) return Response.json({ error: "Use Sign out to end your current session." }, { status: 400, headers });
    const other = await getDb().session.findFirst({ where: { id: body.sessionId, userId: session.user.id, expiresAt: { gt: new Date() } }, select: { token: true } });
    if (!other) return Response.json({ error: "Session not found." }, { status: 404, headers });
    const response = await auth.api.revokeSession({ headers: request.headers, body: { token: other.token }, asResponse: true });
    response.headers.set("Cache-Control", headers["Cache-Control"]);
    return response;
  } catch {
    return Response.json({ error: "Couldn't sign out the session. Please try again." }, { status: 503, headers });
  }
}
