// src/data/subjects.ts
import type { Subject } from "../types/school";

export const SUBJECTS: Subject[] = [
  // NOTE: `kazakh` is kept as legacy/demo code. Prefer `kazakh_lang` and `kazakh_lit`.
  { code: "kazakh", nameRu: "Казахский (общ.)", nameKk: "Қазақ тілі (жалпы)" },
  { code: "kazakh_lang", nameRu: "Казахский язык", nameKk: "Қазақ тілі" },
  {
    code: "kazakh_lit",
    nameRu: "Казахская литература",
    nameKk: "Қазақ әдебиеті",
  },
  { code: "russian", nameRu: "Русский язык", nameKk: "Орыс тілі" },
  { code: "english", nameRu: "Английский язык", nameKk: "Ағылшын тілі" },
  { code: "math", nameRu: "Математика", nameKk: "Математика" },
  { code: "informatics", nameRu: "Информатика", nameKk: "Информатика" },
  { code: "physics", nameRu: "Физика", nameKk: "Физика" },
  { code: "chemistry", nameRu: "Химия", nameKk: "Химия" },
  { code: "biology", nameRu: "Биология", nameKk: "Биология" },
  {
    code: "historyKZ",
    nameRu: "История Казахстана",
    nameKk: "Қазақстан тарихы",
  },
  {
    code: "worldHistory",
    nameRu: "Всемирная история",
    nameKk: "Дүниежүзі тарихы",
  },
  { code: "geography", nameRu: "География", nameKk: "География" },
];

// what we show in dropdowns by default
export const VISIBLE_SUBJECTS = SUBJECTS.filter((s) => s.code !== "kazakh");

export const getSubjectByCode = (code: string | undefined) =>
  SUBJECTS.find((s) => s.code === (code as any));
