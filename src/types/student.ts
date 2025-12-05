// src/types/student.ts
import type { ClassName, SubjectCode, RiskLevel } from "./school";

export type Student = {
  id: string;
  fullName: string;
  className: ClassName;
  gender: "male" | "female";

  avgGrade: number;
  gradeTrend: number;
  absences: number;
  unexcusedAbsences: number;
  lowActivity: boolean;
  homeworkCompletion: number;
  teacherAlerts: number;

  subjectsAtRisk: SubjectCode[];
  riskLevel?: RiskLevel;
};
