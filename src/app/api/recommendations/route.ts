import { getDb } from "@/lib/db";
import { validateQuestionnaire } from "@/lib/questionnaire";
import { getRecommendationRules, recommendShoes } from "@/lib/recommendations";

export async function POST(request: Request) {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return Response.json({ error: "Submit questionnaire form data." }, { status: 400 });
  }

  const { profile, errors } = validateQuestionnaire(data);
  if (!profile) return Response.json({ error: "Check your questionnaire answers.", errors }, { status: 400 });
  if (!getRecommendationRules(profile).length) return Response.json(recommendShoes(profile, []));

  try {
    const shoes = await getDb().shoe.findMany({
      select: { slug: true, brand: true, model: true, isSample: true, downturn: true, stiffness: true },
    });
    return Response.json(recommendShoes(profile, shoes));
  } catch {
    return Response.json({ error: "The catalogue is unavailable. Please try again." }, { status: 503 });
  }
}
