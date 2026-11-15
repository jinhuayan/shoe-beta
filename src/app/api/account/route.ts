import { getAuth } from "@/lib/auth";
import { accountName } from "@/lib/account";

const headers = { "Cache-Control": "private, no-store" };

export async function PATCH(request: Request) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
    if (!session) return Response.json({ error: "Sign in to update your account." }, { status: 401, headers });
    if (request.headers.get("origin") !== auth.options.baseURL) return Response.json({ error: "This request is not allowed." }, { status: 403, headers });
    const body = await request.json().catch(() => null);
    const name = accountName(body?.name);
    if (!name) return Response.json({ error: "Use 1–100 characters for your name." }, { status: 400, headers });
    const response = await auth.api.updateUser({ headers: request.headers, body: { name }, asResponse: true });
    response.headers.set("Cache-Control", headers["Cache-Control"]);
    return response;
  } catch {
    return Response.json({ error: "Couldn't update your account. Please try again." }, { status: 503, headers });
  }
}
