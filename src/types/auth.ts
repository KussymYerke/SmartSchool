// src/types/auth.ts

export type UserRole = "deputy" | "teacher" | "class_teacher" | "psychologist";

export const ROLE_LABELS: Record<UserRole, string> = {
  deputy: "Завуч",
  teacher: "Мұғалім / Учитель",
  class_teacher: "Классный руководитель",
  psychologist: "Психолог",
};
