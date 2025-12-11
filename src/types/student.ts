// src/data/students.ts

export type PsychSignals = {
  anxiety?: boolean; // тревожность по наблюдениям
  lowActivity?: boolean; // резкое снижение активности
  conflicts?: boolean; // конфликтные ситуации
  psychReports?: number; // кол-во записей от психолога
};

export type Student = {
  id: string;
  fullName: string;
  className: string;
  gender: "male" | "female";
  avgGrade: number;
  gradeTrend: number;
  absences: number;
  unexcusedAbsences: number;
  homeworkCompletion: number;
  teacherAlerts: number;
  lowActivity: boolean;
  subjectsAtRisk: string[];

  // 👇 новое
  needsPsych?: boolean;
  psychSignals?: PsychSignals;
};
