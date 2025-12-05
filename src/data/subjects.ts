// src/data/subjects.ts
import type { Subject } from "../types/school";

export const SUBJECTS: Subject[] = [
  { code: "kazakh", nameRu: "Казахский язык", nameKk: "Қазақ тілі" },
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

export const getSubjectByCode = (code: string | undefined) =>
  SUBJECTS.find((s) => s.code === code);
