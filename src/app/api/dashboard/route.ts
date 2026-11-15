import { serializeFittingDate } from "@/lib/fitting-context";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { choiceFields, measurementFields, validateQuestionnaire, type QuestionnaireField } from "@/lib/questionnaire";
import { getRecommendationRules, recommendShoes } from "@/lib/recommendations";
import { savedShoeProgress } from "@/lib/climbing-dashboard";

const headers = { "Cache-Control": "private, no-store" };
const shoeSelect = { id: true, slug: true, brand: true, model: true, isSample: true } as const;

export async function GET(request: Request) {
  try {
    const session = await getAuth().api.getSession({ headers: request.headers, query: { disableCookieCache: true } });
    if (!session) return Response.json({ error: "Sign in to view your climbing overview." }, { status: 401, headers });
    const userId = session.user.id;
    const db = getDb();
    const [savedProfile, groups, recent, photos, saved] = await Promise.all([
      db.climbingProfile.findUnique({ where: { userId } }),
      db.fitRecord.groupBy({ by: ["shoeId"], where: { userId }, _count: { id: true } }),
      db.fitRecord.findMany({ where: { userId }, take: 3, orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, sizeEu: true, fit: true, rating: true, triedOn: true, location: true, createdAt: true, shoe: { select: shoeSelect } } }),
      db.fitPhoto.count({ where: { record: { userId } } }),
      db.savedShoe.findMany({ where: { userId }, orderBy: [{ createdAt: "desc" }, { shoeId: "asc" }], select: { shoe: { select: shoeSelect } } }),
    ]);
    const answers = new FormData();
    if (savedProfile) for (const key of Object.keys({ ...choiceFields, ...measurementFields }) as QuestionnaireField[]) answers.set(key, savedProfile[key] === null ? "" : String(savedProfile[key]));
    const profile = savedProfile ? validateQuestionnaire(answers).profile : null;
    let recommendations = profile ? recommendShoes(profile, []) : null;
    if (profile && getRecommendationRules(profile).length) {
      const shoes = await db.shoe.findMany({ where: { isSample: false }, select: { slug: true, brand: true, model: true, isSample: true, downturn: true, stiffness: true, width: true, heelVolume: true } });
      recommendations = recommendShoes(profile, shoes);
    }
    return Response.json({
      profile, profileUpdatedAt: profile ? savedProfile!.updatedAt : null,
      summary: { fittings: groups.reduce((sum, group) => sum + group._count.id, 0), models: groups.length, photos, saved: saved.length },
      recent: recent.map((record) => ({ ...record, triedOn: serializeFittingDate(record.triedOn) })),
      saved: savedShoeProgress(saved.slice(0, 6).map(({ shoe }) => shoe), groups.map((group) => ({ shoeId: group.shoeId, count: group._count.id }))),
      recommendations,
    }, { headers });
  } catch {
    return Response.json({ error: "Your climbing overview is unavailable. Please try again." }, { status: 503, headers });
  }
}
