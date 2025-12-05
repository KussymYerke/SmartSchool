// src/types/school.ts

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

export type RiskLevel = "low" | "medium" | "high";

export type Student = {
  id: string;
  fullName: string;
  className: ClassName;
  gender: "male" | "female";
  // показатели для AI-мониторинга
  avgGrade: number;            // средний балл
  gradeTrend: number;          // изменение среднего балла за последний период (в пунктах)
  absences: number;            // количество пропусков за четверть
  unexcusedAbsences: number;   // количество пропусков без уважительной причины
  lowActivity: boolean;        // низкая активность / вовлеченность
  homeworkCompletion: number;  // % выполненных ДЗ
  teacherAlerts: number;       // сколько раз учителя отмечали "есть проблема"
  subjectsAtRisk: SubjectCode[]; // по каким предметам провалы
};

export type Subject = {
  code: SubjectCode;
  nameRu: string;
  nameKk: string;
};
