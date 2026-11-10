"use server";

import { validateQuestionnaire, type QuestionnaireState } from "@/lib/questionnaire";

export async function reviewAnswers(_previous: QuestionnaireState, formData: FormData): Promise<QuestionnaireState> {
  return validateQuestionnaire(formData);
}
