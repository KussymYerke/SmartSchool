export type QuarterKey = "Q1" | "Q2";

export type AssessmentKind = "SOR" | "SOCH";

export type AssessmentSubject = {
  code: string; // стабильный ключ (для данных)
  title: string; // отображаемое название
  hasSOCH: boolean; // есть ли СОЧ помимо СОР
};

// ЕДИНЫЙ СПИСОК ДЛЯ ВСЕХ КЛАССОВ:
export const ASSESSMENT_SUBJECTS: AssessmentSubject[] = [
  { code: "kz_lang", title: "Казахский язык", hasSOCH: true },
  { code: "kz_lit", title: "Казахский адебиет", hasSOCH: true },
  { code: "physics", title: "Физика", hasSOCH: true },
  { code: "chem", title: "Химия", hasSOCH: true },
  { code: "bio", title: "Биология", hasSOCH: true },
  { code: "eng", title: "Английский язык", hasSOCH: true },
  { code: "ru", title: "Русский язык", hasSOCH: true },
  { code: "algebra", title: "Алгебра", hasSOCH: true },
  { code: "history", title: "Казахстан тарих", hasSOCH: true },

  // Остальные предметы — только СОР (пример, добавь свои)
  { code: "geo", title: "География", hasSOCH: false },
  { code: "cs", title: "Информатика", hasSOCH: false },
  { code: "pe", title: "Физкультура", hasSOCH: false },
  { code: "art", title: "ИЗО / Труд", hasSOCH: false },
];

export const QUARTERS: QuarterKey[] = ["Q1", "Q2"];
