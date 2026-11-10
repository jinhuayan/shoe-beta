export const measurementFields = {
  footLengthMm: { label: "Foot length (mm)", min: 100, max: 400, step: 0.1 },
  streetSizeEu: { label: "Street shoe size (EU)", min: 20, max: 55, step: 0.5 },
};

export const choiceFields = {
  width: {
    label: "Foot width",
    options: { UNKNOWN: "Unsure", NARROW: "Narrow", REGULAR: "Regular", WIDE: "Wide" },
  },
  toeShape: {
    label: "Toe shape",
    options: { UNKNOWN: "Unsure", BIG_TOE: "Big toe longest", SECOND_TOE: "Second toe longest", SQUARE: "First toes similar in length" },
  },
  heelVolume: {
    label: "Heel volume",
    options: { UNKNOWN: "Unsure", LOW: "Low / slim heel", REGULAR: "Regular", HIGH: "High / fuller heel" },
  },
  experience: {
    label: "Climbing experience",
    options: { UNKNOWN: "Unsure", BEGINNER: "Beginner", INTERMEDIATE: "Intermediate", ADVANCED: "Advanced" },
  },
  discipline: {
    label: "Main climbing style",
    options: { UNKNOWN: "Unsure", BOULDERING: "Bouldering", SPORT: "Sport climbing", TRAD: "Trad climbing", MIXED: "Mixed climbing" },
  },
  fitPreference: {
    label: "Fit preference",
    options: { UNKNOWN: "Unsure", COMFORT: "Comfort", BALANCED: "Balanced", PERFORMANCE: "Performance" },
  },
};

type ChoiceName = keyof typeof choiceFields;
export type QuestionnaireField = keyof typeof measurementFields | ChoiceName;
export type QuestionnaireProfile = {
  footLengthMm: number | null;
  streetSizeEu: number | null;
} & { [K in ChoiceName]: keyof (typeof choiceFields)[K]["options"] };

export type QuestionnaireState = {
  values: Partial<Record<QuestionnaireField, string>>;
  errors: Partial<Record<QuestionnaireField, string>>;
  profile: QuestionnaireProfile | null;
};

export function validateQuestionnaire(formData: FormData): QuestionnaireState {
  const values: QuestionnaireState["values"] = {};
  const errors: QuestionnaireState["errors"] = {};

  function read(name: QuestionnaireField) {
    const entries = formData.getAll(name);
    const value = entries[0];
    if (entries.length !== 1 || typeof value !== "string") {
      errors[name] = "Submit one answer for this field.";
    }
    const text = typeof value === "string" ? value.trim() : "";
    if (text.length > 100) errors[name] = "This answer is too long.";
    values[name] = text.slice(0, 100);
    return values[name];
  }

  function measurement(name: keyof typeof measurementFields) {
    const raw = read(name);
    if (!raw) return null;
    const { min, max, step } = measurementFields[name];
    const value = Number(raw);
    if (!/^\d+(\.\d+)?$/.test(raw) || !Number.isFinite(value) || value < min || value > max) {
      errors[name] = `Enter a number from ${min} to ${max}, or leave it blank.`;
    } else if (Math.abs(value / step - Math.round(value / step)) > 0.000001) {
      errors[name] = `Use increments of ${step}, or leave it blank.`;
    }
    return value;
  }

  function choice<K extends ChoiceName>(name: K): QuestionnaireProfile[K] {
    const value = read(name);
    if (!Object.hasOwn(choiceFields[name].options, value)) {
      errors[name] = "Choose an option, including Unsure.";
      return "UNKNOWN";
    }
    return value as QuestionnaireProfile[K];
  }

  const profile: QuestionnaireProfile = {
    footLengthMm: measurement("footLengthMm"),
    streetSizeEu: measurement("streetSizeEu"),
    width: choice("width"),
    toeShape: choice("toeShape"),
    heelVolume: choice("heelVolume"),
    experience: choice("experience"),
    discipline: choice("discipline"),
    fitPreference: choice("fitPreference"),
  };

  return { values, errors, profile: Object.keys(errors).length ? null : profile };
}
