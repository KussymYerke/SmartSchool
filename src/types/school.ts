// src/types/school.ts

export type Student = {
  id: string;
  fullName: string;
  className: string;
  gender: "male" | "female";
  avgGrade: number;
  gradeTrend: number;
  absences: number;
  unexcusedAbsences: number;
  lowActivity: boolean;
  homeworkCompletion: number;
  teacherAlerts: number;
  subjectsAtRisk: string[];
};

export type ClassName =
  | "7A"
  | "8A"
  | "8B"
  | "9A"
  | "9B"
  | "10A"
  | "10B"
  | "11A"
  | "11B";

export type SubjectCode =
  | "kazakh"
  | "russian"
  | "english"
  | "math"
  | "informatics"
  | "physics"
  | "chemistry"
  | "biology"
  | "historyKZ"
  | "worldHistory"
  | "geography";

// --- MAIN RISK LEVEL SOURCE ---
export type RiskLevel = "high" | "medium" | "low" | "none";

export const riskColorClass: Record<RiskLevel, string> = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-blue-500/20 text-blue-400",
  none: "bg-slate-700 text-slate-300",
};

export const riskLabel: Record<RiskLevel, string> = {
  high: "Жоғары / Высокий",
  medium: "Орташа / Средний",
  low: "Төмен / Низкий",
  none: "Жоқ / Нет риска",
};

// --- SUBJECT INFO ---
export type Subject = {
  code: SubjectCode;
  nameRu: string;
  nameKk: string;
};
