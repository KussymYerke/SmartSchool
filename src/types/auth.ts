// src/types/auth.ts
export type UserRole = "deputy" | "teacher" | "psychologist";

export const ROLE_LABELS: Record<UserRole, string> = {
  deputy: "Завуч",
  teacher: "Мұғалім / Учитель",
  psychologist: "Психолог",
};
