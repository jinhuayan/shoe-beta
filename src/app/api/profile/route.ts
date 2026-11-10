import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { choiceFields, measurementFields, validateQuestionnaire, type QuestionnaireField } from "@/lib/questionnaire";

const headers = { "Cache-Control": "private, no-store" };

async function handleProfile(request: Request) {
  try {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
    if (!session) return Response.json({ error: "Sign in to use your saved profile." }, { status: 401, headers });
    const userId = session.user.id;
    const db = getDb();

    if (request.method === "GET") {
      const saved = await db.climbingProfile.findUnique({ where: { userId } });
      if (!saved) return Response.json(null, { headers });
      const data = new FormData();
      for (const name of Object.keys({ ...measurementFields, ...choiceFields }) as QuestionnaireField[]) {
        data.set(name, saved[name] === null ? "" : String(saved[name]));
      }
      return Response.json(validateQuestionnaire(data), { headers });
    }

    if (request.headers.get("origin") !== auth.options.baseURL) {
      return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
    }
    let data: FormData;
    try {
      data = await request.formData();
    } catch {
      return Response.json({ error: "Submit questionnaire form data." }, { status: 400, headers });
    }
    const state = validateQuestionnaire(data);
    if (!state.profile) return Response.json(state, { status: 400, headers });
    await db.climbingProfile.upsert({
      where: { userId },
      create: { userId, ...state.profile },
      update: state.profile,
    });
    return Response.json(state, { headers });
  } catch {
    return Response.json({ error: "Saved profiles are unavailable. Please try again." }, { status: 503, headers });
  }
}

export { handleProfile as GET, handleProfile as PUT };
